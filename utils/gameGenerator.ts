
import { Mob, Item, Room } from '../types';
import { ROOM_PREFIXES, ROOM_TYPES, MOB_NAMES, LOOT_PREFIXES, ELITE_PREFIXES, ELITE_TITLES } from '../constants';

const uuid = () => Math.random().toString(36).substring(2, 9);

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateItem = (level: number, isEliteDrop = false): Item => {
  const roll = Math.random();
  let rarity: Item['rarity'] = 'common';
  
  if (isEliteDrop) {
    rarity = roll > 0.7 ? 'legendary' : 'rare';
  } else {
    if (roll > 0.95) rarity = 'legendary';
    else if (roll > 0.85) rarity = 'rare';
    else if (roll > 0.6) rarity = 'uncommon';
  }

  // Elite specific Skill Tomes
  if (isEliteDrop && Math.random() > 0.5) {
      const tomeType = Math.random();
      let statUpgrade = {};
      let name = "";
      if (tomeType > 0.66) {
          name = "Tome of Strength";
          statUpgrade = { str: 1 };
      } else if (tomeType > 0.33) {
          name = "Manual of Agility";
          statUpgrade = { dex: 1 };
      } else {
          name = "Codex of Intellect";
          statUpgrade = { int: 1 };
      }
      return {
          id: uuid(),
          name,
          type: 'consumable',
          rarity: 'legendary',
          value: 200,
          description: 'Permanently increases a stat.',
          statUpgrade
      };
  }

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

  const powerScale = Math.max(1, Math.floor(level / 2)) + (isEliteDrop ? 2 : 0);
  const prefixIndex = Math.min(LOOT_PREFIXES.length - 1, Math.floor(level / 3) + (isEliteDrop ? 2 : 0));
  const prefix = LOOT_PREFIXES[Math.max(0, prefixIndex)] || "Unknown";
  
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
    description: `A ${rarity} item.`
  };
};

export const generateMob = (depth: number, isSideRoom: boolean, forceBoss = false): Mob => {
  const difficultyRoll = Math.random() + (depth * 0.05) + (isSideRoom ? 0.3 : 0);
  
  // Chance for Elite
  const isElite = forceBoss ? false : (isSideRoom && Math.random() > 0.7) || (!isSideRoom && Math.random() > 0.95);
  
  let category = 'easy';
  let level = depth + getRandomInt(0, 1);
  
  if (forceBoss) {
      category = 'boss';
      level += 5;
  } else if (isElite) {
      category = 'hard';
      level += 3;
  } else if (difficultyRoll > 1.5) { category = 'hard'; level += 2; }
  else if (difficultyRoll > 0.8) { category = 'medium'; level += 1; }

  let name = "";
  if (isElite) {
      const p = ELITE_PREFIXES[getRandomInt(0, ELITE_PREFIXES.length - 1)];
      const t = ELITE_TITLES[getRandomInt(0, ELITE_TITLES.length - 1)];
      name = `${p} ${t}`;
  } else {
    const nameList = MOB_NAMES[category as keyof typeof MOB_NAMES];
    name = nameList[getRandomInt(0, nameList.length - 1)];
  }

  // Determine Type based on Name for Icons
  let type: Mob['type'] = 'humanoid';
  const lowerName = name.toLowerCase();
  
  if (forceBoss) type = 'boss';
  else if (lowerName.includes('rat') || lowerName.includes('bat') || lowerName.includes('spider') || lowerName.includes('wolf') || lowerName.includes('basilisk')) type = 'beast';
  else if (lowerName.includes('skeleton') || lowerName.includes('lich') || lowerName.includes('ghost') || lowerName.includes('zombie')) type = 'undead';
  // Default to humanoid for Orcs, Goblins, etc.

  const maxHp = (10 + (level * 8)) * (isElite ? 2.5 : 1) * (forceBoss ? 4 : 1);
  
  const loot: Item[] = [];
  if (isElite) {
      // Elite Drops
      loot.push(generateItem(level, true));
      loot.push(generateItem(level, true)); 
  } else if (forceBoss) {
      // Boss Drops
      loot.push(generateItem(level, true));
      loot.push(generateItem(level, true));
      loot.push(generateItem(level, true));
  }
  // Regular mobs drop NOTHING now.

  return {
    id: uuid(),
    name,
    level,
    hp: maxHp,
    maxHp,
    damage: (2 + Math.floor(level * 1.5)) * (isElite ? 1.5 : 1) * (forceBoss ? 1.5 : 1),
    xpValue: (10 + (level * 5)) * (isElite ? 3 : 1) * (forceBoss ? 5 : 1),
    isAggro: forceBoss ? true : Math.random() > 0.7,
    type, // Now correctly assigned
    loot,
    isElite: isElite || forceBoss,
    isDead: false,
    imageUrl: undefined,
    deadImageUrl: undefined
  };
};

export const generateRoom = (x: number, y: number, z: number): Room => {
  const isShaft = x === 0 && y === 0;
  const isSideRoom = !isShaft;
  const isBossLevel = z > 0 && z % 10 === 0 && isShaft;

  const prefix = ROOM_PREFIXES[getRandomInt(0, ROOM_PREFIXES.length - 1)];
  const type = ROOM_TYPES[getRandomInt(0, ROOM_TYPES.length - 1)];
  
  const mobs: Mob[] = [];
  
  if (isBossLevel) {
      mobs.push(generateMob(z, false, true));
  } else {
      const mobCount = getRandomInt(1, isSideRoom ? 4 : 2);
      for (let i = 0; i < mobCount; i++) {
        if (Math.random() > 0.3) mobs.push(generateMob(z, isSideRoom));
      }
  }

  // Generate Exits - MAZE LOGIC
  const exits = {
      up: false,
      down: false,
      north: false,
      south: false,
      east: false,
      west: false
  };

  if (isShaft) {
      // The Main Shaft acts as the elevator
      exits.up = z > 0;
      exits.down = z < 50;
      // Connects freely to cardinal directions
      exits.north = Math.random() > 0.4;
      exits.south = Math.random() > 0.4;
      exits.east = Math.random() > 0.4;
      exits.west = Math.random() > 0.4;
  } else {
      // Side Rooms - Maze logic
      // Always connect back towards 0,0 (so you don't get stuck)
      if (y > 0) exits.south = true;
      if (y < 0) exits.north = true;
      if (x > 0) exits.west = true;
      if (x < 0) exits.east = true;

      // Random chance to branch out further
      if (y >= 0) exits.north = Math.random() > 0.5;
      if (y <= 0) exits.south = Math.random() > 0.5;
      if (x >= 0) exits.east = Math.random() > 0.5;
      if (x <= 0) exits.west = Math.random() > 0.5;

      // Verticality in side rooms (The "Secret Path" logic)
      if (Math.random() > 0.8 && z > 0) exits.up = true;
      if (Math.random() > 0.8 && z < 50) exits.down = true;
  }

  const items: Item[] = [];
  if (isSideRoom && Math.random() > 0.6 && !isBossLevel) {
      items.push(generateItem(z, false));
  }

  let roomName = "";
  if (isBossLevel) roomName = "Guardian's Threshold";
  else roomName = isShaft ? `Shaft ${z}` : `${prefix} ${type}`;

  // Simplified descriptions for speed reading
  let desc = `${prefix} walls. Smell of ${isSideRoom ? 'rot' : 'ozone'}.`;
  if (isBossLevel) desc = "Oppressive aura. A Guardian waits.";
  else if (isShaft) desc = "The infinite drop. Wind howls.";

  return {
    id: `room_${x}_${y}_${z}`,
    depth: z,
    coordinates: { x, y, z },
    name: roomName,
    description: desc,
    mobs,
    items,
    exits,
    visited: false,
  };
};
