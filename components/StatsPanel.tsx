
import React from 'react';
import { Player, Item } from '../types';
import { Shield, Sword, Sparkles, Footprints, Heart, Zap, User, Backpack, Star } from 'lucide-react';

interface StatsPanelProps {
  player: Player;
  onEquip: (item: Item) => void;
  onDrop: (item: Item) => void;
  onUse: (item: Item) => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ player, onEquip, onDrop, onUse }) => {
  
  const getStatBonus = (stat: 'str' | 'int' | 'dex') => {
    let bonus = 0;
    (Object.values(player.equipment) as (Item | null)[]).forEach(item => {
      if (item && item.stats && item.stats[stat]) bonus += item.stats[stat]!;
    });
    return bonus;
  };

  const renderBar = (current: number, max: number, colorClass: string, label: string, icon: React.ReactNode) => {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1 uppercase text-slate-400">
          <span className="flex items-center gap-1">{icon} {label}</span>
          <span>{Math.floor(current)} / {max}</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const renderItem = (item: Item | null, slotName: string) => {
      if (!item) return <div className="text-slate-600 text-xs italic">Empty {slotName}</div>;
      
      let color = 'text-slate-300';
      if (item.rarity === 'uncommon') color = 'text-emerald-400';
      if (item.rarity === 'rare') color = 'text-blue-400';
      if (item.rarity === 'legendary') color = 'text-amber-400';

      return (
        <div className="group relative border border-slate-700 bg-slate-900/50 p-2 rounded text-xs cursor-pointer hover:border-slate-500">
            <div className={`font-bold ${color}`}>{item.name}</div>
            <div className="text-[10px] text-slate-500">{item.rarity} {item.type}</div>
             {/* Tooltip-ish stats */}
             <div className="mt-1 text-slate-400">
                {item.stats?.damage && <div>Dmg: +{item.stats.damage}</div>}
                {item.stats?.armor && <div>AC: +{item.stats.armor}</div>}
                {item.stats?.str && <div>STR: +{item.stats.str}</div>}
            </div>
             <button onClick={() => onEquip(item)} className="absolute top-1 right-1 hidden group-hover:block bg-slate-700 text-white px-1 rounded hover:bg-slate-600">
                Unequip
             </button>
        </div>
      )
  }

  return (
    <div className="h-full flex flex-col gap-4 bg-slate-900 border-2 border-slate-700 rounded-md p-4 overflow-y-auto">
      {/* Vitals */}
      <div>
        <h3 className="text-emerald-500 font-bold mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
            <User size={16} /> {player.name} <span className="text-slate-500 text-xs font-normal">Lvl {player.level} {player.classType}</span>
        </h3>
        {renderBar(player.hp, player.maxHp, 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]', 'Health', <Heart size={12}/>)}
        {renderBar(player.mana, player.maxMana, 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]', 'Mana', <Sparkles size={12}/>)}
        {renderBar(player.move, player.maxMove, 'bg-amber-500', 'Stamina', <Footprints size={12}/>)}
        {renderBar(player.xp, player.xpToNext, 'bg-purple-500', 'Experience', <Star size={12}/>)}
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-slate-800 p-2 rounded border border-slate-700">
            <div className="text-red-400 font-bold block">STR</div>
            <div className="text-white">{player.str} <span className="text-emerald-500 text-[10px]">+{getStatBonus('str')}</span></div>
        </div>
        <div className="bg-slate-800 p-2 rounded border border-slate-700">
            <div className="text-blue-400 font-bold block">INT</div>
            <div className="text-white">{player.int} <span className="text-emerald-500 text-[10px]">+{getStatBonus('int')}</span></div>
        </div>
        <div className="bg-slate-800 p-2 rounded border border-slate-700">
            <div className="text-amber-400 font-bold block">DEX</div>
            <div className="text-white">{player.dex} <span className="text-emerald-500 text-[10px]">+{getStatBonus('dex')}</span></div>
        </div>
      </div>

      {/* Equipment */}
      <div>
        <h4 className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Shield size={12}/> Equipment</h4>
        <div className="flex flex-col gap-2">
            {renderItem(player.equipment.weapon, 'Weapon')}
            {renderItem(player.equipment.armor, 'Armor')}
            {renderItem(player.equipment.accessory, 'Relic')}
        </div>
      </div>

      {/* Inventory */}
      <div className="flex-1">
         <h4 className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-1"><Backpack size={12}/> Backpack ({player.inventory.length})</h4>
         <div className="space-y-2">
            {player.inventory.map((item, idx) => (
                <div key={item.id + idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-transparent hover:border-slate-600 text-xs">
                    <span className={
                        item.rarity === 'legendary' ? 'text-amber-400' :
                        item.rarity === 'rare' ? 'text-blue-400' :
                        item.rarity === 'uncommon' ? 'text-emerald-400' : 'text-slate-300'
                    }>{item.name}</span>
                    <div className="flex gap-1">
                        {item.type === 'consumable' ? (
                            <button onClick={() => onUse(item)} className="px-2 py-0.5 bg-green-900 text-green-200 rounded hover:bg-green-800">Use</button>
                        ) : (
                            <button onClick={() => onEquip(item)} className="px-2 py-0.5 bg-slate-700 text-slate-200 rounded hover:bg-slate-600">Eq</button>
                        )}
                        <button onClick={() => onDrop(item)} className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50">Dr</button>
                    </div>
                </div>
            ))}
            {player.inventory.length === 0 && <div className="text-slate-600 text-xs text-center py-4">Bag is empty</div>}
         </div>
      </div>
    </div>
  );
};

export default StatsPanel;
