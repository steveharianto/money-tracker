'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type Transaction, type Category, type Wallet } from '@/lib/supabase';
import { Trash } from 'lucide-react';

const TransactionsList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({}); 
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    walletId: 'all',
    categoryId: 'all'
  });

  const fetchTransactions = useCallback(async () => {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (filter.type !== 'all') {
      query = query.eq('type', filter.type);
    }
    
    if (filter.startDate) {
      query = query.gte('date', filter.startDate);
    }
    
    if (filter.endDate) {
      query = query.lte('date', filter.endDate);
    }
    
    if (filter.walletId !== 'all') {
      query = query.eq('wallet_id', filter.walletId);
    }
    
    if (filter.categoryId !== 'all') {
      query = query.eq('category_id', filter.categoryId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    setTransactions(data || []);
  }, [filter]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) throw error;
    
    const categoriesMap: Record<string, Category> = {};
    data?.forEach(category => {
      categoriesMap[category.id] = category;
    });
    
    setCategories(categoriesMap);
  }, []);

  const fetchWallets = useCallback(async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');
    
    if (error) throw error;
    
    const walletsMap: Record<string, Wallet> = {};
    data?.forEach(wallet => {
      walletsMap[wallet.id] = wallet;
    });
    
    setWallets(walletsMap);
  }, []);

  const fetchData = useCallback(async () => {
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
  }, [fetchTransactions, fetchCategories, fetchWallets]);

  useEffect(() => {
    fetchData();
  }, [filter, fetchData]);

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // First update the wallet balance
      const wallet = wallets[transaction.wallet_id];
      if (wallet) {
        const newBalance = transaction.type === 'income'
          ? wallet.balance - transaction.amount // Subtract income
          : wallet.balance + transaction.amount; // Add back expense
        
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id);
        
        if (walletError) throw walletError;
      }
      
      // Then delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      
      if (error) throw error;
      
      // Update the UI
      setTransactions(transactions.filter(t => t.id !== transaction.id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && transactions.length === 0) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            name="type"
            value={filter.type}
            onChange={handleFilterChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filter.startDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filter.endDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="walletId" className="block text-sm font-medium text-gray-700">Wallet</label>
          <select
            id="walletId"
            name="walletId"
            value={filter.walletId}
            onChange={handleFilterChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Wallets</option>
            {Object.values(wallets).map(wallet => (
              <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
            ))}
          </select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No transactions found for the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categories[transaction.category_id]?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {wallets[transaction.wallet_id]?.name || 'Unknown'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteTransaction(transaction)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionsList; 