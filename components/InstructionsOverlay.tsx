import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ScanLine, Sun } from 'lucide-react';

export const InstructionsOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check local storage on mount to see if user previously dismissed instructions
    const isDismissed = localStorage.getItem('mathlens-instructions-dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('mathlens-instructions-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-20 left-4 right-4 md:right-auto md:w-80 z-20 animate-in slide-in-from-left duration-700 fade-in pointer-events-auto">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl text-white relative overflow-hidden group">
        
        {/* Decorative gradient blob */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl group-hover:bg-indigo-500/40 transition-all"></div>

        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex items-center gap-2 text-indigo-300">
                <Lightbulb size={18} className="fill-indigo-500/20" />
                <h3 className="font-bold text-sm tracking-wide uppercase">Capture Tips</h3>
            </div>
            <button 
                onClick={handleDismiss}
                className="text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-full"
                aria-label="Dismiss instructions"
            >
                <X size={16} />
            </button>
        </div>
        
        <ul className="space-y-3 text-sm text-gray-200 relative z-10 font-medium">
          <li className="flex gap-3 items-center">
             <div className="bg-white/10 p-1.5 rounded-lg text-yellow-300">
               <Sun size={16} />
             </div>
             <span>Ensure <strong>good lighting</strong> on the page.</span>
          </li>
          <li className="flex gap-3 items-center">
             <div className="bg-white/10 p-1.5 rounded-lg text-blue-300">
               <ScanLine size={16} />
             </div>
             <span>Hold device <strong>steady</strong> & parallel.</span>
          </li>
           <li className="flex gap-3 items-center">
             <div className="bg-white/10 p-1.5 rounded-lg text-purple-300">
               <span className="font-bold text-xs w-4 h-4 flex items-center justify-center">∑</span>
             </div>
             <span>Center the problem in the <strong>box</strong>.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
