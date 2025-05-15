import TransactionsList from '@/components/transactions/TransactionsList';
import AddTransactionForm from '@/components/dashboard/AddTransactionForm';

export default function TransactionsPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Transactions</h1>
            <TransactionsList />
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Transaction</h2>
          <AddTransactionForm />
        </div>
      </div>
    </div>
  );
} 