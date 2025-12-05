
import React from 'react';
import { Player, Mob, Room, Item } from '../types';
import { Sword, Skull, ArrowUp, ArrowDown, ShieldAlert, Tent, Wind, Eye, Compass, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crown, Ghost, PawPrint, User } from 'lucide-react';

interface RoomPanelProps {
  player: Player;
  room: Room;
  target: Mob | null;
  onMove: (dir: 'up' | 'down' | 'north' | 'south' | 'east' | 'west') => void;
  onAttack: (mob: Mob) => void;
  onFlee: () => void;
  onRest: () => void;
  onLoot: (item: Item) => void;
  combatCooldowns: { [key: string]: number };
  onSkill: (skillName: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({ 
    player, room, target, onMove, onAttack, onFlee, onRest, onLoot, combatCooldowns, onSkill 
}) => {
  
  const getMobColor = (mob: Mob) => {
    if (mob.isDead) return 'text-slate-600 line-through';
    if (mob.isElite) return 'text-cyan-400 font-bold'; // Cyan for Named/Elite
    if (mob.type === 'boss') return 'text-amber-500 font-bold'; // Gold for Bosses
    
    const diff = mob.level - player.level;
    if (diff <= -2) return 'text-slate-500'; // Trivial
    if (diff === -1) return 'text-green-500'; // Easy
    if (diff === 0) return 'text-white'; // Even
    if (diff <= 2) return 'text-yellow-400'; // Tough
    return 'text-red-500'; // Deadly
  };

  const getMobIcon = (type: Mob['type'], size: number = 20) => {
      switch(type) {
          case 'boss': return <Crown size={size} className="text-amber-500" />;
          case 'undead': return <Ghost size={size} />;
          case 'beast': return <PawPrint size={size} />;
          default: return <User size={size} />;
      }
  };

  const isCombat = !!target && !target.isDead;
  const viewingCorpse = !!target && target.isDead;
  const livingMobs = room.mobs.filter(m => !m.isDead);
  const deadMobs = room.mobs.filter(m => m.isDead);

  // Helper for Navigation Buttons
  const renderNavBtn = (dir: 'north'|'south'|'east'|'west', available: boolean, icon: React.ReactNode) => (
      <button 
        disabled={!available} 
        onClick={() => onMove(dir)} 
        className={`p-3 rounded-md transition-all border ${
            available 
            ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
            : 'bg-black/40 border-slate-900 text-slate-800 cursor-not-allowed opacity-50'
        }`}
      >
        {icon}
      </button>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 border-2 border-emerald-900/50 rounded-md relative overflow-hidden">
        {/* Background ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-50 z-0 pointer-events-none"></div>

        {/* Room Header & Visuals */}
        <div className="relative z-10 p-4 border-b border-emerald-900/30 bg-slate-900/80 shrink-0">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-xl text-emerald-400 font-bold tracking-wide uppercase">{room.name}</h2>
                    <div className="text-[10px] text-slate-500 font-mono">XYZ: {room.coordinates.x}, {room.coordinates.y}, {room.coordinates.z}</div>
                </div>
                {room.coordinates.x === 0 && room.coordinates.y === 0 && (
                    <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded border border-emerald-800">SHAFT</span>
                )}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{room.description}</p>
            
            {/* Visual Display Area */}
            {target && (
                <div className={`w-full h-48 bg-black rounded border flex items-center justify-center overflow-hidden relative ${target.isElite ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : target.type === 'boss' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800'}`}>
                    
                    {/* BOSS VISUALS (Generated) */}
                    {target.type === 'boss' ? (
                        <>
                           {target.isGenerating ? (
                               <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-emerald-500 animate-pulse">Summoning Guardian...</span>
                               </div>
                           ) : (
                               <>
                                  {target.isDead && target.deadImageUrl ? 
                                      <img src={target.deadImageUrl} alt="Defeated Boss" className="w-full h-full object-cover animate-in fade-in duration-1000 grayscale hover:grayscale-0 transition-all" /> 
                                  : target.imageUrl ? 
                                      <img src={target.imageUrl} alt="Boss" className="w-full h-full object-cover animate-in fade-in duration-500" />
                                  : 
                                      <div className="flex flex-col items-center text-amber-500 animate-pulse">
                                          <Crown size={64} />
                                          <span className="text-xs mt-2 uppercase tracking-widest font-bold">Guardian</span>
                                      </div>
                                  }
                               </>
                           )}
                        </>
                    ) : (
                        // REGULAR MOB VISUALS (Static Icon)
                        <div className={`flex flex-col items-center gap-4 ${target.isDead ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                            <div className={`p-6 rounded-full bg-slate-900 border-4 ${target.isElite ? 'border-cyan-500 text-cyan-500' : 'border-slate-700 text-slate-400'} shadow-2xl`}>
                                {getMobIcon(target.type, 64)}
                            </div>
                        </div>
                    )}

                    {/* Overlay for Name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                         <div className={`font-bold flex items-center justify-center gap-2 ${target.isDead ? 'text-slate-400' : target.isElite ? 'text-cyan-400' : target.type === 'boss' ? 'text-amber-500' : 'text-white'}`}>
                             {target.isElite && <Crown size={14} className="text-cyan-500 fill-cyan-500" />}
                             {target.name} {target.isDead ? '(DEAD)' : `(Lvl ${target.level})`}
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Action Area */}
        <div className="relative z-10 flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            
            {/* Exits / Movement Controls (Only if not fighting) */}
            {!isCombat && (
                <div className="flex justify-center items-center gap-6 shrink-0 bg-slate-900/50 p-3 rounded-lg border border-slate-800 shadow-inner">
                    {/* Grid Nav */}
                    <div className="grid grid-cols-3 gap-2">
                        <div />
                        {renderNavBtn('north', room.exits.north, <ChevronUp size={20}/>)}
                        <div />
                        
                        {renderNavBtn('west', room.exits.west, <ChevronLeft size={20}/>)}
                        <div className="flex items-center justify-center text-slate-700"><Compass size={24}/></div>
                        {renderNavBtn('east', room.exits.east, <ChevronRight size={20}/>)}
                        
                        <div />
                        {renderNavBtn('south', room.exits.south, <ChevronDown size={20}/>)}
                        <div />
                    </div>

                    {/* Vertical Nav */}
                    <div className="flex flex-col gap-3 border-l-2 border-slate-800 pl-6">
                        <button 
                            disabled={!room.exits.up}
                            onClick={() => onMove('up')}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all border ${
                                room.exits.up 
                                ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/40 hover:translate-y-[-2px]' 
                                : 'bg-black/40 border-slate-900 text-slate-800 cursor-not-allowed'
                            }`}
                        >
                            <span>ASCEND</span> <ArrowUp size={16} />
                        </button>
                        <button 
                            disabled={!room.exits.down}
                            onClick={() => onMove('down')}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all border ${
                                room.exits.down 
                                ? 'bg-slate-800 border-amber-500/50 text-amber-400 hover:bg-amber-900/40 hover:translate-y-[2px]' 
                                : 'bg-black/40 border-slate-900 text-slate-800 cursor-not-allowed'
                            }`}
                        >
                            <span>DESCEND</span> <ArrowDown size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobs List */}
            <div className="space-y-2">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Entities in Room</h3>
                {room.mobs.length === 0 && <div className="text-slate-600 italic text-sm">No hostile entities detected.</div>}
                
                {/* Living Mobs */}
                {livingMobs.map(mob => (
                    <div 
                        key={mob.id} 
                        onClick={() => !isCombat ? onAttack(mob) : null}
                        className={`flex justify-between items-center p-3 rounded border bg-slate-900/50 transition-all ${target?.id === mob.id ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : mob.isElite ? 'border-cyan-700 hover:border-cyan-500 cursor-pointer' : mob.type === 'boss' ? 'border-amber-700 hover:border-amber-500 cursor-pointer' : 'border-slate-800 hover:border-slate-600 cursor-pointer'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={target?.id === mob.id ? 'text-red-500 animate-pulse' : mob.isElite ? 'text-cyan-500' : mob.type === 'boss' ? 'text-amber-500' : 'text-slate-600'}>
                                {getMobIcon(mob.type, 20)}
                            </div>
                            <div>
                                <div className={`font-bold flex items-center gap-2 ${getMobColor(mob)}`}>
                                    {mob.isElite && <Crown size={12} className="text-cyan-500 fill-cyan-500"/>}
                                    {mob.name} 
                                    <span className="text-xs opacity-60 ml-2 font-normal text-slate-400">Lvl {mob.level}</span>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-red-600" style={{ width: `${(mob.hp / mob.maxHp) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                        {target?.id === mob.id && <span className="text-red-500 text-xs font-bold animate-pulse">ENGAGED</span>}
                        {!target && <span className="text-slate-600 text-xs group-hover:text-emerald-400">[ATTACK]</span>}
                    </div>
                ))}

                {/* Dead Mobs */}
                {deadMobs.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-slate-700 text-[10px] font-bold uppercase tracking-widest mb-1">Corpses</h4>
                        {deadMobs.map(mob => (
                            <div 
                                key={mob.id}
                                onClick={() => onAttack(mob)} // Inspect
                                className={`flex justify-between items-center p-2 rounded border transition-all cursor-pointer ${target?.id === mob.id ? 'border-slate-500 bg-slate-800' : 'border-slate-900 bg-black/20 text-slate-600 hover:text-slate-400'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Skull size={14} />
                                    <span className="text-xs line-through">{mob.name}</span>
                                </div>
                                <span className="text-[10px]"><Eye size={12}/></span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Items on Floor */}
            {room.items.length > 0 && !isCombat && (
                <div className="space-y-2">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Loot Detected</h3>
                    <div className="flex flex-wrap gap-2">
                        {room.items.map((item, idx) => (
                            <button 
                                key={item.id + idx}
                                onClick={() => onLoot(item)}
                                className={`px-3 py-1 rounded border text-sm transition-colors ${item.rarity === 'legendary' ? 'border-amber-500/50 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            >
                                Take {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Combat / Action Bar (Fixed at bottom) */}
        <div className="relative z-20 bg-slate-900 border-t border-slate-800 p-4 shrink-0">
            {isCombat ? (
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            disabled={(combatCooldowns['bash'] || 0) > 0}
                            onClick={() => onSkill('bash')}
                            className="flex flex-col items-center justify-center w-16 h-16 bg-red-950 border border-red-800 rounded text-red-400 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <ShieldAlert size={20} />
                            <span className="text-[10px] font-bold mt-1">BASH</span>
                            {(combatCooldowns['bash'] || 0) > 0 && <span className="absolute text-xl font-bold text-white shadow-black drop-shadow-md">{Math.ceil(combatCooldowns['bash']/1000)}</span>}
                        </button>
                        <button 
                            disabled={(combatCooldowns['fireball'] || 0) > 0}
                            onClick={() => onSkill('fireball')}
                            className="flex flex-col items-center justify-center w-16 h-16 bg-blue-950 border border-blue-800 rounded text-blue-400 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Sword size={20} />
                            <span className="text-[10px] font-bold mt-1">SMITE</span>
                            {(combatCooldowns['fireball'] || 0) > 0 && <span className="absolute text-xl font-bold text-white shadow-black drop-shadow-md">{Math.ceil(combatCooldowns['fireball']/1000)}</span>}
                        </button>
                    </div>
                    <button 
                        onClick={onFlee} 
                        className="px-6 py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded hover:bg-slate-700 flex items-center gap-2"
                    >
                        <Wind size={16} /> FLEE
                    </button>
                </div>
            ) : (
                <div className="flex justify-center">
                    {viewingCorpse ? (
                        <div className="text-slate-500 text-sm italic py-3">You are inspecting the remains.</div>
                    ) : (
                        <button 
                            onClick={onRest}
                            className="w-full py-4 bg-emerald-950/30 border border-emerald-900 text-emerald-400 rounded hover:bg-emerald-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Tent size={18} /> REST (Recover HP/MP)
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default RoomPanel;
