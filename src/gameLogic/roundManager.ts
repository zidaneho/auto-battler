import { UnitPlacementSystemHandle } from "@/components/UnitPlacementSystem";
import { CharacterRigidbody } from "@/physics/CharacterRigidbody";
import { GameObjectManager } from "@/ecs/GameObjectManager";
import { ProjectileManager } from "@/projectiles/ProjectileManager";
import { spawnEnemyWave } from "@/gameLogic/enemySpawner";
import { ENEMY_TEAM_ID } from "@/gameLogic/enemySpawner";
import { UnitManager } from "@/units/UnitManager";
import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Player } from "@/types/gameTypes";

export enum RoundState {
    Inactive,
    Setup,
    Battle,
    Shop,
    End,
}

const BATTLE_TIME = 60;
const END_TIME = 5;
const SETUP_TIME = 30;

const calculateBudget = (round: number) => 1 + round - 1;

export class RoundManager {
    // Public state
    roundState: RoundState = RoundState.Inactive;
    currentRound: number = 1;

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
    private player: Player | undefined;

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
        this.setRoundState(RoundState.Setup);
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

        this.onStateChange({ roundState: this.roundState, roundTimer: this.roundTimer, currentRound: this.currentRound });
    }

    private onEnter(state: RoundState) {
        switch (state) {
            case RoundState.Setup:
                this.resetPhaseFlags();
                this.roundTimer = SETUP_TIME;
                if (this.unitManager && !this.hasSpawnedEnemies) {
                    // Reconstruct a 'systems' object for the external function call
                    spawnEnemyWave({
                        budget: calculateBudget(this.currentRound),
                        currentRound: this.currentRound,
                        unitManager:this.unitManager,
                        gameObjectManager:this.goManager,
                        placementSystem:this.placementSystem,
                        scene:this.scene,
                        world:this.world,
                        projectileManager:this.projManager,
                    });
                    this.hasSpawnedEnemies = true;
                }
                break;
            case RoundState.Battle:
                this.roundTimer = BATTLE_TIME;
                this.unitManager.setTargets();
                this.unitManager.playAllUnits();
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

        this.roundTimer -= delta;

        if (this.roundState === RoundState.Battle && !this.hasProcessedBattleOutcome) {
            this.earlyWinCheckTimer -= delta;
            if (this.earlyWinCheckTimer <= 0) {
                this.earlyWinCheckTimer = 0.5;
                const playerAlive = this.player ? this.unitManager.getAliveUnits(this.player.id) : 0;
                const enemyAlive = this.unitManager.getAliveUnits(ENEMY_TEAM_ID);
                if (playerAlive === 0 || enemyAlive === 0) {
                    this.hasProcessedBattleOutcome = true;
                    this.roundTimer = 0;
                }
            }
        }
        
        if (this.roundTimer <= 0) {
            this.handleTimerEnd();
        }
    }

    private handleTimerEnd() {
        switch (this.roundState) {
            case RoundState.Setup:
                this.setRoundState(RoundState.Battle);
                break;
            case RoundState.Battle:
                this.setRoundState(RoundState.End);
                break;
            case RoundState.End:
                const won = this.determineBattleOutcome();
                
                this.unitManager.units.forEach((unit) => {
                    if (unit.teamId !== this.player?.id) {
                        this.unitManager.removeUnit(unit);
                    } else {
                        const body = unit.gameObject.getComponent(CharacterRigidbody);
                        body?.setPosition(unit.gridPosition);
                    }
                });

                if (won) {
                    this.currentRound++;
                    const goldReward = 100 * (this.currentRound - 1);
                    if (this.player) {
                        this.player.gold += goldReward;
                    }
                    this.setRoundState(RoundState.Setup);
                } else {
                    this.setRoundState(RoundState.Inactive);
                }
                break;
        }
    }
}