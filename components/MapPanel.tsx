
import React, { useState, useRef } from 'react';
import { Room, Player } from '../types';
import { Rotate3d, Minus, Plus, Maximize, BoxSelect, Atom } from 'lucide-react';

interface MapPanelProps {
  rooms: Map<string, Room>;
  currentRoomId: string;
  player: Player;
}

const MapPanel: React.FC<MapPanelProps> = ({ rooms, currentRoomId, player }) => {
  const [rotation, setRotation] = useState({ x: -30, y: 45 });
  const [zoom, setZoom] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef<{ x: number, y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMouseRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMouseRef.current = null;
  };

  const currentRoom = rooms.get(currentRoomId);
  const allRooms: Room[] = Array.from(rooms.values());
  
  // Center camera on player
  const cx = currentRoom?.coordinates.x || 0;
  const cy = currentRoom?.coordinates.y || 0;
  const cz = currentRoom?.coordinates.z || 0;

  const CELL_SIZE = 40; // Size of each cube

  return (
    <div className="flex flex-col h-full bg-slate-950 border-2 border-slate-700 rounded-md overflow-hidden relative select-none">
       {/* Toolbar */}
       <div className="bg-slate-900 px-3 py-1 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold flex justify-between items-center z-20 relative shadow-md">
        <span className="flex items-center gap-2 text-emerald-500"><BoxSelect size={12}/> Voxel Map</span>
        <div className="flex gap-1 bg-slate-800 rounded p-0.5">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-1 hover:bg-slate-700 rounded hover:text-white"><Minus size={12}/></button>
            <button onClick={() => setZoom(1)} className="p-1 hover:bg-slate-700 rounded hover:text-white"><Maximize size={12}/></button>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-slate-700 rounded hover:text-white"><Plus size={12}/></button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-hidden relative bg-black cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
          {/* Legend */}
          <div className="absolute bottom-2 left-2 z-10 text-[10px] bg-black/80 p-2 rounded border border-slate-800 text-slate-400 pointer-events-none">
              <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-blue-500/20 border border-blue-400 block"></span> Safe</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-red-600/20 border border-red-500 block"></span> Hostile</div>
              <div className="flex items-center gap-2 mb-1"><Atom size={12} className="text-emerald-400" /> You</div>
              <div className="flex items-center gap-2"><Rotate3d size={10}/> Rotate</div>
          </div>

          {/* 3D Viewport */}
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ perspective: '800px' }}
          >
              <div 
                className="relative transform-style-3d transition-transform duration-75 ease-out will-change-transform"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${zoom}, ${zoom}, ${zoom})`,
                    transformStyle: 'preserve-3d',
                    width: '0px',
                    height: '0px'
                }}
              >
                  {allRooms.map((room) => {
                      // Coordinates relative to player to center camera on player
                      const x = (room.coordinates.x - cx) * CELL_SIZE;
                      const y = (room.coordinates.z - cz) * CELL_SIZE; // Game Z is Vertical Down (Y in CSS)
                      const z = (room.coordinates.y - cy) * -CELL_SIZE; // Game Y is North/South (Z in CSS)

                      const isCurrent = room.id === currentRoomId;
                      const hasEnemies = room.mobs.some(m => !m.isDead);
                      const isBoss = room.mobs.some(m => m.type === 'boss');

                      // Cube Styling - WIREFRAME LOOK
                      // Mostly transparent backgrounds, distinct borders
                      let faceColor = 'bg-blue-500/5'; 
                      let borderColor = 'border-blue-500/40';
                      
                      if (isCurrent) {
                          faceColor = 'bg-emerald-500/10';
                          borderColor = 'border-emerald-400';
                      } else if (isBoss) {
                          faceColor = 'bg-purple-500/10';
                          borderColor = 'border-purple-500/60';
                      } else if (hasEnemies) {
                          faceColor = 'bg-red-500/10';
                          borderColor = 'border-red-500/50';
                      }

                      const commonFaceClass = `absolute border box-border ${faceColor} ${borderColor}`;
                      const size = CELL_SIZE - 2; // Slight gap
                      const half = size / 2;

                      return (
                          <div 
                            key={room.id}
                            className="absolute transform-style-3d transition-all duration-300"
                            style={{
                                transform: `translate3d(${x}px, ${y}px, ${z}px)`,
                                width: size,
                                height: size
                            }}
                          >
                             {/* Front */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateY(0deg) translateZ(${half}px)` }} />
                             {/* Back */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateY(180deg) translateZ(${half}px)` }} />
                             {/* Right */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateY(90deg) translateZ(${half}px)` }} />
                             {/* Left */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
                             {/* Top */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateX(90deg) translateZ(${half}px)` }} />
                             {/* Bottom */}
                             <div className={commonFaceClass} style={{ width: size, height: size, transform: `rotateX(-90deg) translateZ(${half}px)` }} />
                             
                             {/* Player Avatar - Floating in Center */}
                             {isCurrent && (
                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center transform-style-3d pointer-events-none" style={{ transform: 'translateZ(0px)' }}>
                                    {/* Volumetric Rotating Container */}
                                    <div 
                                        className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,1)]"
                                        style={{ animation: 'spin3d 6s linear infinite' }}
                                    >
                                        <style dangerouslySetInnerHTML={{__html: `
                                            @keyframes spin3d {
                                                0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                                                100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg); }
                                            }
                                        `}} />
                                        <Atom size={size * 0.9} strokeWidth={2.5} />
                                    </div>
                                </div>
                             )}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default MapPanel;
