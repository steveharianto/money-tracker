'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Wallet, type Transaction } from '@/lib/supabase';
import { PlusCircle, ChevronRight, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';

const DashboardWallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchWallets(), fetchRecentTransactions()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('balance', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories:category_id(name),
          wallets:wallet_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Wallet Cards */}
      {wallets.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No wallets found</p>
          <Link href="/wallets" className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
            <PlusCircle className="w-4 h-4 mr-1" />
            Add your first wallet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className="p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition"
            >
              <div>
                <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                <p className="text-lg font-semibold text-gray-700">
                  Rp {wallet.balance.toLocaleString('id-ID')}
                </p>
              </div>
              <Link href={`/wallets/${wallet.id}`} className="text-gray-400 hover:text-indigo-600">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          ))}
          
          {wallets.length > 0 && (
            <Link 
              href="/wallets/transfer"
              className="w-full block text-center py-2 px-3 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50"
            >
              Transfer Between Wallets
            </Link>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-700">Recent Transactions</h3>
          <Link href="/transactions" className="text-xs text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">No recent transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                <div className={`p-2 rounded-full mr-3 ${
                  transaction.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {transaction.type === 'expense' ? (
                    <ArrowUpRight className={`h-4 w-4 text-red-600`} />
                  ) : (
                    <ArrowDownLeft className={`h-4 w-4 text-green-600`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description || (transaction as any).categories?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(transaction.date).toLocaleDateString()} • {(transaction as any).wallets?.name}
                  </p>
                </div>
                <p className={`text-sm font-medium ${
                  transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'} Rp {transaction.amount.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="flex space-x-2 pt-2">
        <Link 
          href="/wallets" 
          className="flex-1 text-center py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Manage Wallets
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('add-transaction'))}
            className="text-center py-2 px-3 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 flex items-center"
            title="Add New Transaction (Alt+N)"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>New</span>
            <span className="ml-1 text-xs text-gray-500">(Alt+N)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardWallets; 