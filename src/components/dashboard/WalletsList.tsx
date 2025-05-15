'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Wallet } from '@/lib/supabase';
import { PlusCircle, Edit, Trash } from 'lucide-react';

const WalletsList = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([
          { name: newWalletName, balance: parseFloat(newWalletBalance) || 0 }
        ])
        .select();
      
      if (error) throw error;
      
      setWallets([...(data || []), ...wallets]);
      setNewWalletName('');
      setNewWalletBalance('');
      setShowAddForm(false);
      fetchWallets();
    } catch (error) {
      console.error('Error adding wallet:', error);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setWallets(wallets.filter(wallet => wallet.id !== id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  if (loading && wallets.length === 0) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>;
  }

  return (
    <div>
      {wallets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No wallets found. Add your first wallet to get started.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Your Wallets</h3>
            <button 
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add New
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {wallets.map(wallet => (
              <div key={wallet.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{wallet.name}</h4>
                  <p className="text-2xl font-semibold text-gray-700">
                    Rp {wallet.balance.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/wallets/${wallet.id}`} className="text-gray-400 hover:text-gray-500">
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteWallet(wallet.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Wallet</h3>
            <form onSubmit={handleAddWallet}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Wallet Name</label>
                <input
                  type="text"
                  id="name"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="balance" className="block text-sm font-medium text-gray-700">Initial Balance</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    id="balance"
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(e.target.value)}
                    className="block w-full pl-10 pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                    step="1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletsList; 