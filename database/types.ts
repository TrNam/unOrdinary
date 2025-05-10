// Database response shape
export interface SQLiteResult {
    insertId?: number;
    rowsAffected: number;
    rows: {
      item: (index: number) => any;
      length: number;
      _array: any[];
    };
  }
  
// Collection model
export interface Collection {
    id: number;
    name: string;
    created_at?: string;
}

// Exercise model
export interface Exercise {
    id: number;
    name: string;
    collection_id?: number;
}

export interface SplitCollection {
  id: number;
  name: string;
  created_at?: string;
}

export interface Split {
  id: number;
  name: string;
  created_at: string;
  order_index: number;
  is_favorite: number;
  is_default: number;
  days?: {
    id: number;
    day_of_week: number;
    name: string;
    exercises: {
      id: number;
      name: string;
      order_index: number;
    }[];
  }[];
}

export interface SplitDay {
  id: number;
  split_id: number;
  day_of_week: number;
  created_at?: string;
}

export interface SplitDayExercise {
  id: number;
  split_day_id: number;
  exercise_id: number;
  name: string;
  order_index: number;
  created_at?: string;
}