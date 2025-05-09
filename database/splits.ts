import { initDB } from './init';
import { Split, SplitDay, SplitDayExercise } from './types';

export const addSplit = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  
  // Get the current highest order_index
  const result = await db.getFirstAsync<{ max_order: number }>(
    'SELECT COALESCE(MAX(order_index), -1) as max_order FROM splits;'
  );
  const nextOrder = (result?.max_order ?? -1) + 1;
  
  // Insert the new split with the next order_index
  const insertResult = await db.runAsync(
    'INSERT INTO splits (name, order_index, created_at) VALUES (?, ?, datetime("now"));',
    [name, nextOrder]
  );
  return insertResult.lastInsertRowId as number;
};

export const updateSplit = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'UPDATE splits SET name = ? WHERE id = ?;',
    [name, id]
  );
  return result.changes > 0;
};

export const deleteSplit = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'DELETE FROM splits WHERE id = ?;',
    [id]
  );
  return result.changes > 0;
};

export const getSplits = async (): Promise<Split[]> => {
  const db = await initDB();
  return await db.getAllAsync<Split>('SELECT * FROM splits ORDER BY order_index ASC, created_at DESC;');
};

export const updateSplitOrder = async (id: number, order: number): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'UPDATE splits SET order_index = ? WHERE id = ?;',
    [order, id]
  );
  return result.changes > 0;
};

export const addSplitDay = async (split_id: number, day_of_week: number, name: string): Promise<number | undefined> => {
  const db = await initDB();
  const result = await db.runAsync(
    'INSERT INTO split_days (split_id, day_of_week, name, created_at) VALUES (?, ?, ?, datetime("now"));',
    [split_id, day_of_week, name]
  );
  return result.lastInsertRowId as number;
};

export const updateSplitDay = async (id: number, day_of_week: number): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'UPDATE split_days SET day_of_week = ? WHERE id = ?;',
    [day_of_week, id]
  );
  return result.changes > 0;
};

export const deleteSplitDay = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'DELETE FROM split_days WHERE id = ?;',
    [id]
  );
  return result.changes > 0;
};

export const addSplitDayExercise = async (split_day_id: number, name: string, order: number): Promise<number | undefined> => {
  const db = await initDB();
  
  // First, create the exercise
  const exerciseResult = await db.runAsync(
    'INSERT INTO exercises (name, created_at) VALUES (?, datetime("now"));',
    [name]
  );
  const exerciseId = exerciseResult.lastInsertRowId as number;

  // Then, create the split day exercise
  const result = await db.runAsync(
    'INSERT INTO split_day_exercises (split_day_id, exercise_id, order_index, created_at) VALUES (?, ?, ?, datetime("now"));',
    [split_day_id, exerciseId, order]
  );
  return result.lastInsertRowId as number;
};

export const updateSplitDayExercise = async (id: number, name: string, order: number): Promise<boolean> => {
  const db = await initDB();
  
  // First get the exercise_id
  const splitDayExercise = await db.getFirstAsync<{ exercise_id: number }>(
    'SELECT exercise_id FROM split_day_exercises WHERE id = ?;',
    [id]
  );
  
  if (!splitDayExercise) return false;

  // Update the exercise name
  await db.runAsync(
    'UPDATE exercises SET name = ? WHERE id = ?;',
    [name, splitDayExercise.exercise_id]
  );

  // Update the order
  const result = await db.runAsync(
    'UPDATE split_day_exercises SET order_index = ? WHERE id = ?;',
    [order, id]
  );
  
  return result.changes > 0;
};

export const deleteSplitDayExercise = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'DELETE FROM split_day_exercises WHERE id = ?;',
    [id]
  );
  return result.changes > 0;
};

export const getSplitWithDaysAndExercises = async (split_id: number) => {
  const db = await initDB();
  // Get split
  const split = await db.getFirstAsync<Split>('SELECT * FROM splits WHERE id = ?;', [split_id]);
  // Get days
  const days = await db.getAllAsync<SplitDay>('SELECT * FROM split_days WHERE split_id = ?;', [split_id]);
  // For each day, get exercises
  const daysWithExercises = await Promise.all(days.map(async (day) => {
    const exercises = await db.getAllAsync<SplitDayExercise>(
      `SELECT sde.*, e.name 
       FROM split_day_exercises sde
       JOIN exercises e ON sde.exercise_id = e.id
       WHERE sde.split_day_id = ? 
       ORDER BY sde.order_index ASC;`,
      [day.id]
    );
    return { ...day, exercises };
  }));
  return { ...split, days: daysWithExercises };
}; 