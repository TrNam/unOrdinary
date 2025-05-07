import { initDB } from './init';
import { Exercise, SQLiteResult } from './types';

export const addExercise = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  const result: SQLiteResult = await new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO exercises (name) VALUES (?);',
        [name],
        (_: any, { insertId, rowsAffected, rows }: any) => resolve({ insertId, rowsAffected, rows }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.insertId;
};

export const getExercises = async (): Promise<Exercise[]> => {
  const db = await initDB();
  const result = await new Promise<Exercise[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM exercises;',
        [],
        (_: any, { rows }: any) => resolve(rows._array as Exercise[]),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result;
};

export const updateExercise = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'UPDATE exercises SET name = ? WHERE id = ?;',
        [name, id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
};

export const deleteExercise = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'DELETE FROM exercises WHERE id = ?;',
        [id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
};