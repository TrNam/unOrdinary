import { initDB } from './init';
import { Exercise } from './types';

export const addExercise = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'INSERT INTO exercises (name) VALUES (?);',
      [name]
    );
    return result.lastInsertRowId as number;
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
};

export const getExercises = async (): Promise<Exercise[]> => {
  const db = await initDB();
  try {
    const results = await db.getAllAsync<Exercise>('SELECT * FROM exercises;');
    return results;
  } catch (error) {
    console.error('Error getting exercises:', error);
    throw error;
  }
};

export const updateExercise = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'UPDATE exercises SET name = ? WHERE id = ?;',
      [name, id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

export const deleteExercise = async (id: number): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'DELETE FROM exercises WHERE id = ?;',
      [id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
};