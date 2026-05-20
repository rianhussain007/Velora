import type { Habit, Task } from './db';

export const DEMO_USER_ID = 'demo-account';
export const DEMO_AUTH_STORAGE_KEY = 'velora:demo-auth';
const DEMO_TASKS_STORAGE_KEY = 'velora:demo-tasks';
const DEMO_HABITS_STORAGE_KEY = 'velora:demo-habits';
const DEMO_DATA_EVENT = 'velora:demo-data';

export const isDemoUser = (userId?: string | null) => userId === DEMO_USER_ID;

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
};

const seedTasks = (): Task[] => [
  {
    id: 'demo-task-1',
    userId: DEMO_USER_ID,
    title: 'Review weekly priorities',
    priority: 'high',
    tags: ['planning'],
    completed: true,
    createdAt: daysAgo(6, 9),
    completedAt: daysAgo(6, 10),
    status: 'done',
  },
  {
    id: 'demo-task-2',
    userId: DEMO_USER_ID,
    title: 'Draft focus plan for tomorrow',
    priority: 'medium',
    tags: ['focus'],
    completed: false,
    createdAt: daysAgo(1, 15),
    dueDate: daysAgo(0, 17),
    status: 'todo',
  },
  {
    id: 'demo-task-3',
    userId: DEMO_USER_ID,
    title: 'Close inbox triage',
    priority: 'low',
    tags: ['admin'],
    completed: true,
    createdAt: daysAgo(2, 11),
    completedAt: daysAgo(2, 11),
    status: 'done',
  },
];

const seedHabits = (): Habit[] => [
  {
    id: 'demo-habit-1',
    userId: DEMO_USER_ID,
    name: 'Morning planning',
    icon: 'wb_sunny',
    streak: 8,
    completedToday: true,
    lastCompletedAt: daysAgo(0, 8),
    priority: 'high',
    frequency: 'daily',
    createdAt: daysAgo(14, 8),
  },
  {
    id: 'demo-habit-2',
    userId: DEMO_USER_ID,
    name: 'Weekly reflection',
    icon: 'history_edu',
    streak: 3,
    completedToday: false,
    priority: 'medium',
    frequency: 'weekly',
    createdAt: daysAgo(21, 18),
  },
];

const readCollection = <T>(key: string, seed: () => T[]): T[] => {
  const existing = localStorage.getItem(key);
  if (existing) return JSON.parse(existing) as T[];

  const seeded = seed();
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
};

const writeCollection = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(DEMO_DATA_EVENT));
};

export const getDemoTasks = () =>
  readCollection<Task>(DEMO_TASKS_STORAGE_KEY, seedTasks).sort((a, b) => b.createdAt - a.createdAt);

export const getDemoHabits = () =>
  readCollection<Habit>(DEMO_HABITS_STORAGE_KEY, seedHabits).sort((a, b) => b.createdAt - a.createdAt);

export const subscribeToDemoTasks = (callback: (tasks: Task[]) => void) => {
  const emit = () => callback(getDemoTasks());
  emit();
  window.addEventListener(DEMO_DATA_EVENT, emit);
  return () => window.removeEventListener(DEMO_DATA_EVENT, emit);
};

export const subscribeToDemoHabits = (callback: (habits: Habit[]) => void) => {
  const emit = () => callback(getDemoHabits());
  emit();
  window.addEventListener(DEMO_DATA_EVENT, emit);
  return () => window.removeEventListener(DEMO_DATA_EVENT, emit);
};

export const createDemoTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
  const tasks = getDemoTasks();
  const task = { ...taskData, id: `demo-task-${Date.now()}`, createdAt: Date.now() };
  writeCollection(DEMO_TASKS_STORAGE_KEY, [task, ...tasks]);
  return task;
};

export const updateDemoTask = (taskId: string, updates: Partial<Task>) => {
  const tasks = getDemoTasks().map((task) => (task.id === taskId ? { ...task, ...updates } : task));
  writeCollection(DEMO_TASKS_STORAGE_KEY, tasks);
};

export const deleteDemoTask = (taskId: string) => {
  writeCollection(DEMO_TASKS_STORAGE_KEY, getDemoTasks().filter((task) => task.id !== taskId));
};

export const createDemoHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
  const habits = getDemoHabits();
  const habit = { ...habitData, id: `demo-habit-${Date.now()}`, createdAt: Date.now() };
  writeCollection(DEMO_HABITS_STORAGE_KEY, [habit, ...habits]);
  return habit;
};

export const updateDemoHabit = (habitId: string, updates: Partial<Habit>) => {
  const habits = getDemoHabits().map((habit) => (habit.id === habitId ? { ...habit, ...updates } : habit));
  writeCollection(DEMO_HABITS_STORAGE_KEY, habits);
};
