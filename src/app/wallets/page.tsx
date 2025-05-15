import WalletsList from '@/components/dashboard/WalletsList';

export default function WalletsPage() {
  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Wallets</h1>
        <WalletsList />
      </div>
    </div>
  );
} 