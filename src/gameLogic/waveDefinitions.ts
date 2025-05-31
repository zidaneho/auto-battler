// src/gameLogic/waveDefinitions.ts
import { UnitBlueprint } from '@/components/UnitBlueprint';
import { knightBlueprint, archerBlueprint, priestBlueprint } from '@/components/UnitBlueprintList'; // Assuming these are your base units

export interface EnemySpawnConfig {
  blueprint: UnitBlueprint; // Which unit to spawn
  count: number;          // How many of this unit
  // Optional: specific spawn rows/patterns or offsets if needed later
}

export interface WaveDefinition {
  waveNumber: number; // Corresponds to currentRound
  enemies: EnemySpawnConfig[];
  goldReward?: number; // Gold player gets for clearing this wave
  // You could add more wave-specific properties here, like:
  // - timeLimit?: number;
  // - specialModifiers?: string[]; // e.g., "enemies_faster", "melee_only"
}

// Example Wave Definitions
export const waveDefinitions: WaveDefinition[] = [
  {
    waveNumber: 1,
    enemies: [
      { blueprint: knightBlueprint, count: 2 },
    ],
    goldReward: 10,
  },
  {
    waveNumber: 2,
    enemies: [
      { blueprint: knightBlueprint, count: 1 },
      { blueprint: archerBlueprint, count: 1 },
    ],
    goldReward: 15,
  },
  {
    waveNumber: 3,
    enemies: [
      { blueprint: knightBlueprint, count: 2 },
      { blueprint: archerBlueprint, count: 1 },
    ],
    goldReward: 20,
  },
  {
    waveNumber: 4,
    enemies: [
      { blueprint: knightBlueprint, count: 2 },
      { blueprint: archerBlueprint, count: 2 },
    ],
    goldReward: 25,
  },
  {
    waveNumber: 5, // Mini-boss wave?
    enemies: [
      { blueprint: knightBlueprint, count: 1 }, // A stronger knight (you might create a new blueprint)
      { blueprint: priestBlueprint, count: 1 }, // Enemy priest
    ],
    goldReward: 50,
  },
  // Add more waves with increasing difficulty and variety
];

// Helper function to get the current wave definition
export const getWaveDefinition = (currentRound: number): WaveDefinition | undefined => {
  return waveDefinitions.find(wave => wave.waveNumber === currentRound);
  // Or, for endless mode, you might generate waves procedurally after a certain point
  // e.g., if (!def && currentRound > maxDefinedWave) { return generateProceduralWave(currentRound); }
};