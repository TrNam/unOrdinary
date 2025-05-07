import { initDB } from './init';

export interface Collection {
  id: number;
  name: string;
  created_at?: string;
}

export const addCollection = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  const result = await new Promise<{ insertId?: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO collections (name, created_at) VALUES (?, datetime("now"));',
        [name],
        (_: any, { insertId }: any) => resolve({ insertId }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.insertId;
};

export const getCollections = async (): Promise<Collection[]> => {
  const db = await initDB();
  const result = await new Promise<Collection[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM collections;',
        [],
        (_: any, { rows }: any) => resolve(rows._array as Collection[]),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result;
};

export const updateCollection = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'UPDATE collections SET name = ? WHERE id = ?;',
        [name, id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
};

export const deleteCollection = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'DELETE FROM collections WHERE id = ?;',
        [id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
};

export interface SplitCollection {
  id: number;
  name: string;
  created_at?: string;
}

export const addSplitCollection = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  const result = await new Promise<{ insertId?: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO split_collections (name, created_at) VALUES (?, datetime("now"));',
        [name],
        (_: any, { insertId }: any) => resolve({ insertId }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.insertId;
};

export const getSplitCollections = async (): Promise<SplitCollection[]> => {
  const db = await initDB();
  const result = await new Promise<SplitCollection[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM split_collections;',
        [],
        (_: any, { rows }: any) => resolve(rows._array as SplitCollection[]),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result;
};

export const updateSplitCollection = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'UPDATE split_collections SET name = ? WHERE id = ?;',
        [name, id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
};

export const deleteSplitCollection = async (id: number): Promise<boolean> => {
  const db = await initDB();
  const result = await new Promise<{ rowsAffected: number }>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'DELETE FROM split_collections WHERE id = ?;',
        [id],
        (_: any, { rowsAffected }: any) => resolve({ rowsAffected }),
        (_: any, error: any) => reject(error)
      );
    });
  });
  return result.rowsAffected > 0;
}; 