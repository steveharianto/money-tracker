'use client';

import { useState } from 'react';
import TotalBalance from '@/components/dashboard/TotalBalance';
import Link from 'next/link';
import AddTransactionForm from '@/components/dashboard/AddTransactionForm';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import HistoricalBalance from '@/components/dashboard/HistoricalBalance';
import { PlusCircle } from 'lucide-react';

export default function Home() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with Add Transaction Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button 
          onClick={() => setShowTransactionForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Balance Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Balance</h2>
        <TotalBalance />
      </div>

      {/* Historical Balance Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance History</h2>
        <HistoricalBalance />
      </div>

      {/* Financial Overview Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <DashboardCharts />
      </div>

      {/* Wallet Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Your Wallets</h2>
          <Link href="/wallets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Manage Wallets →
          </Link>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Add Transaction</h2>
              <button 
                onClick={() => setShowTransactionForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <AddTransactionForm />
          </div>
        </div>
      )}
    </div>
  );
}
