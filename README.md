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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:

Create the following tables in your Supabase project:

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

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technologies Used

- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Open source Firebase alternative
- **Recharts** - Composable charting library for React
- **Lucide Icons** - Beautiful SVG icons

## License

This project is open source and available under the [MIT License](LICENSE).
