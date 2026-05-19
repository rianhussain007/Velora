import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../components/AuthProvider';
import { subscribeToHabits, Habit, updateHabit, createHabit } from '../services/db';
import { isSameDay, startOfDay } from 'date-fns';

export default function Habits() {
  const { user } = useAuthContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToHabits(user.uid, (data) => {
      // Auto-reset completedToday if lastCompletedAt is not today
      const today = startOfDay(new Date()).getTime();
      const processedHabits = data.map(h => {
        if (h.completedToday && h.lastCompletedAt && h.lastCompletedAt < today) {
          // It's a new day, habit needs to be reset
          // We could ideally do this via a cloud function or on read
          // Let's just visually reset it here, and updating it will save it
          return { ...h, completedToday: false };
        }
        return h;
      });
      setHabits(processedHabits);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const isCompleting = !habit.completedToday;
    const today = Date.now();
    
    // Naive streak calculation
    let newStreak = habit.streak;
    if (isCompleting) newStreak += 1;
    else newStreak = Math.max(0, newStreak - 1);

    await updateHabit(habit.id, {
      completedToday: isCompleting,
      lastCompletedAt: isCompleting ? today : (habit.lastCompletedAt || today),
      streak: newStreak
    });
  };

  if (loading) {
     return <div className="p-8 text-on-surface-variant flex gap-2"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading habits...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <div className="mb-xl flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-semibold text-primary mb-2 tracking-tight">Habit Tracker</h2>
          <p className="text-[16px] text-on-surface-variant">Build consistency over time.</p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-20 bg-surface-container/30 border border-border-glass rounded-2xl">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">temp_preferences_custom</span>
          <h3 className="text-xl font-medium text-on-surface mb-2">No habits yet</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">Create your first daily habit using the Quick Add button in the top navigation bar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map(habit => (
            <div key={habit.id} className="bg-surface-container/40 border border-border-glass rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group hover:bg-surface-container/60 transition-all duration-300">
              {habit.completedToday && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-success/10 rounded-full blur-2xl pointer-events-none"></div>
              )}
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  habit.completedToday ? "bg-success/20 text-success" : "bg-surface-variant text-on-surface-variant"
                )}>
                  <span className="material-symbols-outlined">{habit.icon || 'check_circle'}</span>
                </div>
                
                <div className="bg-surface-variant border border-border-glass px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-warning icon-fill">local_fire_department</span>
                  <span className="text-[14px] font-bold font-mono">{habit.streak} streak</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-on-surface relative z-10">{habit.name}</h3>
                <span className={clsx(
                   "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                   habit.frequency === 'daily' ? "bg-primary/20 text-primary" : 
                   habit.frequency === 'weekly' ? "bg-secondary/20 text-secondary" : 
                   "bg-tertiary/20 text-tertiary"
                )}>
                  {habit.frequency}
                </span>
                <span className={clsx(
                   "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                   habit.priority === 'high' ? "bg-error/20 text-error" : 
                   habit.priority === 'medium' ? "bg-warning/20 text-warning" : 
                   "bg-success/20 text-success"
                )}>
                  {habit.priority}
                </span>
              </div>
              
              <button
                onClick={() => toggleHabit(habit)}
                className={clsx(
                  "w-full py-3 rounded-lg font-bold text-[14px] transition-all relative z-10 flex items-center justify-center gap-2",
                  habit.completedToday 
                    ? "bg-success/20 text-success border border-success/30 hover:bg-success/30" 
                    : "bg-surface-variant text-on-surface hover:bg-surface-bright border border-border-glass"
                )}
              >
                {habit.completedToday ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Completed
                  </>
                ) : (
                   "Mark Complete"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
