import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  FirestoreError,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  createDemoHabit,
  createDemoTask,
  deleteDemoTask,
  isDemoUser,
  subscribeToDemoHabits,
  subscribeToDemoTasks,
  updateDemoHabit,
  updateDemoTask,
} from './demo';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  lastCompletedAt?: number;
  priority: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'weekly' | 'monthly';
  createdAt: number;
}

export const subscribeToHabits = (userId: string, callback: (habits: Habit[]) => void) => {
  if (!userId) return () => {};
  if (isDemoUser(userId)) return subscribeToDemoHabits(callback);

  const q = query(collection(db, 'habits'), where('userId', '==', userId), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const habits = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Habit[];
      callback(habits);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'habits');
    }
  );
};

export const createHabit = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
  if (isDemoUser(habitData.userId)) return createDemoHabit(habitData);

  try {
    const newDocRef = doc(collection(db, 'habits'));
    const habit = { ...habitData, id: newDocRef.id, createdAt: Date.now() };
    await setDoc(newDocRef, habit);
    return habit;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'habits');
  }
};

export const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
  if (habitId.startsWith('demo-habit-')) {
    updateDemoHabit(habitId, updates);
    return;
  }

  try {
    const docRef = doc(db, 'habits', habitId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `habits/${habitId}`);
  }
};

export const deleteHabit = async (habitId: string) => {
  try {
    const docRef = doc(db, 'habits', habitId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `habits/${habitId}`);
  }
};

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  if (!userId) return () => {};
  if (isDemoUser(userId)) return subscribeToDemoTasks(callback);

  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    }
  );
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
  if (isDemoUser(taskData.userId)) return createDemoTask(taskData);

  try {
    const newDocRef = doc(collection(db, 'tasks'));
    const task = {
      ...taskData,
      id: newDocRef.id,
      createdAt: Date.now(),
    };
    await setDoc(newDocRef, task);
    return task;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  if (taskId.startsWith('demo-task-')) {
    updateDemoTask(taskId, updates);
    return;
  }

  try {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
};

export const deleteTaskFromDb = async (taskId: string) => {
  if (taskId.startsWith('demo-task-')) {
    deleteDemoTask(taskId);
    return;
  }

  try {
    const docRef = doc(db, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
};
