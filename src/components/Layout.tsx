import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import clsx from 'clsx';
import React, { useState } from 'react';
import { createTask, createHabit } from '../services/db';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'checklist', label: 'Tasks', path: '/tasks' },
  { icon: 'calendar_today', label: 'Calendar', path: '/calendar' },
  { icon: 'analytics', label: 'Analytics', path: '/analytics' },
  { icon: 'auto_awesome', label: 'Habits', path: '/habits' },
  { icon: 'timer', label: 'Focus', path: '/focus' },
];

export default function Layout() {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low'|'medium'|'high'>('medium');
  const [entryType, setEntryType] = useState<'task' | 'habit'>('task');
  const [habitFrequency, setHabitFrequency] = useState<'daily'|'weekly'|'monthly'>('daily');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !user) return;
    try {
      if (entryType === 'task') {
        await createTask({
          userId: user.uid,
          title: taskTitle,
          priority: taskPriority,
          tags: [],
          completed: false,
          status: 'todo'
        });
      } else {
        await createHabit({
          userId: user.uid,
          name: taskTitle,
          icon: 'check_circle',
          streak: 0,
          completedToday: false,
          priority: taskPriority,
          frequency: habitFrequency
        });
      }
      setTaskTitle('');
      setTaskModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-background text-on-background font-sans min-h-screen overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      {/* SideNavBar */}
      <nav className={clsx(
        "fixed left-0 top-0 h-full w-[280px] bg-surface-container/50 backdrop-blur-xl border-r border-border-glass shadow-xl flex flex-col z-40 transition-transform duration-300 md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-lg pb-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary-container flex items-center justify-center shadow-[0_0_15px_rgba(107,216,203,0.3)]">
              <span className="material-symbols-outlined text-background icon-fill" style={{ fontSize: 24 }}>psychiatry</span>
            </div>
            <div>
              <h1 className="font-bold text-primary text-[24px] leading-[28px]">Velora</h1>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mt-1 whitespace-nowrap">Clarity. Focus. Execution.</p>
            </div>
          </div>
          <button className="md:hidden text-on-surface-variant" onClick={() => setMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-md flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            if (isActive) {
              return (
                <Link key={item.path} to={item.path} className="flex items-center gap-3 bg-primary/10 text-primary border-l-4 border-primary px-4 py-3 font-medium text-[14px] scale-[0.99] transition-transform mx-2 rounded-r-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"></div>
                  <span className="material-symbols-outlined icon-fill relative z-10">{item.icon}</span>
                  <span className="relative z-10 font-bold">{item.label}</span>
                </Link>
              );
            }
            return (
              <Link key={item.path} to={item.path} className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-3 transition-colors hover:bg-white/5 transition-all duration-300 font-medium text-[14px] hover:scale-[0.99] mx-2 rounded-lg">
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-lg mt-auto border-t border-border-glass/50 flex flex-col gap-2">
          <button onClick={logout} className="flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-3 transition-colors hover:bg-white/5 transition-all duration-300 font-medium text-[14px] rounded-lg text-left">
            <span className="material-symbols-outlined">logout</span>
            Sign out
          </button>
          <button className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-3 transition-colors hover:bg-white/5 transition-all duration-300 font-medium text-[14px] rounded-lg text-left">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </div>
      </nav>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-16 bg-surface/30 backdrop-blur-md flex justify-between items-center px-lg z-30 transition-all border-b border-border-glass">
        <div className="flex items-center gap-6">
          <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/focus" className="text-on-surface-variant font-medium text-[14px] hover:text-primary transition-colors cursor-pointer">Focus Mode</Link>
            <button className="text-on-surface-variant font-medium text-[14px] hover:text-primary transition-colors cursor-pointer">Notifications</button>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 relative hidden sm:flex">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full shadow-[0_0_8px_rgba(255,176,205,0.8)]"></span>
          </button>
          <button onClick={() => setTaskModalOpen(true)} className="text-primary hover:text-primary-container transition-colors cursor-pointer flex items-center gap-2 font-bold text-[14px] bg-primary/10 px-3 sm:px-4 py-2 rounded-full border border-primary/20">
            <span className="material-symbols-outlined icon-fill">add_circle</span>
            <span className="hidden sm:inline">Quick Add</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-surface-variant to-surface-bright border border-border-glass overflow-hidden cursor-pointer sm:ml-2 shrink-0" title={user?.email || 'User'}>
            {user?.photoURL ? (
               <img src={user.photoURL} alt="User profile" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center font-bold text-white uppercase">{user?.email?.charAt(0) || 'U'}</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-xl px-margin-mobile md:px-margin-desktop md:ml-[280px] min-h-screen">
        <Outlet />
      </main>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Task/Habit Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-border-glass rounded-xl p-lg w-full max-w-md backdrop-blur-xl relative shadow-2xl">
            <button onClick={() => setTaskModalOpen(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-xl font-bold text-on-surface mb-6">Quick Add</h2>
            <form onSubmit={handleQuickAdd} className="flex flex-col gap-4">
              
              <div className="flex bg-surface-variant p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEntryType('task')}
                  className={clsx(
                    "flex-1 py-1.5 text-[14px] font-medium rounded-md transition-colors",
                    entryType === 'task' ? "bg-surface-container shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  One-off Task
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('habit')}
                  className={clsx(
                    "flex-1 py-1.5 text-[14px] font-medium rounded-md transition-colors",
                    entryType === 'habit' ? "bg-surface-container shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Daily Habit
                </button>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">
                  {entryType === 'task' ? 'Title' : 'Habit Name'}
                </label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-surface text-on-surface border border-border-glass rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                  placeholder={entryType === 'task' ? "What needs to be done?" : "e.g., Workout, Reading"}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p)}
                      className={clsx(
                        "flex-1 py-1.5 rounded-lg border text-[14px] font-medium transition-colors capitalize",
                        taskPriority === p 
                          ? p === 'high' ? "bg-error/20 border-error/50 text-error" 
                            : p === 'medium' ? "bg-warning/20 border-warning/50 text-warning" 
                            : "bg-success/20 border-success/50 text-success"
                          : "bg-surface-variant border-border-glass text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {entryType === 'habit' && (
                <div>
                  <label className="text-[12px] font-semibold text-on-surface-variant mb-1 block">Frequency</label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setHabitFrequency(f)}
                        className={clsx(
                          "flex-1 py-1.5 rounded-lg border text-[14px] font-medium transition-colors capitalize",
                          habitFrequency === f 
                            ? "bg-secondary/20 border-secondary/50 text-secondary"
                            : "bg-surface-variant border-border-glass text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!taskTitle.trim()}
                className="mt-2 bg-primary text-on-primary font-bold py-2 rounded-lg hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create {entryType === 'task' ? 'Task' : 'Habit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
