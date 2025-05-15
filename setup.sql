-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id),
  wallet_id UUID REFERENCES wallets(id),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balance_history table
CREATE TABLE IF NOT EXISTS balance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_balance DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some default categories
INSERT INTO categories (name, type) VALUES
('Salary', 'income'),
('Bonus', 'income'),
('Interest', 'income'),
('Gift', 'income'),
('Food', 'expense'),
('Transport', 'expense'),
('Utilities', 'expense'),
('Shopping', 'expense'),
('Entertainment', 'expense'),
('Healthcare', 'expense'),
('Education', 'expense'),
('Other', 'expense')
ON CONFLICT DO NOTHING; 