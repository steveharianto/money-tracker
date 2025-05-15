'use client';

import { useState } from 'react';
import WalletsList from '@/components/dashboard/WalletsList';
import WalletTransfer from '@/components/dashboard/WalletTransfer';

export default function WalletsPage() {
  const [showTransferForm, setShowTransferForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Your Wallets</h1>
          <button 
            onClick={() => setShowTransferForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Transfer Funds
          </button>
        </div>
        <WalletsList />
      </div>
      
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Transfer Between Wallets</h2>
              <button 
                onClick={() => setShowTransferForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <WalletTransfer />
          </div>
        </div>
      )}
    </div>
  );
} 