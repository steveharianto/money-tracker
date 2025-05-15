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
            i--; // Adjust index after removing item
          }
        }

        // Set the balance for this period
        period.balance = runningBalance;
      }
    }

    // Update state with calculated historical balances
    setHistoricalBalances(periods);
  };

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeRange(e.target.value as TimeRangeOption);
  };

  // Calculate the chart height dynamically, but with a minimum size
  const chartHeight = Math.max(300, Math.min(window.innerHeight * 0.4, 400));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <select
          value={selectedTimeRange}
          onChange={handleTimeRangeChange}
          className="block w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          {Object.values(TIME_RANGES).map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse w-full h-64 bg-gray-200 rounded"></div>
      ) : (
        <>
          {historicalBalances.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No historical data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart
                data={historicalBalances}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Balance']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricalBalance; 