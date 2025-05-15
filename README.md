# Money Tracker

A simple and intuitive application to track your personal finances. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Dashboard**: View your total balance, recent transactions, and financial visualizations
- **Wallets**: Manage multiple wallets to track different accounts or cash reserves
- **Transactions**: Add income and expenses with categories
- **Visualizations**: See where your money goes with charts and graphs
- **Categories**: Automatically create categories on the fly while adding transactions

## Getting Started

### Prerequisites

- Node.js 14.6.0 or newer
- npm or yarn
- A Supabase account and project

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/money-tracker.git
cd money-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Set up Supabase:

a. Create the following tables in your Supabase project:

**wallets**
- id (uuid, primary key)
- name (text)
- balance (float)
- created_at (timestamp with timezone)

**categories**
- id (uuid, primary key)
- name (text)
- type (text, either 'income' or 'expense')
- created_at (timestamp with timezone)

**transactions**
- id (uuid, primary key)
- amount (float)
- description (text)
- type (text, either 'income' or 'expense')
- category_id (uuid, foreign key to categories.id)
- wallet_id (uuid, foreign key to wallets.id)
- date (date)
- created_at (timestamp with timezone)

b. Enable Email Authentication:
- Go to Authentication > Providers
- Enable Email provider
- Configure any additional settings as needed (password length, etc.)

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

6. Initial Setup:

- Open [http://localhost:3000/setup](http://localhost:3000/setup) in your browser
- Create an admin user account
- You'll be redirected to the login page once the account is created

7. Login and start using your Money Tracker:
- Open [http://localhost:3000/login](http://localhost:3000/login) with your browser
- Enter your credentials
- Start tracking your finances!

## Technologies Used

- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Open source Firebase alternative
- **Recharts** - Composable charting library for React
- **Lucide Icons** - Beautiful SVG icons

## License

This project is open source and available under the [MIT License](LICENSE).
