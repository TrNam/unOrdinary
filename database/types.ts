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