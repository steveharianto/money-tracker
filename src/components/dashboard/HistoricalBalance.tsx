'use client';

import { useState, useEffect } from 'react';
import { supabase, type Transaction, type BalanceHistory } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfDay, startOfMonth, startOfHour, endOfDay, endOfMonth, endOfHour, format, subMonths, subDays, subHours, parseISO } from 'date-fns';

type TimeRangeOption = 'day' | 'hour' | 'month';
type TimeRange = {
  label: string;
  value: TimeRangeOption;
  format: string;
  periodFn: (date: Date) => Date;
  endPeriodFn: (date: Date) => Date;
  subPeriodFn: (date: Date, amount: number) => Date;
  periods: number;
};

type BalancePoint = {
  date: string;
  balance: number;
  formattedDate: string;
};

const TIME_RANGES: Record<TimeRangeOption, TimeRange> = {
  hour: {
    label: 'Hourly',
    value: 'hour',
    format: 'HH:mm',
    periodFn: startOfHour,
    endPeriodFn: endOfHour,
    subPeriodFn: subHours,
    periods: 24,
  },
  day: {
    label: 'Daily',
    value: 'day',
    format: 'dd MMM',
    periodFn: startOfDay,
    endPeriodFn: endOfDay,
    subPeriodFn: subDays,
    periods: 30,
  },
  month: {
    label: 'Monthly',
    value: 'month',
    format: 'MMM yyyy',
    periodFn: startOfMonth,
    endPeriodFn: endOfMonth,
    subPeriodFn: subMonths,
    periods: 12,
  },
};

const HistoricalBalance = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>('day');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [historicalBalances, setHistoricalBalances] = useState<BalancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    fetchTotalBalance();
    fetchBalanceHistory();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if ((balanceHistory.length > 0 || transactions.length > 0) && !loading) {
      calculateHistoricalBalances();
    }
  }, [transactions, balanceHistory, selectedTimeRange, loading]);

  const fetchTotalBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
      setCurrentBalance(total);
    } catch (error) {
      console.error('Error fetching total balance:', error);
    }
  };

  const fetchBalanceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('balance_history')
        .select('*')
        .order('timestamp', { ascending: true });
      
      if (error) {
        // If the table doesn't exist yet, this will fail gracefully
        console.error('Error fetching balance history:', error);
        return;
      }
      
      setBalanceHistory(data || []);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // For simplicity, get all transactions
      // In a production app, you'd want to paginate or limit this
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHistoricalBalances = () => {
    const timeRange = TIME_RANGES[selectedTimeRange];
    const now = new Date();
    const periods: BalancePoint[] = [];

    // Create array of time periods
    for (let i = 0; i < timeRange.periods; i++) {
      const periodDate = timeRange.subPeriodFn(now, i);
      const periodStart = timeRange.periodFn(periodDate);
      const periodEnd = timeRange.endPeriodFn(periodDate);
      
      periods.unshift({
        date: format(periodStart, 'yyyy-MM-dd HH:mm:ss'),
        formattedDate: format(periodStart, timeRange.format),
        balance: 0,
      });
    }

    // If we have balance history data, use it
    if (balanceHistory.length > 0) {
      // Get the most recent balance for each period
      for (const period of periods) {
        const periodDate = new Date(period.date);
        const periodEnd = new Date(period.date);
        periodEnd.setDate(periodEnd.getDate() + 1); // End of the period

        // Find the most recent balance history entry before or at this period's end
        const relevantEntries = balanceHistory.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate <= periodEnd;
        });

        if (relevantEntries.length > 0) {
          // Sort by timestamp in descending order to get the most recent
          relevantEntries.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          period.balance = relevantEntries[0].total_balance;
        } else {
          // If no balance history entry is found for this period, use 0 or previous period's balance
          const prevPeriod = periods.find(p => new Date(p.date) < periodDate);
          period.balance = prevPeriod ? prevPeriod.balance : 0;
        }
      }
    } else {
      // If no balance history, fall back to transaction-based calculation
      // Start with current balance
      let runningBalance = currentBalance;

      // Go backward in time, subtracting transactions as we go
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const period of periods) {
        const periodDate = new Date(period.date);

        // Adjust balance based on transactions that happened after this period
        for (let i = 0; i < sortedTransactions.length; i++) {
          const transaction = sortedTransactions[i];
          const transactionDate = new Date(transaction.date);

          if (transactionDate > periodDate) {
            // This transaction happened after this period, so undo its effect
            if (transaction.type === 'income') {
              runningBalance -= transaction.amount; // Remove income that hadn't happened yet
            } else {
              runningBalance += transaction.amount; // Add back expense that hadn't happened yet
            }
            
            // Remove this transaction as we've accounted for it
            sortedTransactions.splice(i, 1);
            i--; // Adjust index since we removed an item
          }
        }

        period.balance = runningBalance;
      }
    }

    setHistoricalBalances(periods);
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeRange(e.target.value as TimeRangeOption);
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Historical Balance</h2>
        <select
          value={selectedTimeRange}
          onChange={handleTimeRangeChange}
          className="block border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Object.values(TIME_RANGES).map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-80">
        {historicalBalances.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No historical data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historicalBalances}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
              />
              <Tooltip 
                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Balance']}
                labelFormatter={(label) => `Balance on ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="balance" 
                name="Balance" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default HistoricalBalance; 