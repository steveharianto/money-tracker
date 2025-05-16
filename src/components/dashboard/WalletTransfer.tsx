'use client';

import { useState, useEffect } from 'react';
import { supabase, type Wallet } from '@/lib/supabase';

const WalletTransfer = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [formData, setFormData] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '',
    description: 'Transfer between wallets'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && formData.fromWalletId === '') {
      setFormData(prev => ({
        ...prev,
        fromWalletId: wallets[0].id,
        toWalletId: wallets.length > 1 ? wallets[1].id : wallets[0].id
      }));
    }
  }, [wallets, formData.fromWalletId]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setTransferring(true);

    try {
      // Validation
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (formData.fromWalletId === formData.toWalletId) {
        throw new Error('Cannot transfer to the same wallet');
      }

      const fromWallet = wallets.find(w => w.id === formData.fromWalletId);
      if (!fromWallet) {
        throw new Error('Source wallet not found');
      }

      const toWallet = wallets.find(w => w.id === formData.toWalletId);
      if (!toWallet) {
        throw new Error('Destination wallet not found');
      }

      if (fromWallet.balance < amount) {
        throw new Error('Insufficient funds in source wallet');
      }

      // Start a transaction for atomicity
      // 1. Update source wallet (deduct amount)
      const { error: fromWalletError } = await supabase
        .from('wallets')
        .update({ balance: fromWallet.balance - amount })
        .eq('id', formData.fromWalletId);
      
      if (fromWalletError) throw fromWalletError;

      // 2. Update destination wallet (add amount)
      const { error: toWalletError } = await supabase
        .from('wallets')
        .update({ balance: toWallet.balance + amount })
        .eq('id', formData.toWalletId);
      
      if (toWalletError) throw toWalletError;

      // 3. Record the transaction as an expense from source wallet
      const { error: expenseError } = await supabase
        .from('transactions')
        .insert([{
          amount,
          description: `${formData.description} (Transfer to ${toWallet.name})`,
          type: 'expense',
          wallet_id: formData.fromWalletId,
          date: new Date().toISOString().split('T')[0]
        }]);
      
      if (expenseError) throw expenseError;

      // 4. Record the transaction as income to destination wallet
      const { error: incomeError } = await supabase
        .from('transactions')
        .insert([{
          amount,
          description: `${formData.description} (Transfer from ${fromWallet.name})`,
          type: 'income',
          wallet_id: formData.toWalletId,
          date: new Date().toISOString().split('T')[0]
        }]);
      
      if (incomeError) throw incomeError;

      // 5. Record balance history
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('balance');
      
      if (walletsError) throw walletsError;
      
      const totalBalance = walletsData?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
      
      const { error: historyError } = await supabase
        .from('balance_history')
        .insert([{
          total_balance: totalBalance,
          timestamp: new Date().toISOString()
        }]);
      
      if (historyError) {
        console.error('Error recording balance history:', historyError);
        // Continue even if balance history recording fails
      }

      // Reset form and show success message
      setFormData({
        ...formData,
        amount: '',
        description: 'Transfer between wallets'
      });
      setSuccess(`Successfully transferred Rp ${amount.toLocaleString('id-ID')} from ${fromWallet.name} to ${toWallet.name}`);
      
      // Refresh wallets
      fetchWallets();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to transfer funds');
      console.error('Transfer error:', error);
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>;
  }

  if (wallets.length < 1) {
    return <div className="text-center py-3">
      <p className="text-gray-500">You need at least one wallet to make transfers.</p>
    </div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fromWalletId" className="block text-sm font-medium text-gray-700">From Wallet</label>
        <select
          id="fromWalletId"
          name="fromWalletId"
          value={formData.fromWalletId}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          {wallets.map(wallet => (
            <option key={`from-${wallet.id}`} value={wallet.id}>
              {wallet.name} (Rp {wallet.balance.toLocaleString('id-ID')})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="toWalletId" className="block text-sm font-medium text-gray-700">To Wallet</label>
        <select
          id="toWalletId"
          name="toWalletId"
          value={formData.toWalletId}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          {wallets.map(wallet => (
            <option key={`to-${wallet.id}`} value={wallet.id}>
              {wallet.name} (Rp {wallet.balance.toLocaleString('id-ID')})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
            step="1"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-500 text-sm">{success}</div>
      )}

      <div>
        <button
          type="submit"
          disabled={transferring || wallets.length < 2}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {transferring ? 'Transferring...' : 'Transfer Funds'}
        </button>
      </div>
    </form>
  );
};

export default WalletTransfer; 