
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Player, Room, Mob, LogEntry, Item, GamePhase, ClassType } from './types';
import { generateRoom } from './utils/gameGenerator';
import { MAX_TIME_SECONDS, BASE_ITEMS } from './constants';
import StatsPanel from './components/StatsPanel';
import RoomPanel from './components/RoomPanel';
import LogPanel from './components/LogPanel';
import MapPanel from './components/MapPanel';
import { Timer, Skull, ArrowUp, Map as MapIcon, FileText } from 'lucide-react';

const INITIAL_PLAYER: Player = {
  name: "Drifter",
  classType: ClassType.WARRIOR,
  level: 1,
  xp: 0,
  xpToNext: 100,
  hp: 20,
  maxHp: 20,
  mana: 10,
  maxMana: 10,
  move: 20,
  maxMove: 20,
  str: 5,
  int: 3,
  dex: 4,
  inventory: [],
  equipment: {
    weapon: BASE_ITEMS[0],
    armor: BASE_ITEMS[1],
    accessory: null
  },
  gold: 0
};

const App: React.FC = () => {
  // Game State
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_SECONDS);
  
  // Coordinates instead of just depth
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [rooms, setRooms] = useState<Map<string, Room>>(new Map());
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  
  // Entities
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [target, setTarget] = useState<Mob | null>(null);
  const [combatCooldowns, setCombatCooldowns] = useState<{[key: string]: number}>({});
  
  // UI
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'log' | 'map'>('log');
  const logCounter = useRef(0);

  // --- Gemini GenAI Setup ---
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // --- Helper: Logging ---
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => {
      const newLog = { id: `log-${logCounter.current++}`, text, type, timestamp: Date.now() };
      return [...prev.slice(-49), newLog];
    });
  }, []);

  // --- AI Storyteller ---
  const generateStory = useCallback(async (prompt: string, context: string = '') => {
      try {
          // Use flash-lite for low-latency narrative generation
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-lite',
              contents: `System: You are the Dungeon Master for a dark fantasy roguelike game. Keep outputs brief (1-2 sentences), evocative, and gritty. Second person perspective ("You...").
              Context: ${context}
              Task: ${prompt}`,
          });
          
          const text = response.text;
          if (text) {
              addLog(text.trim(), 'story');
          }
      } catch (error) {
          console.error("Story generation failed", error);
      }
  }, [addLog, ai.models]);

  const generateMobVisuals = async (mob: Mob, roomDescription: string, isDead: boolean) => {
    // RESTRICTION: Only generate images for Bosses
    if (mob.type !== 'boss') return;

    // Prevent double generation
    if (!isDead && (mob.imageUrl || mob.isGenerating)) return;
    if (isDead && (mob.deadImageUrl || mob.isGenerating)) return;

    // Set generating flag locally
    setRooms(prev => {
        const r = prev.get(currentRoomId);
        if (!r) return prev;
        const newMobs = r.mobs.map(m => m.id === mob.id ? { ...m, isGenerating: true } : m);
        return new Map(prev).set(currentRoomId, { ...r, mobs: newMobs });
    });

    try {
        const prompt = isDead 
            ? `A defeated ${mob.name} lying dead on the floor of a ${roomDescription}. Dark, gritty fantasy art, looting aftermath, gloomy atmosphere.`
            : `A menacing, low-angle digital painting of a ${mob.name} inside a ${roomDescription}. Dark fantasy RPG style, cinematic lighting, detailed, 4k.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });

        let imageUrl = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }

        if (imageUrl) {
            setRooms(prev => {
                const r = prev.get(currentRoomId);
                if (!r) return prev;
                const newMobs = r.mobs.map(m => {
                    if (m.id !== mob.id) return m;
                    return {
                        ...m,
                        isGenerating: false,
                        imageUrl: !isDead ? imageUrl : m.imageUrl,
                        deadImageUrl: isDead ? imageUrl : m.deadImageUrl
                    };
                });
                const newMap = new Map(prev);
                newMap.set(currentRoomId, { ...r, mobs: newMobs });
                return newMap;
            });
            
            // If this is our current target, update the target reference too so the UI refreshes
            setTarget(curr => {
                if (curr && curr.id === mob.id) {
                    return {
                        ...curr,
                        isGenerating: false,
                        imageUrl: !isDead ? imageUrl : curr.imageUrl,
                        deadImageUrl: isDead ? imageUrl : curr.deadImageUrl
                    }
                }
                return curr;
            });
        }
    } catch (error) {
        console.error("Failed to generate mob image:", error);
        // Reset generating flag
        setRooms(prev => {
            const r = prev.get(currentRoomId);
            if (!r) return prev;
            const newMobs = r.mobs.map(m => m.id === mob.id ? { ...m, isGenerating: false } : m);
            return new Map(prev).set(currentRoomId, { ...r, mobs: newMobs });
        });
    }
  };

  // --- Helper: Stat Calculation ---
  const getPlayerStats = useCallback(() => {
    let { str, int, dex, armor: baseArmor, damage: baseDmg } = player;
    let addedArmor = 0;
    let addedDmg = 0;

    const items = [player.equipment.weapon, player.equipment.armor, player.equipment.accessory];
    items.forEach(item => {
      if (item?.stats) {
        if (item.stats.str) str += item.stats.str;
        if (item.stats.int) int += item.stats.int;
        if (item.stats.dex) dex += item.stats.dex;
        if (item.stats.armor) addedArmor += item.stats.armor;
        if (item.stats.damage) addedDmg += item.stats.damage;
      }
    });
    
    // Derived stats
    // Hit Chance based on Dex. Dmg based on Str. 
    return { str, int, dex, armor: addedArmor, damage: Math.floor(str / 2) + addedDmg };
  }, [player]);

  // --- Game Loop (The Tick) ---
  useEffect(() => {
    if (phase !== GamePhase.PLAYING) return;

    const tick = setInterval(() => {
      // 1. Timer
      setTimeLeft(prev => {
        if (prev <= 1) {
            setPhase(GamePhase.GAMEOVER);
            return 0;
        }
        return prev - 1;
      });

      // 2. Cooldowns
      setCombatCooldowns(prev => {
          const next = { ...prev };
          let changed = false;
          Object.keys(next).forEach(k => {
              if (next[k] > 0) {
                  next[k] -= 1000;
                  if (next[k] < 0) next[k] = 0;
                  changed = true;
              }
          });
          return changed ? next : prev;
      });

      // 3. Regen (Slowly out of combat)
      setTarget(currTarget => {
        // If no target OR target is dead, regen
        if (!currTarget || currTarget.isDead) {
             setPlayer(p => ({
                 ...p,
                 hp: Math.min(p.maxHp, p.hp + 0.5),
                 mana: Math.min(p.maxMana, p.mana + 0.5),
                 move: Math.min(p.maxMove, p.move + 1),
             }));
        } else {
             // 4. Combat Round
             // Player Hits Mob
             const stats = getPlayerStats();
             const playerHitChance = 0.6 + (stats.dex * 0.02);
             const playerDmg = Math.max(1, stats.damage + Math.floor(Math.random() * 2));
             
             if (Math.random() < playerHitChance) {
                 const newMobHp = currTarget.hp - playerDmg;
                 addLog(`You hit ${currTarget.name} for ${playerDmg} damage!`, 'combat');
                 
                 if (newMobHp <= 0) {
                     // Mob Death Logic
                     handleMobDeath(currTarget);
                     // Return null or modified dead mob? 
                     // We want to show the dead body, so we return the dead mob but stop combat loop logic 
                     // because next tick !currTarget || currTarget.isDead will be true.
                     return { ...currTarget, hp: 0, isDead: true };
                 } else {
                     // Update Mob HP locally within the state setter
                     // We need to update the mob inside the room state too
                     setRooms(prevRooms => {
                         const r = prevRooms.get(currentRoomId);
                         if (!r) return prevRooms;
                         const newMobs = r.mobs.map(m => m.id === currTarget.id ? { ...m, hp: newMobHp } : m);
                         const newMap = new Map(prevRooms);
                         newMap.set(currentRoomId, { ...r, mobs: newMobs });
                         return newMap;
                     });
                     
                     // Return updated mob object to the setTarget state to keep consistency
                     return { ...currTarget, hp: newMobHp };
                 }
             } else {
                 addLog(`You missed ${currTarget.name}!`, 'info');
             }

             // Mob Hits Player
             const mobDmg = Math.max(1, currTarget.damage - Math.floor(stats.armor / 2));
             const mobHitChance = 0.5; // Flat for now
             
             if (Math.random() < mobHitChance) {
                 setPlayer(p => {
                     const newHp = p.hp - mobDmg;
                     if (newHp <= 0) {
                         setPhase(GamePhase.GAMEOVER);
                         addLog(`You were slain by ${currTarget.name}!`, 'danger');
                     }
                     return { ...p, hp: newHp };
                 });
                 addLog(`${currTarget.name} hits you for ${mobDmg} damage!`, 'danger');
             } else {
                 addLog(`${currTarget.name} misses you.`, 'info');
             }
        }
        return currTarget;
      });

    }, 1000);

    return () => clearInterval(tick);
  }, [phase, currentRoomId, getPlayerStats, addLog]);

  const handleMobDeath = (mob: Mob) => {
    addLog(`You killed ${mob.name}! (+${mob.xpValue} XP)`, 'gain');
    
    // Story Event: Death
    generateStory(`Describe the brutal death of a ${mob.name}.`, `Room: ${rooms.get(currentRoomId)?.name}`);

    // XP & Level Up
    setPlayer(p => {
        let newXp = p.xp + mob.xpValue;
        let newLevel = p.level;
        let newMaxHp = p.maxHp;
        let newMaxMana = p.maxMana;
        let newStr = p.str;
        
        if (newXp >= p.xpToNext) {
            newLevel++;
            newXp -= p.xpToNext;
            newMaxHp += 5;
            newMaxMana += 2;
            newStr += 1;
            addLog(`LEVEL UP! You are now level ${newLevel}.`, 'gain');
        }

        return {
            ...p,
            xp: newXp,
            level: newLevel,
            maxHp: newMaxHp,
            hp: newMaxHp, // Heal on level up
            maxMana: newMaxMana,
            mana: newMaxMana,
            str: newStr
        };
    });

    // Loot Drop & Corpse Management
    const room = rooms.get(currentRoomId);
    if (mob.loot.length > 0) {
        addLog(`${mob.name} dropped: ${mob.loot.map(i => i.name).join(', ')}`, 'loot');
    }
    
    // Trigger Dead Image Gen (Only for Bosses)
    generateMobVisuals(mob, room ? room.name : "dungeon", true);

    setRooms(prev => {
        const r = prev.get(currentRoomId);
        if (!r) return prev;
        const newMap = new Map(prev);
        
        // Mark mob as dead, remove loot from mob
        const newMobs = r.mobs.map(m => m.id === mob.id ? { ...m, isDead: true, hp: 0, loot: [] } : m);
        
        // Add loot to room floor
        const newItems = [...r.items, ...mob.loot];
        
        newMap.set(currentRoomId, {
            ...r,
            mobs: newMobs,
            items: newItems
        });
        return newMap;
    });

    setTarget(t => t ? { ...t, isDead: true, hp: 0 } : null);
  };

  // --- Actions ---

  const startGame = () => {
    // Generate Room at 0, 0, 0
    const startRoom = generateRoom(0, 0, 0);
    startRoom.name = "The Surface Entrance";
    startRoom.description = "You stand at the edge of the Infinite Shaft. The wind howls upwards. There is no turning back, only down.";
    startRoom.mobs = [];
    startRoom.exits.up = false; // Cannot ascend from surface
    
    const newRooms = new Map();
    newRooms.set(startRoom.id, startRoom);
    
    setRooms(newRooms);
    setCoords({ x: 0, y: 0, z: 0 });
    setCurrentRoomId(startRoom.id);
    setPhase(GamePhase.PLAYING);
    setLogs([]);
    setTimeLeft(MAX_TIME_SECONDS);
    setPlayer(INITIAL_PLAYER);
    addLog("The descent begins. Good luck, Drifter.", 'info');
    generateStory("Describe the ominous beginning of a descent into an infinite abyss.");
  };

  const handleMove = (dir: 'up' | 'down' | 'north' | 'south' | 'east' | 'west') => {
    if (player.move < 2) {
        addLog("Too exhausted to move!", 'info');
        return;
    }

    let { x, y, z } = coords;

    if (dir === 'up') z--;
    if (dir === 'down') z++;
    if (dir === 'north') y++;
    if (dir === 'south') y--;
    if (dir === 'east') x++;
    if (dir === 'west') x--;
    
    if (z < 0) {
        setPhase(GamePhase.VICTORY);
        return;
    }

    const nextRoomId = `room_${x}_${y}_${z}`;
    let nextRoom = rooms.get(nextRoomId);
    let isNewRoom = false;

    if (!nextRoom) {
        nextRoom = generateRoom(x, y, z);
        setRooms(prev => new Map(prev).set(nextRoomId, nextRoom!));
        isNewRoom = true;
    }

    setCurrentRoomId(nextRoomId);
    setCoords({ x, y, z });
    setPlayer(p => ({ ...p, move: p.move - 2 }));
    setTarget(null); // Clear target when moving
    addLog(`You move ${dir} to ${x},${y} (Depth ${z}).`, 'info');

    // "Pre-Make" Images: Check if there is a Boss in the room and start generating immediately
    const boss = nextRoom.mobs.find(m => m.type === 'boss' && !m.isDead);
    if (boss && !boss.imageUrl) {
        addLog("A presence sends shivers down your spine...", 'danger');
        generateMobVisuals(boss, nextRoom.name, false);
    }

    // Story Event: Movement
    if (isNewRoom) {
        generateStory(`Describe entering a new room: ${nextRoom.name}. It appears to be a ${nextRoom.description}`, `Depth: ${z}`);
    } else {
        generateStory(`Describe returning to ${nextRoom.name}.`, `Depth: ${z}`);
    }
  };

  const handleRest = () => {
      addLog("You rest for a moment...", 'info');
      setPlayer(p => ({
          ...p,
          hp: Math.min(p.maxHp, p.hp + 5),
          mana: Math.min(p.maxMana, p.mana + 5),
          move: Math.min(p.maxMove, p.move + 10)
      }));
      // Resting costs time
      setTimeLeft(t => t - 10);
      generateStory("Describe a brief, uneasy moment of rest in the darkness.");
  };

  const handleAttack = (mob: Mob) => {
      if (mob.isDead) {
          setTarget(mob); // Select corpse for viewing
          addLog(`You inspect the corpse of ${mob.name}.`, 'info');
          return;
      }
      
      const isNewTarget = target?.id !== mob.id;
      setTarget(mob);
      addLog(`You engage the ${mob.name}!`, 'combat');
      
      // Attempt image gen (will only run if Boss due to new restriction)
      const room = rooms.get(currentRoomId);
      generateMobVisuals(mob, room ? room.name : "dungeon", false);

      if (isNewTarget) {
          generateStory(`Describe a hostile ${mob.name} noticing the player and preparing to attack.`, `Room: ${room?.name}`);
      }
  };

  const handleFlee = () => {
      if (player.move < 10) {
          addLog("Too exhausted to flee!", 'danger');
          return;
      }
      if (Math.random() > 0.5) {
          setTarget(null);
          setPlayer(p => ({...p, move: p.move - 10}));
          addLog("You scrambled away from combat!", 'info');
      } else {
          setPlayer(p => ({...p, move: p.move - 5}));
          addLog("Failed to escape!", 'danger');
      }
  };

  const handleSkill = (skill: string) => {
    if (!target || target.isDead) return;
    
    if (skill === 'bash') {
        const dmg = Math.floor(getPlayerStats().str * 1.5);
        const newHp = target.hp - dmg;
        addLog(`You BASH ${target.name} for ${dmg} damage!`, 'combat');
        setCombatCooldowns(p => ({...p, bash: 5000}));
        
        if (newHp <= 0) {
            handleMobDeath(target);
        } else {
            setTarget({...target, hp: newHp});
             setRooms(prevRooms => {
                 const r = prevRooms.get(currentRoomId);
                 if (!r) return prevRooms;
                 const newMobs = r.mobs.map(m => m.id === target.id ? { ...m, hp: newHp } : m);
                 return new Map(prevRooms).set(currentRoomId, { ...r, mobs: newMobs });
             });
        }
    } else if (skill === 'fireball') {
        if (player.mana < 5) {
            addLog("Not enough mana!", 'info');
            return;
        }
        const dmg = Math.floor(getPlayerStats().int * 2);
        const newHp = target.hp - dmg;
        setPlayer(p => ({...p, mana: p.mana - 5}));
        addLog(`You cast SMITE on ${target.name} for ${dmg} damage!`, 'combat');
        setCombatCooldowns(p => ({...p, fireball: 3000}));

        if (newHp <= 0) {
            handleMobDeath(target);
        } else {
            setTarget({...target, hp: newHp});
            setRooms(prevRooms => {
                 const r = prevRooms.get(currentRoomId);
                 if (!r) return prevRooms;
                 const newMobs = r.mobs.map(m => m.id === target.id ? { ...m, hp: newHp } : m);
                 return new Map(prevRooms).set(currentRoomId, { ...r, mobs: newMobs });
             });
        }
    }
  };

  const handleLoot = (item: Item) => {
      setPlayer(p => ({...p, inventory: [...p.inventory, item]}));
      setRooms(prev => {
          const r = prev.get(currentRoomId);
          if (!r) return prev;
          return new Map(prev).set(currentRoomId, {
              ...r,
              items: r.items.filter(i => i.id !== item.id)
          });
      });
      addLog(`You picked up: ${item.name}`, 'loot');
  };

  const handleEquip = (item: Item) => {
      setPlayer(p => {
          const slot = item.type as 'weapon' | 'armor' | 'accessory';
          const currentEquip = p.equipment[slot];
          const newInv = p.inventory.filter(i => i.id !== item.id);
          if (currentEquip) newInv.push(currentEquip);
          
          return {
              ...p,
              equipment: { ...p.equipment, [slot]: item },
              inventory: newInv
          };
      });
      addLog(`You equipped ${item.name}.`, 'info');
  };

  const handleDrop = (item: Item) => {
      setPlayer(p => ({...p, inventory: p.inventory.filter(i => i.id !== item.id)}));
      addLog(`You dropped ${item.name}.`, 'info');
  };

  const handleUse = (item: Item) => {
      if (item.statUpgrade) {
          setPlayer(p => ({
              ...p,
              str: p.str + (item.statUpgrade?.str || 0),
              dex: p.dex + (item.statUpgrade?.dex || 0),
              int: p.int + (item.statUpgrade?.int || 0),
              inventory: p.inventory.filter(i => i.id !== item.id)
          }));
          addLog(`You used ${item.name} and grew stronger!`, 'gain');
          return;
      }
      if (item.name === 'Potion of Healing') {
          setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp + 25), inventory: p.inventory.filter(i => i.id !== item.id)}));
          addLog("You drank the potion and feel refreshed.", 'gain');
      }
  };
  
  const handleUserChat = (message: string) => {
      addLog(`You: ${message}`, 'info');
      generateStory(`The player asks/says: "${message}". React to this as the Dungeon Master.`, `Current Room: ${rooms.get(currentRoomId)?.name}`);
  };

  // --- Render ---

  if (phase === GamePhase.START) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-black text-emerald-500 font-mono">
              <div className="text-center max-w-lg p-8 border border-emerald-900 bg-slate-900 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <h1 className="text-4xl font-bold mb-4 animate-pulse">VERTICAL MUD</h1>
                  <p className="mb-6 text-slate-400">The shaft is collapsing. You have 15 minutes to descend as deep as you can, find artifacts, and return to the surface alive.</p>
                  <div className="text-sm text-slate-500 mb-8 border p-4 border-slate-800 text-left">
                      <p>INSTRUCTIONS:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li>Use the GRID to explore side rooms for Elite loot.</li>
                          <li>Click [DESCEND] (at 0,0) to go deeper. Mobs get harder.</li>
                          <li>Every 10 Levels: BOSS GUARDIAN.</li>
                          <li>Combat is AUTO-TICK based. Use skills to burst.</li>
                          <li>Watch your STAMINA (Yellow Bar). Fleeing costs Stamina.</li>
                      </ul>
                  </div>
                  <button onClick={startGame} className="px-8 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded text-xl transition-all hover:scale-105">ENTER THE SHAFT</button>
              </div>
          </div>
      );
  }

  if (phase === GamePhase.GAMEOVER) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-red-950 text-red-500 font-mono">
             <div className="text-center">
                 <Skull size={64} className="mx-auto mb-4 animate-bounce" />
                 <h1 className="text-6xl font-bold mb-4">YOU DIED</h1>
                 <p className="text-xl text-red-300">Depth Reached: {coords.z}</p>
                 <button onClick={() => setPhase(GamePhase.START)} className="mt-8 px-6 py-2 border border-red-500 hover:bg-red-900 transition-colors">TRY AGAIN</button>
             </div>
        </div>
      );
  }

  if (phase === GamePhase.VICTORY) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-emerald-950 text-emerald-400 font-mono">
           <div className="text-center">
               <ArrowUp size={64} className="mx-auto mb-4 animate-bounce" />
               <h1 className="text-6xl font-bold mb-4">SURFACED!</h1>
               <p className="text-xl text-emerald-200">You escaped the collapse with your life.</p>
               <p className="text-lg mt-2 text-slate-400">Max Depth: {Array.from(rooms.keys()).length}</p>
               <button onClick={() => setPhase(GamePhase.START)} className="mt-8 px-6 py-2 border border-emerald-500 hover:bg-emerald-900 transition-colors">PLAY AGAIN</button>
           </div>
      </div>
    );
  }

  const currentRoom = rooms.get(currentRoomId);

  return (
    <div className="h-screen w-screen bg-black text-slate-200 flex flex-col p-2 overflow-hidden">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-4 bg-slate-900 border-b border-emerald-900/50 shrink-0">
            <div className="font-bold text-emerald-500 tracking-widest">VERTICAL MUD <span className="text-xs text-slate-600 ml-2">VER 1.0</span></div>
            <div className="flex gap-6 font-mono text-sm font-bold">
                <div className={`flex items-center gap-2 ${timeLeft < 300 ? 'text-red-500 animate-pulse-fast' : 'text-slate-300'}`}>
                    <Timer size={16} /> 
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div className="text-blue-400">POS: {coords.x}, {coords.y}, {coords.z}</div>
            </div>
        </header>

        {/* Main Grid */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 mt-2 min-h-0">
            {/* Left: Stats */}
            <div className="md:col-span-3 min-h-0">
                <StatsPanel 
                    player={player} 
                    onEquip={handleEquip}
                    onDrop={handleDrop}
                    onUse={handleUse}
                />
            </div>

            {/* Center: Room */}
            <div className="md:col-span-6 min-h-0">
                {currentRoom && (
                    <RoomPanel 
                        player={player}
                        room={currentRoom}
                        target={target}
                        onMove={handleMove}
                        onAttack={handleAttack}
                        onFlee={handleFlee}
                        onRest={handleRest}
                        onLoot={handleLoot}
                        combatCooldowns={combatCooldowns}
                        onSkill={handleSkill}
                    />
                )}
            </div>

            {/* Right: Logs & Map */}
            <div className="md:col-span-3 min-h-0 flex flex-col">
                {/* Tabs */}
                <div className="flex bg-slate-900 border border-slate-700 rounded-t-md shrink-0">
                    <button 
                        onClick={() => setActiveTab('log')}
                        className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'log' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                    >
                        <FileText size={14}/> Logs
                    </button>
                    <button 
                         onClick={() => setActiveTab('map')}
                         className={`flex-1 py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'map' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                    >
                        <MapIcon size={14}/> 3D Map
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 border-x border-b border-slate-700 bg-slate-900 rounded-b-md overflow-hidden relative">
                    {activeTab === 'log' ? (
                        <LogPanel logs={logs} onUserChat={handleUserChat} />
                    ) : (
                        <MapPanel rooms={rooms} currentRoomId={currentRoomId} player={player} />
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default App;
