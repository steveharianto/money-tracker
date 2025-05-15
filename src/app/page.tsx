import TotalBalance from '@/components/dashboard/TotalBalance';
import WalletsList from '@/components/dashboard/WalletsList';
import AddTransactionForm from '@/components/dashboard/AddTransactionForm';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import HistoricalBalance from '@/components/dashboard/HistoricalBalance';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <HistoricalBalance />
          <div className="mt-6">
            <TotalBalance />
          </div>
          <div className="mt-6">
            <DashboardCharts />
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Transaction</h2>
          <AddTransactionForm />
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Wallets</h2>
        <WalletsList />
      </div>
    </div>
  );
}
