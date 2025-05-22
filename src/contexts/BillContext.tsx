import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabaseClient';

export type BillType = 'income' | 'expense';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  type: BillType;
  note: string;
  date: Date;
  fileURL?: string | null;
  due?: number; // Only adding due field here
}

interface BillContextType {
  bills: Bill[];
  totalIncome: number;
  totalExpenses: number;
  totalDue: number; // Add total due calculation
  profit: number;
  loading: boolean;
  error: string | null;
  refreshBills: () => Promise<void>;
  updateDueAmount: (billId: string, newDue: number) => Promise<void>; // Simple due updater
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export function BillProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchBills = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedBills: Bill[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        amount: item.amount,
        type: item.type,
        note: item.description || '',
        date: new Date(item.date),
        fileURL: item.bill_url || null,
        due: item.due || 0, // Initialize due amount
      }));

      setBills(formattedBills);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      const init = async () => {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
  
        if (authError || !user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
  
        setUserId(user.id);
      };
  
      init();
    }, []);
  
    useEffect(() => {
      if (!userId) return;
  
      fetchBills();
  
      const channel = supabase
        .channel('realtime-bills')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`,
          },
          () => fetchBills()
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, [userId])

  const { totalIncome, totalExpenses, totalDue, profit } = useMemo(() => {
    const income = bills
      .filter((bill) => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0);

    const expenses = bills
      .filter((bill) => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0);

    const due = bills
      .filter((bill) => bill.due && bill.due > 0)
      .reduce((sum, bill) => sum + (bill.due || 0), 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalDue: due,
      profit: income - expenses,
    };
  }, [bills]);

  const updateDueAmount = async (billId: string, newDue: number) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ due: newDue })
        .eq('id', billId);

      if (error) throw error;
      await fetchBills();
    } catch (err) {
      console.error('Failed to update due amount:', err);
      throw err;
    }
  };

  const contextValue: BillContextType = useMemo(() => ({
    bills,
    totalIncome,
    totalExpenses,
    totalDue,
    profit,
    loading,
    error,
    refreshBills: fetchBills,
    updateDueAmount,
  }), [bills, totalIncome, totalExpenses, totalDue, profit, loading, error]);

  return (
    <BillContext.Provider value={contextValue}>
      {children}
    </BillContext.Provider>
  );
}

export const useBill = (): BillContextType => {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error('useBill must be used within a BillProvider');
  }
  return context;
};

export default BillContext;