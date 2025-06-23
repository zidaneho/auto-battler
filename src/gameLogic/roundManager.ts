// src/gameLogic/roundManager.ts

import { UnitPlacementSystemHandle } from "@/units/UnitPlacementSystem";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { spawnEnemyWave } from "@/gameLogic/enemySpawner";
import { ENEMY_TEAM_ID } from "@/gameLogic/enemySpawner";
import { UnitManager } from "@/units/UnitManager";
import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Player } from "@/types/gameTypes";
import { RoundDef } from "./RoundDef";

export enum RoundState {
  Inactive,
  InitialShop,
  Setup,
  Battle,
  Shop,
  Enlist,
  End,
}

const END_TIME = 5;

const calculateBudget = (round: number) => 1 + round - 1;

export class RoundManager {
  // Public state
  roundState: RoundState = RoundState.Inactive;
  currentRound: number = 1;
  roundDef: RoundDef | null = null;
  player: Player | undefined;

  // System Components (now direct members)
  private unitManager: UnitManager;
  private goManager: GameObjectManager;
  private placementSystem: UnitPlacementSystemHandle;
  private scene: THREE.Scene;
  private world: RAPIER.World;
  private projManager: ProjectileManager;

  // Private state
  private roundTimer: number = 0;
  private earlyWinCheckTimer: number = 0;

  // Flags
  private hasSpawnedEnemies: boolean = false;
  private hasProcessedBattleOutcome: boolean = false;

  // A callback to notify the UI layer of changes
  private onStateChange: (newState: any) => void;

  constructor(
    unitManager: UnitManager,
    goManager: GameObjectManager,
    placementSystem: UnitPlacementSystemHandle,
    scene: THREE.Scene,
    world: RAPIER.World,
    projManager: ProjectileManager,
    onStateChange: (newState: any) => void
  ) {
    this.unitManager = unitManager;
    this.goManager = goManager;
    this.placementSystem = placementSystem;
    this.scene = scene;
    this.world = world;
    this.projManager = projManager;
    this.onStateChange = onStateChange;
  }

  startGame(player: Player) {
    this.player = player;
    this.currentRound = 1;
    this.setRoundState(RoundState.InitialShop);
  }
  public startFirstRound(): void {
    if (this.roundState === RoundState.InitialShop) {
      this.setRoundState(RoundState.Setup);
      console.log("set to setup");
    }
  }

  proceedToShop() {
    if (this.roundState === RoundState.Enlist) {
      this.setRoundState(RoundState.Shop);
    }
  }

  endShopPhase() {
    if (this.roundState === RoundState.Shop) {
      this.setRoundState(RoundState.Setup);
    }
  }

  private resetPhaseFlags() {
    this.hasSpawnedEnemies = false;
    this.hasProcessedBattleOutcome = false;
  }

  private determineBattleOutcome(): boolean {
    if (!this.player) return false;
    const playerAlive = this.unitManager.getAliveUnits(this.player.id);
    const enemyAlive = this.unitManager.getAliveUnits(ENEMY_TEAM_ID);
    return playerAlive > 0 && enemyAlive === 0;
  }

  setRoundState(state: RoundState) {
    const oldState = this.roundState;
    if (oldState === state) return;

    this.onExit(oldState);
    this.roundState = state;
    this.onEnter(state);

    this.onStateChange({
      roundState: this.roundState,
      currentRound: this.currentRound,
    });
  }

  private onEnter(state: RoundState) {
    switch (state) {
      case RoundState.InitialShop:
        break;
      case RoundState.Setup:
        this.resetPhaseFlags();
        if (this.unitManager && !this.hasSpawnedEnemies) {
          // Reconstruct a 'systems' object for the external function call
          this.roundDef = spawnEnemyWave({
            budget: calculateBudget(this.currentRound),
            currentRound: this.currentRound,
            unitManager: this.unitManager,
            gameObjectManager: this.goManager,
            placementSystem: this.placementSystem,
            scene: this.scene,
            world: this.world,
            projectileManager: this.projManager,
          });
          this.hasSpawnedEnemies = true;
        }
        break;
      case RoundState.Battle:
        this.unitManager.setTargets();
        this.unitManager.playAllUnits();
        break;
      case RoundState.Shop:
        break;
      case RoundState.Enlist:
        break;
      case RoundState.End:
        this.roundTimer = END_TIME;
        break;
      case RoundState.Inactive:
        this.unitManager.clearAllUnits();
        console.log(`Game Over! You reached Round ${this.currentRound}.`);
        this.onStateChange({ isGameActive: false });
        break;
    }
  }

  private onExit(state: RoundState) {
    // Cleanup if needed when exiting a state
  }

  update(delta: number): void {
    if (this.roundState === RoundState.Inactive) return;

    if (
      this.roundState === RoundState.Battle &&
      !this.hasProcessedBattleOutcome
    ) {
      this.earlyWinCheckTimer -= delta;
      if (this.earlyWinCheckTimer <= 0) {
        this.earlyWinCheckTimer = 0.5;
        const playerAlive = this.player
          ? this.unitManager.getAliveUnits(this.player.id)
          : 0;
        const enemyAlive = this.unitManager.getAliveUnits(ENEMY_TEAM_ID);
        if (playerAlive === 0 || enemyAlive === 0) {
          this.hasProcessedBattleOutcome = true;
          this.setRoundState(RoundState.End);
        }
      }
    } else if (this.roundState === RoundState.End) {
      this.roundTimer -= delta;
      if (this.roundTimer <= 0) {
        this.handleTimerEnd();
      }
    }
  }

  private handleTimerEnd() {
    const won = this.determineBattleOutcome();

    this.unitManager.units.forEach((unit) => {
      if (unit.teamId !== this.player?.id) {
        this.unitManager.removeUnit(unit);
      } else {
        const body = unit.gameObject.getComponent(CharacterRigidbody);
        body?.setPosition(unit.gridPosition);
      }
      unit.enabled = false;
    });
    if (won) {
      this.currentRound++;
      const goldReward = 100 * (this.currentRound - 1);
      if (this.player) {
        this.player.gold += goldReward;
        this.onStateChange({ playerGold: this.player.gold });
      }
      this.setRoundState(RoundState.Enlist);
    } else {
      this.setRoundState(RoundState.Inactive);
    }
  }
}
