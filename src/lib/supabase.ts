import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a single supabase client for the entire app
export const supabase = createClientComponentClient();

// Database types
export type Wallet = {
  id: string;
  name: string;
  balance: number;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  created_at: string;
};

export type Transaction = {
  id: string;
  amount: number;
  description: string;
  category_id: string;
  wallet_id: string;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}; 