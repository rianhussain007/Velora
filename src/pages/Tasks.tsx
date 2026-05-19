import { useState, useEffect } from 'react';
import { useAuthContext } from '../components/AuthProvider';
import { subscribeToTasks, Task, updateTask, deleteTaskFromDb } from '../services/db';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function Tasks() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTasks(user.uid, (fetched) => {
      setTasks(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const toggleTask = (task: Task) => {
    updateTask(task.id, { completed: !task.completed, completedAt: !task.completed ? Date.now() : undefined, status: !task.completed ? 'done' : 'todo' });
  };

  const removeTask = (taskId: string) => {
    deleteTaskFromDb(taskId);
  };

  if (loading) return <div className="p-8 text-on-surface-variant">Loading tasks...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <div className="mb-xl flex items-center justify-between">
        <div>
          <h2 className="text-[24px] md:text-[32px] font-semibold text-primary mb-2 tracking-tight">Your Tasks</h2>
          <p className="text-[16px] text-on-surface-variant">Manage your day, master your time.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant border border-border-glass rounded-xl bg-surface-container/20">
            <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">checklist</span>
            <p>No tasks yet. Create one to get started.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={clsx(
              "flex items-center gap-4 p-4 rounded-xl border bg-surface-container/40 backdrop-blur-sm transition-all shadow-sm",
              task.completed ? "border-border-glass opacity-50" : 
                task.priority === 'high' ? "border-l-4 border-l-error border-border-glass" :
                task.priority === 'medium' ? "border-l-4 border-l-warning border-border-glass" :
                "border-l-4 border-l-success border-border-glass"
            )}>
              <button 
                onClick={() => toggleTask(task)}
                className={clsx(
                  "w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0",
                  task.completed ? "bg-primary border-primary text-background" : "border-border-glass hover:border-primary"
                )}
              >
                {task.completed && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
              </button>
              
              <div className="flex-1">
                <h4 className={clsx("font-medium text-[16px] transition-all", task.completed ? "line-through text-on-surface-variant" : "text-on-surface")}>
                  {task.title}
                </h4>
                <div className="flex gap-4 mt-1 text-[12px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    {format(new Date(task.createdAt), 'MMM d, h:mm a')}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    {task.priority}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => removeTask(task.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                title="Delete task"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
