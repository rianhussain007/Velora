import { useState, useEffect } from 'react';
import { useAuthContext } from '../components/AuthProvider';
import { subscribeToTasks, subscribeToHabits, Task, Habit } from '../services/db';
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import clsx from 'clsx';

export default function Calendar() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  useEffect(() => {
    if (!user) return;
    const unsubTasks = subscribeToTasks(user.uid, setTasks);
    const unsubHabits = subscribeToHabits(user.uid, setHabits);
    return () => {
      unsubTasks();
      unsubHabits();
    };
  }, [user]);

  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const todaysTasksAndHabits = [
    ...tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return task.dueDate 
        ? isSameDay(new Date(task.dueDate), selectedDate)
        : isSameDay(taskDate, selectedDate);
    }).map(t => ({...t, type: 'task' as const})),
    ...habits.filter(habit => {
      // Habit apply logic based on frequency
      const createdDate = startOfDay(new Date(habit.createdAt));
      const targetDate = startOfDay(selectedDate);
      
      if (targetDate.getTime() < createdDate.getTime()) return false;
      
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') {
        // Show only on the same day of the week it was created
        return targetDate.getDay() === createdDate.getDay();
      }
      if (habit.frequency === 'monthly') {
        // Show on the exact day of the month it was created
        // Also show a "Reminder" for 7 days before
        const targetCurrentMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), createdDate.getDate());
        const daysDiff = (targetCurrentMonth.getTime() - targetDate.getTime()) / (1000 * 3600 * 24);
        
        // Show on the day, OR if it's within 7 days before the due date for that month
        if (daysDiff === 0) return true;
        if (daysDiff > 0 && daysDiff <= 7) return true; // Reminder period
        return false;
      }
      return true;
    }).map(h => {
      // It's completed on this day if lastCompletedAt is on the selected date
      const completedOnDate = h.lastCompletedAt ? isSameDay(new Date(h.lastCompletedAt), selectedDate) : false;
      
      // Determine if it's a reminder
      let isReminder = false;
      if (h.frequency === 'monthly') {
         const targetDate = startOfDay(selectedDate);
         const createdDate = startOfDay(new Date(h.createdAt));
         const targetCurrentMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), createdDate.getDate());
         const daysDiff = (targetCurrentMonth.getTime() - targetDate.getTime()) / (1000 * 3600 * 24);
         if (daysDiff > 0 && daysDiff <= 7) isReminder = true;
      }

      return {
        id: h.id + '-habit' + (isReminder ? '-reminder' : ''),
        title: isReminder ? `Reminder: ${h.name} (in ${Math.round((new Date(selectedDate.getFullYear(), selectedDate.getMonth(), new Date(h.createdAt).getDate()).getTime() - selectedDate.getTime())/(1000*3600*24))} days)` : h.name,
        completed: isSameDay(selectedDate, new Date()) ? h.completedToday : completedOnDate,
        priority: h.priority || 'medium',
        createdAt: startOfDay(selectedDate).getTime(),
        type: 'habit' as const,
        frequency: h.frequency,
        isReminder
      }
    })
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <div className="mb-xl flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-semibold text-primary mb-2 tracking-tight">Calendar</h2>
          <p className="text-[16px] text-on-surface-variant">Schedule and plan your weeks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Weekly View Strip */}
        <div className="col-span-1 md:col-span-12 bg-surface-container/30 border border-border-glass rounded-xl p-md backdrop-blur-sm">
          <div className="flex justify-between items-center w-full">
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={clsx(
                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all min-w-[4rem]",
                    isSelected ? "bg-primary text-background shadow-lg shadow-primary/20 scale-105" : 
                    isToday ? "bg-surface-variant text-primary border border-primary/20" : 
                    "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                  )}
                >
                  <span className="text-[12px] font-bold uppercase tracking-wider mb-1">
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-[20px] font-medium">
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Schedule */}
        <div className="col-span-1 md:col-span-8 space-y-4">
          <h3 className="text-xl font-medium text-on-surface mb-6 flex items-center gap-2">
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
            {isSameDay(selectedDate, new Date()) && <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold px-2 py-1 rounded">Today</span>}
          </h3>

          {todaysTasksAndHabits.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant border border-border-glass rounded-xl bg-surface-container/20">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">event_available</span>
              <p>No tasks or habits scheduled for this day.</p>
            </div>
          ) : (
            todaysTasksAndHabits.map(item => (
              <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border-glass bg-surface-container/40 backdrop-blur-sm relative overflow-hidden group">
                <div className={clsx(
                  "absolute left-0 top-0 bottom-0 w-1",
                  item.completed ? "bg-success" : 
                  item.priority === 'high' ? "bg-error" : 
                  item.priority === 'medium' ? "bg-warning" : "bg-primary"
                )}></div>
                
                <div className="w-16 shrink-0 flex flex-col items-center justify-center text-on-surface-variant border-r border-border-glass pr-4">
                  {item.type === 'habit' ? (
                    <span className="material-symbols-outlined text-secondary">autorenew</span>
                  ) : (
                    <>
                      <span className="text-[14px] font-bold">{format(item.type === 'task' && 'dueDate' in item && item.dueDate ? item.dueDate : item.createdAt, 'h:mm')}</span>
                      <span className="text-[12px] uppercase">{format(item.type === 'task' && 'dueDate' in item && item.dueDate ? item.dueDate : item.createdAt, 'a')}</span>
                    </>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={clsx("font-medium text-[16px]", item.completed && "line-through text-on-surface-variant")}>
                    {item.title}
                  </h4>
                  <div className="flex gap-3 mt-2 text-[12px]">
                    <span className={clsx(
                      "px-2 py-1 rounded bg-surface-variant",
                      item.priority === 'high' ? "text-error" : item.priority === 'medium' ? "text-warning" : "text-primary"
                    )}>
                      {item.priority} priority
                    </span>
                    {item.type === 'habit' && !('isReminder' in item && item.isReminder) && (
                       <span className="px-2 py-1 rounded bg-secondary/10 text-secondary capitalize">
                         {item.frequency} Habit
                       </span>
                    )}
                    {item.type === 'habit' && 'isReminder' in item && item.isReminder && (
                       <span className="px-2 py-1 rounded bg-tertiary/10 text-tertiary flex items-center gap-1">
                         <span className="material-symbols-outlined text-[12px]">notifications_active</span> Reminder
                       </span>
                    )}
                    {item.completed && <span className="px-2 py-1 rounded bg-success/10 text-success flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check</span> Done</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Mini Calendar / Insights */}
        <div className="col-span-1 md:col-span-4 bg-surface-container/40 border border-border-glass rounded-xl p-6 backdrop-blur-sm self-start">
           <h4 className="font-semibold text-on-surface mb-4">Daily Insights</h4>
           <div className="space-y-4">
              <div className="bg-surface-variant p-4 rounded-lg flex items-start gap-3">
                 <span className="material-symbols-outlined text-secondary">tips_and_updates</span>
                 <p className="text-[14px] text-on-surface-variant leading-relaxed">
                   Tuesdays are historically your most productive days. Try scheduling complex deep work for Tuesday mornings.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
