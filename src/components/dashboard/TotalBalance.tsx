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
    <div className="flex justify-start items-center">
      {loading ? (
        <div className="animate-pulse h-16 w-64 bg-gray-100 rounded-md"></div>
      ) : (
        <p className="text-5xl font-bold text-blue-600">
          Rp {totalBalance.toLocaleString('id-ID')}
        </p>
      )}
    </div>
  );
};

export default TotalBalance; 