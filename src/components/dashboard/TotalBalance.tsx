'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const TotalBalance = () => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotalBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('balance');
        
        if (error) throw error;
        
        const total = data?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
        setTotalBalance(total);
      } catch (error) {
        console.error('Error fetching total balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalBalance();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Current Balance</h2>
        {loading ? (
          <div className="animate-pulse h-8 w-36 bg-gray-200 rounded"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            Rp {totalBalance.toLocaleString('id-ID')}
          </p>
        )}
      </div>
    </div>
  );
};

export default TotalBalance; 