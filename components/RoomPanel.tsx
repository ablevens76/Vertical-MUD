import React from 'react';
import { Player, Mob, Room, Item } from '../types';
import { Sword, Skull, ArrowUp, ArrowDown, ShieldAlert, Tent, Wind } from 'lucide-react';

interface RoomPanelProps {
  player: Player;
  room: Room;
  target: Mob | null;
  onMove: (dir: 'up' | 'down') => void;
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
    const diff = mob.level - player.level;
    if (diff <= -2) return 'text-slate-500'; // Trivial
    if (diff === -1) return 'text-green-500'; // Easy
    if (diff === 0) return 'text-white'; // Even
    if (diff <= 2) return 'text-yellow-400'; // Tough
    return 'text-red-500'; // Deadly
  };

  const isCombat = !!target;

  return (
    <div className="h-full flex flex-col bg-slate-950 border-2 border-emerald-900/50 rounded-md relative overflow-hidden">
        {/* Background ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-50 z-0 pointer-events-none"></div>

        {/* Room Header */}
        <div className="relative z-10 p-6 border-b border-emerald-900/30 bg-slate-900/80">
            <h2 className="text-xl text-emerald-400 font-bold mb-1 tracking-wide uppercase">{room.name}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{room.description}</p>
        </div>

        {/* Action Area */}
        <div className="relative z-10 flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            
            {/* Exits / Movement Controls (Only if not fighting) */}
            {!isCombat && (
                <div className="flex gap-4 justify-center">
                    <button 
                        disabled={!room.exits.up}
                        onClick={() => onMove('up')}
                        className={`flex items-center gap-2 px-6 py-3 rounded border font-bold transition-all ${room.exits.up ? 'border-emerald-700 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 hover:scale-105' : 'border-slate-800 text-slate-700 cursor-not-allowed'}`}
                    >
                        <ArrowUp size={20} /> ASCEND
                    </button>
                    <button 
                        disabled={!room.exits.down}
                        onClick={() => onMove('down')}
                        className={`flex items-center gap-2 px-6 py-3 rounded border font-bold transition-all ${room.exits.down ? 'border-amber-700 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40 hover:scale-105' : 'border-slate-800 text-slate-700 cursor-not-allowed'}`}
                    >
                        <ArrowDown size={20} /> DESCEND
                    </button>
                </div>
            )}

            {/* Mobs List */}
            <div className="space-y-2">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Entities in Room</h3>
                {room.mobs.length === 0 && <div className="text-slate-600 italic text-sm">No hostile entities detected.</div>}
                
                {room.mobs.map(mob => (
                    <div 
                        key={mob.id} 
                        onClick={() => !isCombat ? onAttack(mob) : null}
                        className={`flex justify-between items-center p-3 rounded border border-slate-800 bg-slate-900/50 transition-all ${target?.id === mob.id ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'hover:border-slate-600 cursor-pointer'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Skull className={target?.id === mob.id ? 'text-red-500 animate-pulse' : 'text-slate-600'} size={20} />
                            <div>
                                <div className={`font-bold ${getMobColor(mob)}`}>{mob.name} <span className="text-xs opacity-60 ml-2">Lvl {mob.level}</span></div>
                                <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-red-600" style={{ width: `${(mob.hp / mob.maxHp) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                        {target?.id === mob.id && <span className="text-red-500 text-xs font-bold animate-pulse">ENGAGED</span>}
                        {!target && <span className="text-slate-600 text-xs group-hover:text-emerald-400">[ATTACK]</span>}
                    </div>
                ))}
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
                                className="px-3 py-1 rounded border border-amber-900/30 bg-amber-900/10 text-amber-400 text-sm hover:bg-amber-900/30 transition-colors"
                            >
                                Take {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Combat / Action Bar (Fixed at bottom) */}
        <div className="relative z-20 bg-slate-900 border-t border-slate-800 p-4">
            {isCombat ? (
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            disabled={(combatCooldowns['bash'] || 0) > 0}
                            onClick={() => onSkill('bash')}
                            className="flex flex-col items-center justify-center w-16 h-16 bg-red-950 border border-red-800 rounded text-red-400 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShieldAlert size={20} />
                            <span className="text-[10px] font-bold mt-1">BASH</span>
                            {(combatCooldowns['bash'] || 0) > 0 && <span className="absolute text-xl font-bold text-white shadow-black drop-shadow-md">{Math.ceil(combatCooldowns['bash']/1000)}</span>}
                        </button>
                        <button 
                            disabled={(combatCooldowns['fireball'] || 0) > 0}
                            onClick={() => onSkill('fireball')}
                            className="flex flex-col items-center justify-center w-16 h-16 bg-blue-950 border border-blue-800 rounded text-blue-400 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <button 
                        onClick={onRest}
                        className="w-full py-4 bg-emerald-950/30 border border-emerald-900 text-emerald-400 rounded hover:bg-emerald-900/50 flex items-center justify-center gap-2"
                    >
                        <Tent size={18} /> REST (Recover HP/MP)
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default RoomPanel;