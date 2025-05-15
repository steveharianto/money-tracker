'use client';

import { useState, useEffect } from 'react';
import { supabase, type Transaction, type Category, type Wallet } from '@/lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const DashboardCharts = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState('expenses');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchTransactions(),
          fetchCategories(),
          fetchWallets()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTransactions = async () => {
    // Get the first day of the current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false });
    
    if (error) throw error;
    setTransactions(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) throw error;
    setCategories(data || []);
  };

  const fetchWallets = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');
    
    if (error) throw error;
    setWallets(data || []);
  };

  const getCategoryData = () => {
    const filteredTransactions = transactions.filter(t => t.type === activeTab);
    
    const categoryGroups = filteredTransactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryGroups).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Unknown',
        value: amount
      };
    });
  };

  const getWalletDistribution = () => {
    return wallets.map(wallet => ({
      name: wallet.name,
      value: wallet.balance
    }));
  };

  const getDailyTransactions = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= lastWeek && date <= today;
    });

    const dailyData: Record<string, { date: string, income: number, expense: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, income: 0, expense: 0 };
    }

    lastWeekTransactions.forEach(transaction => {
      const { date, amount, type } = transaction;
      if (dailyData[date]) {
        if (type === 'income') {
          dailyData[date].income += amount;
        } else {
          dailyData[date].expense += amount;
        }
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>;
  }

  const categoryData = getCategoryData();
  const walletData = getWalletDistribution();
  const dailyData = getDailyTransactions();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>

      <div className="mb-4">
        <div className="sm:hidden">
          <select
            id="tabs"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="expenses">Expenses</option>
            <option value="income">Income</option>
            <option value="wallets">Wallets</option>
            <option value="trends">Trends</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {['expenses', 'income', 'wallets', 'trends'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="h-80">
        {(activeTab === 'expenses' || activeTab === 'income') && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2 capitalize">{activeTab} by Category</h3>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No {activeTab} data for this month</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {activeTab === 'wallets' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Distribution</h3>
            {walletData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No wallet data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={walletData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {walletData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {activeTab === 'trends' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Last 7 Days Trends</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#00C49F" />
                <Bar dataKey="expense" name="Expense" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts; 