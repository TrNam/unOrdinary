import { initDB } from './init';
import { Split } from './types';

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

export const updateSplit = async (id: number, name: string, isFavorite: boolean): Promise<boolean> => {
  const db = await initDB();
  const result = await db.runAsync(
    'UPDATE splits SET name = ?, is_favorite = ? WHERE id = ?;',
    [name, isFavorite ? 1 : 0, id]
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
  console.log('Creating exercise in database:', { name, split_day_id, order });
  const exerciseResult = await db.runAsync(
    'INSERT INTO exercises (name, created_at) VALUES (?, datetime("now"));',
    [name]
  );
  const exerciseId = exerciseResult.lastInsertRowId as number;
  console.log('Created exercise with ID:', exerciseId);

  // Then, create the split day exercise
  console.log('Creating split day exercise link:', { split_day_id, exerciseId, order });
  const result = await db.runAsync(
    'INSERT INTO split_day_exercises (split_day_id, exercise_id, order_index, created_at) VALUES (?, ?, ?, datetime("now"));',
    [split_day_id, exerciseId, order]
  );
  const splitDayExerciseId = result.lastInsertRowId as number;
  console.log('Created split day exercise with ID:', splitDayExerciseId);
  return splitDayExerciseId;
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

export async function getSplitWithDaysAndExercises(splitId: number): Promise<Split> {
  const db = await initDB();
  
  // First verify the split exists
  console.log('Fetching split with ID:', splitId);
  const splitResult = await db.getFirstAsync<Split>(
    'SELECT * FROM splits WHERE id = ?;',
    [splitId]
  );

  if (!splitResult) {
    console.error('Split not found with ID:', splitId);
    throw new Error('Split not found');
  }
  console.log('Found split:', splitResult);

  // Then get the full data with days and exercises
  console.log('Fetching full split data with days and exercises');
  const results = await db.getAllAsync(`
    SELECT 
      s.id, s.name, s.created_at, s.order_index, s.is_favorite, s.is_default,
      sd.id as day_id, sd.day_of_week, sd.name as day_name,
      sde.id as exercise_id, e.name as exercise_name, sde.order_index as exercise_order
    FROM splits s
    LEFT JOIN split_days sd ON s.id = sd.split_id
    LEFT JOIN split_day_exercises sde ON sd.id = sde.split_day_id
    LEFT JOIN exercises e ON sde.exercise_id = e.id
    WHERE s.id = ?
    ORDER BY sd.day_of_week, sde.order_index;
  `, [splitId]);

  console.log('Raw query results:', JSON.stringify(results, null, 2));

  if (!results || results.length === 0) {
    console.log('No days or exercises found for split');
    return {
      ...splitResult,
      days: []
    };
  }

  const split: Split = {
    id: splitResult.id,
    name: splitResult.name,
    created_at: splitResult.created_at,
    order_index: splitResult.order_index,
    is_favorite: splitResult.is_favorite,
    is_default: splitResult.is_default,
    days: []
  };

  let currentDay: any = null;
  results.forEach((row: any) => {
    if (row?.day_id) {
      if (!currentDay || currentDay.id !== row.day_id) {
        currentDay = {
          id: row.day_id,
          day_of_week: row.day_of_week,
          name: row.day_name,
          exercises: []
        };
        split.days?.push(currentDay);
      }
      if (row?.exercise_id && row?.exercise_name) {
        currentDay.exercises.push({
          id: row.exercise_id,
          name: row.exercise_name,
          order_index: row.exercise_order
        });
      }
    }
  });

  console.log('Processed split data:', JSON.stringify(split, null, 2));
  return split;
}

export const toggleFavoriteSplit = async (id: number): Promise<boolean> => {
  const db = await initDB();
  
  // First, get the current favorite status
  const split = await db.getFirstAsync<{ is_favorite: number }>(
    'SELECT is_favorite FROM splits WHERE id = ?;',
    [id]
  );
  
  if (!split) return false;

  // If this split is already favorite, just unfavorite it
  if (split.is_favorite) {
    const result = await db.runAsync(
      'UPDATE splits SET is_favorite = 0 WHERE id = ?;',
      [id]
    );
    return result.changes > 0;
  }

  // Otherwise, unfavorite all splits and favorite this one
  await db.execAsync(`
    BEGIN TRANSACTION;
    UPDATE splits SET is_favorite = 0;
    UPDATE splits SET is_favorite = 1 WHERE id = ${id};
    COMMIT;
  `);

  return true;
};

export const getFavoriteSplit = async (): Promise<Split | null> => {
  const db = await initDB();
  return await db.getFirstAsync<Split>(
    'SELECT * FROM splits WHERE is_favorite = 1;'
  );
};

export async function saveWorkoutHistory(
  splitId: number, 
  dayOfWeek: number, 
  exercises: { name: string; sets: { weight: string; reps: string }[] }[],
  useMetric: boolean
) {
  const db = await initDB();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    // First, delete any existing entry for today
    await db.runAsync(
      'DELETE FROM workout_history WHERE date = ? AND split_id = ? AND day_of_week = ?',
      [today, splitId, dayOfWeek]
    );

    // Insert new workout history with unit information
    await db.runAsync(
      'INSERT INTO workout_history (date, split_id, day_of_week, exercises, use_metric) VALUES (?, ?, ?, ?, ?)',
      [today, splitId, dayOfWeek, JSON.stringify(exercises), useMetric ? 1 : 0]
    );

    return true;
  } catch (error) {
    console.error('Error saving workout history:', error);
    throw error;
  }
}

export async function getWorkoutHistory(date: string, splitId: number, dayOfWeek: number): Promise<{
  date: string;
  split_id: number;
  day_of_week: number;
  exercises: any;
  use_metric: number;
} | null> {
  const db = await initDB();
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM workout_history WHERE date = ? AND split_id = ? AND day_of_week = ?',
      [date, splitId, dayOfWeek]
    );
    return result as {
      date: string;
      split_id: number;
      day_of_week: number;
      exercises: any;
      use_metric: number;
    } | null;
  } catch (error) {
    console.error('Error getting workout history:', error);
    throw error;
  }
}

export async function createSplit(name: string, isFavorite: boolean): Promise<number> {
  const db = await initDB();
  const result = await db.runAsync(
    'INSERT INTO splits (name, is_favorite) VALUES (?, ?)',
    [name, isFavorite ? 1 : 0]
  );
  return result.lastInsertRowId as number;
}

export const setDefaultSplit = async (id: number, isDefault: boolean): Promise<boolean> => {
  const db = await initDB();
  
  // Get all splits and current default
  const splits = await db.getAllAsync<{ id: number; is_default: number }>(
    'SELECT id, is_default FROM splits;'
  );
  const defaultSplits = splits.filter(s => s.is_default === 1);
  
  if (isDefault) {
    // If setting as default, first unset all other defaults
    await db.runAsync('UPDATE splits SET is_default = 0;');
  } else {
    // If unsetting default, check if this is the only default
    if (defaultSplits.length === 1 && defaultSplits[0].id === id) {
      // Find another split to set as default
      const otherSplit = splits.find(s => s.id !== id);
      if (!otherSplit) {
        throw new Error('Cannot unset the only default split');
      }
      // Set the other split as default first
      await db.runAsync(
        'UPDATE splits SET is_default = 1 WHERE id = ?;',
        [otherSplit.id]
      );
    }
  }

  // Update the specified split
  const result = await db.runAsync(
    'UPDATE splits SET is_default = ? WHERE id = ?;',
    [isDefault ? 1 : 0, id]
  );
  return result.changes > 0;
}; 