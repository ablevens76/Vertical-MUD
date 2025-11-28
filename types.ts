export enum ClassType {
  WARRIOR = 'Warrior',
  MAGE = 'Mage',
  ROGUE = 'Rogue'
}

export enum Stat {
  STR = 'STR',
  INT = 'INT',
  DEX = 'DEX'
}

export interface Player {
  name: string;
  classType: ClassType;
  level: number;
  xp: number;
  xpToNext: number;
  
  // Vitals
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  move: number;
  maxMove: number;

  // Stats
  str: number;
  int: number;
  dex: number;

  inventory: Item[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };

  gold: number;
}

export interface Mob {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
  xpValue: number;
  isAggro: boolean;
  type: 'beast' | 'humanoid' | 'undead' | 'boss';
  loot: Item[];
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  stats?: {
    str?: number;
    int?: number;
    dex?: number;
    armor?: number;
    damage?: number;
  };
  value: number;
  description: string;
}

export interface Room {
  id: string;
  depth: number;
  name: string;
  description: string;
  mobs: Mob[];
  items: Item[]; // Items on the floor
  exits: {
    up: boolean;
    down: boolean;
  };
  visited: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'combat' | 'info' | 'loot' | 'danger' | 'gain';
  timestamp: number;
}

export enum GamePhase {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
}