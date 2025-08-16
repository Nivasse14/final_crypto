#!/bin/bash

# Script de setup et test rapide pour le système ETL Copy Trading

echo "🚀 Copy Trading ETL & API Setup"
echo "================================"

# 1. Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# 2. Build TypeScript
echo "🔧 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# 3. Vérifier les variables d'environnement
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit .env with your database configuration"
fi

# 4. Test des modules (sans base de données)
echo "🧪 Testing price manager..."
node -e "
import('./dist/lib/prices.js').then(module => {
  const { priceManager } = module;
  console.log('✅ Price manager loaded');
  console.log('Stats:', priceManager.getStats());
}).catch(err => {
  console.error('❌ Price manager test failed:', err.message);
  process.exit(1);
});
"

echo "🧪 Testing metrics calculator..."
node -e "
import('./dist/lib/metrics.js').then(module => {
  const { MetricsCalculator } = module;
  const calc = new MetricsCalculator();
  console.log('✅ Metrics calculator loaded');
}).catch(err => {
  console.error('❌ Metrics calculator test failed:', err.message);
  process.exit(1);
});
"

# 5. Test avec données mock
echo "🧪 Testing with mock data..."
cat > test-data.json << 'EOF'
{
  "wallet_address": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  "pnl_fast": {
    "summary": {
      "tokens": [
        {
          "token_symbol": "BONK",
          "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          "total_buy_usd": 1000,
          "total_buy_amount": 50000000,
          "total_sell_usd": 800,
          "total_sell_amount": 40000000,
          "holding_amount": 10000000,
          "hold_time": 1440,
          "num_swaps": 2,
          "pnl_usd": 200,
          "pnl_percentage": 20,
          "last_trade": "2024-08-16T10:00:00Z"
        },
        {
          "token_symbol": "JUP",
          "token_address": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
          "total_buy_usd": 2000,
          "total_buy_amount": 200,
          "total_sell_usd": 2400,
          "total_sell_amount": 200,
          "holding_amount": 0,
          "hold_time": 720,
          "num_swaps": 1,
          "pnl_usd": 400,
          "pnl_percentage": 20,
          "last_trade": "2024-08-16T11:00:00Z"
        }
      ]
    }
  }
}
EOF

echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure your database in .env"
echo "  2. Run migrations: npm run migrate"
echo "  3. Start API server: npm run dev"
echo "  4. Test ETL: npx tsx cli/etl.ts process --file test-data.json"
echo ""
echo "📖 Full documentation in README.md"
