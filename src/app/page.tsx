'use client';

import { useState, useEffect } from 'react';
import TotalBalance from '@/components/dashboard/TotalBalance';
import Link from 'next/link';
import AddTransactionForm from '@/components/dashboard/AddTransactionForm';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import HistoricalBalance from '@/components/dashboard/HistoricalBalance';
import DashboardWallets from '@/components/dashboard/DashboardWallets';
import { PlusCircle, Wallet, TrendingUp, Activity, Plus } from 'lucide-react';

export default function Home() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Handle the custom event for adding transactions and keyboard shortcuts
  useEffect(() => {
    const handleAddTransaction = () => setShowTransactionForm(true);
    window.addEventListener('add-transaction', handleAddTransaction);
    
    // Add keyboard shortcut (Alt+N for "New Transaction")
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setShowTransactionForm(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('add-transaction', handleAddTransaction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Add Transaction Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Alt+N</span>
          <button 
            onClick={() => setShowTransactionForm(true)}
            className="inline-flex items-center justify-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Add New Transaction (Alt+N)"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Total Balance and Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Total Balance Card */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-6 w-6" />
              <h2 className="text-xl font-bold">Total Balance</h2>
            </div>
            <TotalBalance />
          </div>

          {/* Historical Chart */}
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Balance Trends</h2>
              </div>
            </div>
            <HistoricalBalance />
          </div>

          {/* Financial Overview */}
          <div className="bg-white shadow rounded-xl p-6">
            <DashboardCharts />
          </div>
        </div>

        {/* Right Column - Wallet Summary */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Wallets</h2>
              </div>
              <Link href="/wallets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                Manage →
              </Link>
            </div>
            <DashboardWallets />
          </div>
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
