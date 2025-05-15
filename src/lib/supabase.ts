import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key will come from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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