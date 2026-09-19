import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getPaginatedExpenseEntries } from '../lib/firebase/expenseService';
import { DailyMoneyEntry } from '../types/expense';
import { QueryDocumentSnapshot } from '../lib/firebase/firestore';

export interface UsePaginatedTransactionsOptions {
  pageSize?: number;
  direction?: 'desc' | 'asc';
  autoLoadFirstPage?: boolean;
}

export interface UsePaginatedTransactionsResult {
  entries: DailyMoneyEntry[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadFirstPage: () => Promise<void>;
  loadNextPage: () => Promise<void>;
  reset: () => void;
}

export function usePaginatedTransactions(
  options: UsePaginatedTransactionsOptions = {}
): UsePaginatedTransactionsResult {
  const { pageSize = 20, direction = 'desc', autoLoadFirstPage = true } = options;
  const { user } = useAuth();

  const [entries, setEntries] = useState<DailyMoneyEntry[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DailyMoneyEntry> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFirstPage = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getPaginatedExpenseEntries(user.uid, {
        pageSize,
        direction,
        startAfterDoc: null,
      });

      setEntries(result.entries);
      setLastDoc(result.lastVisibleDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error fetching first page of transactions:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user?.uid, pageSize, direction]);

  const loadNextPage = useCallback(async () => {
    if (!user?.uid || !hasMore || loading || loadingMore || !lastDoc) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await getPaginatedExpenseEntries(user.uid, {
        pageSize,
        direction,
        startAfterDoc: lastDoc,
      });

      setEntries((prev) => [...prev, ...result.entries]);
      setLastDoc(result.lastVisibleDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error fetching next page of transactions:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, hasMore, loading, loadingMore, lastDoc, pageSize, direction]);

  const reset = useCallback(() => {
    setEntries([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoLoadFirstPage && user?.uid) {
      loadFirstPage();
    }
  }, [autoLoadFirstPage, user?.uid, loadFirstPage]);

  return {
    entries,
    loading,
    loadingMore,
    hasMore,
    error,
    loadFirstPage,
    loadNextPage,
    reset,
  };
}

export default usePaginatedTransactions;
