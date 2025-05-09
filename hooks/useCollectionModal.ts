import { addCollection, addSplitCollection, getCollections, getSplitCollections } from '@/database/collections';
import { SplitCollection } from '@/database/types';
import { useCallback, useState } from 'react';

// Generic hook
export function useCollectionModal(
  onCollectionsUpdate: (collections: any[]) => void,
  options?: {
    add: (name: string) => Promise<number | undefined>;
    get: () => Promise<any[]>;
    label?: string;
  }
) {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [shake, setShake] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      const data = await (options?.get ? options.get() : getCollections());
      setCollections(data);
      onCollectionsUpdate(data); // This updates the parent component's state
      return data; // Return the data for external use if needed
    } catch (error) {
      console.error('Error fetching collections:', error);
      return []; // Return empty array on error
    }
  }, [onCollectionsUpdate, options]);

  const open = useCallback(async () => {
    setVisible(true);
    setInput('');
    setError(undefined);
    setShake(false);
    await fetchCollections();
  }, [fetchCollections]);

  const close = useCallback(() => {
    setVisible(false);
    setError(undefined);
    setShake(false);
    setInput('');
  }, []);

  const onChangeText = useCallback((text: string) => {
    setInput(text);
    if (error) setError(undefined);
  }, [error]);

  const onOk = useCallback(async (inputRef?: React.RefObject<any>) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Input field is empty');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      if (inputRef && inputRef.current) inputRef.current.focus();
      return false;
    }
    if (collections.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`${options?.label || 'Collection'} name already existed`);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      if (inputRef && inputRef.current) inputRef.current.focus();
      return false;
    }
    setLoading(true);
    try {
      const insertId = await (options?.add ? options.add(trimmed) : addCollection(trimmed));
      if (!insertId) {
        setError('Failed to add. Please try again.');
        setLoading(false);
        if (inputRef && inputRef.current) inputRef.current.focus();
        return false;
      }
      await fetchCollections();
      setLoading(false);
      close();
      return true;
    } catch (e) {
      setError('Failed to add. Please try again.');
      setLoading(false);
      if (inputRef && inputRef.current) inputRef.current.focus();
      return false;
    }
  }, [input, collections, fetchCollections, close, options]);

  const onClearError = useCallback(() => {
    setError(undefined);
    setShake(false);
  }, []);

  return {
    visible,
    input,
    error,
    shake,
    open,
    close,
    onChangeText,
    onOk,
    onClearError,
    setInput,
    loading,
  };
}

// Specialized hook for splits
export function useSplitCollectionModal(onCollectionsUpdate: (collections: SplitCollection[]) => void) {
  return useCollectionModal(onCollectionsUpdate, {
    add: addSplitCollection,
    get: getSplitCollections,
    label: 'Split',
  });
} 