import { Mob, Item, Room } from '../types';
import { ROOM_PREFIXES, ROOM_TYPES, MOB_NAMES, LOOT_PREFIXES } from '../constants';

const uuid = () => Math.random().toString(36).substring(2, 9);

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateItem = (level: number): Item => {
  const roll = Math.random();
  let rarity: Item['rarity'] = 'common';
  if (roll > 0.95) rarity = 'legendary';
  else if (roll > 0.85) rarity = 'rare';
  else if (roll > 0.6) rarity = 'uncommon';

  const typeRoll = Math.random();
  let type: Item['type'] = 'weapon';
  if (typeRoll > 0.75) type = 'armor';
  else if (typeRoll > 0.50) type = 'accessory';
  else if (typeRoll > 0.25) type = 'consumable';
  // else weapon

  if (type === 'consumable') {
      return {
          id: uuid(),
          name: 'Potion of Healing',
          type: 'consumable',
          rarity: 'common',
          value: 10,
          description: 'Restores 25 HP',
      }
  }

  const powerScale = Math.max(1, Math.floor(level / 2));
  const prefix = LOOT_PREFIXES[Math.min(LOOT_PREFIXES.length - 1, Math.floor(level / 3))] || "Unknown";
  
  const stats: any = {};
  if (type === 'weapon') stats.damage = getRandomInt(2, 5) + (powerScale * 2);
  if (type === 'armor') stats.armor = getRandomInt(1, 3) + powerScale;
  if (type === 'accessory' || rarity !== 'common') {
    if (Math.random() > 0.5) stats.str = getRandomInt(1, powerScale);
    if (Math.random() > 0.5) stats.dex = getRandomInt(1, powerScale);
    if (Math.random() > 0.5) stats.int = getRandomInt(1, powerScale);
  }

  return {
    id: uuid(),
    name: `${prefix} ${type === 'weapon' ? 'Blade' : type === 'armor' ? 'Plate' : 'Ring'}`,
    type,
    rarity,
    value: level * 10,
    stats,
    description: `A ${rarity} item found in the deep.`
  };
};

export const generateMob = (depth: number): Mob => {
  const difficultyRoll = Math.random() + (depth * 0.05); // Deeper = harder
  let category = 'easy';
  let level = depth + getRandomInt(0, 1);
  
  if (difficultyRoll > 1.5) { category = 'hard'; level += 2; }
  else if (difficultyRoll > 0.8) { category = 'medium'; level += 1; }

  const nameList = MOB_NAMES[category as keyof typeof MOB_NAMES];
  const name = nameList[getRandomInt(0, nameList.length - 1)];

  const maxHp = 10 + (level * 8);
  
  const loot: Item[] = [];
  if (Math.random() > 0.7) loot.push(generateItem(level));

  return {
    id: uuid(),
    name,
    level,
    hp: maxHp,
    maxHp,
    damage: 2 + Math.floor(level * 1.5),
    xpValue: 10 + (level * 5),
    isAggro: Math.random() > 0.7,
    type: 'humanoid',
    loot
  };
};

export const generateRoom = (depth: number, existingId?: string): Room => {
  const prefix = ROOM_PREFIXES[getRandomInt(0, ROOM_PREFIXES.length - 1)];
  const type = ROOM_TYPES[getRandomInt(0, ROOM_TYPES.length - 1)];
  
  const mobs: Mob[] = [];
  const mobCount = getRandomInt(1, 3);
  for (let i = 0; i < mobCount; i++) {
    if (Math.random() > 0.3) mobs.push(generateMob(depth));
  }

  return {
    id: existingId || uuid(),
    depth,
    name: `${prefix} ${type} (Depth ${depth})`,
    description: `You are standing in a ${prefix.toLowerCase()} ${type.toLowerCase()}. The air is thick and smells of ozone and rust. Shadows dance on the walls.`,
    mobs,
    items: [],
    exits: {
      up: true,
      down: depth < 50, // Max depth
    },
    visited: false,
  };
};