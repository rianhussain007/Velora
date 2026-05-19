import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function Focus() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished, swap modes
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
      // Play a sound or notification here ideally
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = mode === 'work' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="mb-8 text-center">
        <h2 className="text-[32px] font-semibold text-primary mb-2 tracking-tight">Focus Mode</h2>
        <p className="text-[16px] text-on-surface-variant">Deep work sessions, undisturbed.</p>
      </div>

      <div className="w-full max-w-md bg-surface-container/40 border border-border-glass rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl group flex flex-col items-center">
        <div className={clsx(
          "absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl transition-all duration-1000 opacity-20 pointer-events-none",
          mode === 'work' ? "bg-primary" : "bg-tertiary",
          isActive ? "scale-150 animate-pulse" : ""
        )}></div>

        {/* Mode Selector */}
        <div className="flex gap-2 bg-surface-variant p-1 rounded-full mb-12 relative z-10 w-full">
          <button 
            onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsActive(false); }}
            className={clsx(
              "flex-1 py-2 rounded-full text-sm font-semibold transition-all",
              mode === 'work' ? "bg-surface-container text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Deep Work
          </button>
          <button 
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
            className={clsx(
              "flex-1 py-2 rounded-full text-sm font-semibold transition-all",
              mode === 'break' ? "bg-surface-container text-tertiary shadow" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Short Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative w-64 h-64 mb-12 flex items-center justify-center z-10">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle 
              cx="128" cy="128" r="120" 
              fill="none" 
              stroke={mode === 'work' ? "#6bd8cb" : "#ffb0cd"} 
              strokeWidth="8" 
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className="transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center font-mono text-[72px] font-bold tracking-tighter text-on-surface">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
          <button 
            onClick={toggleTimer}
            className={clsx(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105",
              mode === 'work' ? "bg-primary text-background shadow-primary/20" : "bg-tertiary text-background shadow-tertiary/20"
            )}
          >
            <span className="material-symbols-outlined !text-[36px] icon-fill">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center hover:bg-surface-bright transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
