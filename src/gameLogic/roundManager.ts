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
import { EnemyUnitInstance, RoundDef } from "./RoundDef";
import { AttackReport } from "@/stats/AttackReport";
import { Unit } from "@/units/Unit";
import { GameObject } from "@/ecs/GameObject";

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
  roundState: RoundState = RoundState.Inactive;
  currentRound: number = 1;
  roundDef: RoundDef | null = null;
  player: Player | undefined;

  private unitManager: UnitManager;
  private goManager: GameObjectManager;
  private placementSystem: UnitPlacementSystemHandle;
  private scene: THREE.Scene;
  private world: RAPIER.World;
  private projManager: ProjectileManager;

  private roundTimer: number = 0;
  private earlyWinCheckTimer: number = 0;
  private hasSpawnedEnemies: boolean = false;
  private hasProcessedBattleOutcome: boolean = false;

  private _boundEnemyDeathHandler: (payload: any) => void;
  private _boundTakeDamageHandler: (payload: any) => void;
  private _enemyInstanceMap: Map<Unit, EnemyUnitInstance> = new Map();

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

    this._boundEnemyDeathHandler = this.handleEnemyDeath.bind(this);
    this._boundTakeDamageHandler = this.handleTakeDamage.bind(this);
  }

  private handleEnemyDeath(payload: {
    killed: Unit;
    killer: GameObject | null;
  }): void {
    const { killed, killer } = payload;
    const killerUnit = killer?.getComponent(Unit);
    if (!killerUnit || !this.player || killerUnit.teamId !== this.player.id) {
      return;
    }
    const enemyInstance = this._enemyInstanceMap.get(killed);
    if (!enemyInstance) return;

    const expValue = enemyInstance.unit.blueprint.stats.expValue;
    if (expValue > 0 && enemyInstance.attackers.length > 0) {
      const expPerAttacker = expValue / enemyInstance.attackers.length;
      for (const attacker of enemyInstance.attackers) {
        attacker.grantExp(expPerAttacker);
      }
    }
  }

  private handleTakeDamage({
    gameObject,
    damageReport,
  }: {
    gameObject: GameObject;
    damageReport: AttackReport;
  }): void {
    if (!damageReport.attacker) return;
    const enemyUnit = gameObject.getComponent(Unit);
    if (!enemyUnit) return;

    const enemyInstance = this._enemyInstanceMap.get(enemyUnit);
    const attackerUnit = damageReport.attacker.getComponent(Unit);
    if (
      enemyInstance &&
      attackerUnit &&
      !enemyInstance.attackers.includes(attackerUnit)
    ) {
      enemyInstance.attackers.push(attackerUnit);
    }
  }

  startGame(player: Player) {
    this.player = player;
    this.currentRound = 1;
    this.setRoundState(RoundState.InitialShop);
  }

  public startFirstRound(): void {
    if (this.roundState === RoundState.InitialShop) {
      this.setRoundState(RoundState.Setup);
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
    this._enemyInstanceMap.clear();
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
      case RoundState.Setup:
        this.resetPhaseFlags();
        // Disable rigidbodies of dead units before the next round starts
        if (this.player) {
          this.unitManager.units.forEach((unit) => {
            if (
              unit.teamId === this.player?.id &&
              unit.healthComponent.isDead
            ) {
              const body = unit.gameObject.getComponent(CharacterRigidbody);
              body?.body.setEnabled(false);
            }
          });
        }

        // Spawn enemies for the new round
        if (this.unitManager && !this.hasSpawnedEnemies) {
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

          if (this.roundDef.enemies) {
            for (const enemyInstance of this.roundDef.enemies) {
              this._enemyInstanceMap.set(enemyInstance.unit, enemyInstance);
              enemyInstance.unit.gameObject.on(
                "death",
                this._boundEnemyDeathHandler
              );
              enemyInstance.unit.gameObject.on(
                "takeDamage",
                this._boundTakeDamageHandler
              );
            }
          }
        }
        break;
      case RoundState.Battle:
        this.unitManager.setTargets();
        this.unitManager.enableAllUnits();
        break;
      case RoundState.End:
        this.unitManager.disableAllUnits();
        // Re-enable all player rigidbodies so they can be moved
        if (this.player) {
          this.unitManager.units.forEach((unit) => {
            if (unit.teamId === this.player?.id) {
              const body = unit.gameObject.getComponent(CharacterRigidbody);
              body?.body.setEnabled(true);
            }
          });
        }
        this.roundTimer = END_TIME;
        break;
      case RoundState.Enlist:
        // Move all units back to their grid positions now that their bodies are enabled
        if (this.player) {
          this.unitManager.units.forEach((unit) => {
            if (unit.teamId === this.player?.id) {
              const body = unit.gameObject.getComponent(CharacterRigidbody);
              body?.setPosition(unit.gridPosition);
            }
          });
        }
        this.roundTimer = END_TIME;
        break;
      case RoundState.Shop:
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
    if (state === RoundState.Battle || state === RoundState.End) {
      if (this.roundDef?.enemies) {
        for (const enemyInstance of this.roundDef.enemies) {
          enemyInstance.unit.gameObject.off(
            "death",
            this._boundEnemyDeathHandler
          );
          enemyInstance.unit.gameObject.off(
            "takeDamage",
            this._boundTakeDamageHandler
          );
        }
      }
    }
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
    } else if (
      this.roundState === RoundState.End ||
      this.roundState === RoundState.Shop ||
      this.roundState === RoundState.Enlist
    ) {
      this.roundTimer -= delta;
      if (this.roundTimer <= 0) {
        this.handleTimerEnd();
      }
    }
  }

  private handleTimerEnd() {
    this.onExit(this.roundState);

    // If we were in the End state, determine the outcome
    if (this.roundState === RoundState.End) {
      const won = this.determineBattleOutcome();
      // Remove enemy units
      this.unitManager.units.forEach((unit) => {
        if (unit.teamId === ENEMY_TEAM_ID) {
          this.unitManager.removeUnit(unit);
        }
      });

      if (won) {
        this.currentRound++;
        const goldReward = 100 + (this.currentRound - 1) * 10;
        if (this.player) {
          this.player.gold += goldReward;
          this.onStateChange({ playerGold: this.player.gold });
        }
        this.setRoundState(RoundState.Enlist);
      } else {
        this.setRoundState(RoundState.Inactive);
      }
    } else if (this.roundState === RoundState.Enlist) {
      this.setRoundState(RoundState.Shop);
    } else if (this.roundState === RoundState.Shop) {
      this.setRoundState(RoundState.Setup);
    }
  }
}
