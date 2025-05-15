'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Wallet, type Transaction } from '@/lib/supabase';

export default function WalletDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchWallet(),
          fetchWalletTransactions()
        ]);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [params.id]);

  const fetchWallet = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
      return;
    }

    setWallet(data);
    setWalletName(data.name);
  };

  const fetchWalletTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', params.id)
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  const handleSaveWallet = async () => {
    if (!wallet || !walletName.trim()) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ name: walletName })
        .eq('id', wallet.id);

      if (error) throw error;

      setWallet({ ...wallet, name: walletName });
      setEditing(false);
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  const handleDeleteWallet = async () => {
    if (!wallet) return;

    // Check if there are transactions
    if (transactions.length > 0) {
      alert('Cannot delete wallet with transactions. Please delete all transactions first.');
      return;
    }

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id);

      if (error) throw error;

      router.push('/wallets');
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet Not Found</h1>
          <Link href="/wallets" className="text-indigo-600 hover:text-indigo-900">
            ← Return to wallets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          {editing ? (
            <div className="flex-1">
              <label htmlFor="walletName" className="block text-sm font-medium text-gray-700">
                Wallet Name
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="walletName"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">{wallet.name}</h1>
          )}

          <div className="ml-4 flex space-x-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWallet}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteWallet}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Balance</h2>
          <p className="text-3xl font-bold text-gray-900">
            Rp {wallet.balance.toLocaleString('id-ID')}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found for this wallet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description || '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link href="/wallets" className="text-indigo-600 hover:text-indigo-900">
            ← Return to wallets
          </Link>
        </div>
      </div>
    </div>
  );
}