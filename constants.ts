import { Item, Mob } from './types';

export const TICK_RATE_MS = 1000;
export const MAX_TIME_SECONDS = 900; // 15 minutes

export const ROOM_PREFIXES = [
  "Damp", "Obsidian", "Crumbling", "Echoing", "Ancient", "Forgotten", "Crystal", "Burning", "Frozen", "Void"
];

export const ROOM_TYPES = [
  "Shaft", "Cavern", "Outcropping", "Ledge", "Burrow", "Catacomb", "Chamber", "Hall", "Pit"
];

export const MOB_NAMES = {
  easy: ["Giant Rat", "Slime", "Bat", "Kobold Runt"],
  medium: ["Goblin Sentry", "Skeleton Warrior", "Orc Grunt", "Shadow Wolf"],
  hard: ["Orc Berserker", "Cave Troll", "Dark Cultist", "Void Construct"],
  boss: ["Shaft Guardian", "Lich Lord", "Broodmother", "Abyssal Horror"]
};

export const LOOT_PREFIXES = [
  "Rusted", "Iron", "Steel", "Reinforced", "Enchanted", "Glowing", "Shadow", "Void"
];

export const BASE_ITEMS: Item[] = [
  { id: '1', name: 'Rusty Dagger', type: 'weapon', rarity: 'common', value: 5, description: 'Better than nothing.', stats: { damage: 2 } },
  { id: '2', name: 'Tattered Tunic', type: 'armor', rarity: 'common', value: 5, description: 'Barely holds together.', stats: { armor: 1 } },
];
