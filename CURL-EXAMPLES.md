# 📋 Exemples de Requêtes cURL - API Wallet Analyzer

## Configuration
```bash
export API_URL="https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer"
export API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
export WALLET="HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk"
```

## 1. Health Check
```bash
curl -X GET "$API_URL/health" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"
```

## 2. Quick Analysis
```bash
curl -X GET "$API_URL/quick/$WALLET" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"
```

## 3. Complete Analysis
```bash
curl -X GET "$API_URL/complete/$WALLET" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"
```

## 4. Complete Analysis avec formatage JSON
```bash
curl -s -X GET "$API_URL/complete/$WALLET" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'
```

## 5. Extract Key Metrics Only
```bash
curl -s -X GET "$API_URL/complete/$WALLET" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '{
    data_source: .data_source,
    alpha_score: .data.alpha_analysis.alpha_score,
    alpha_category: .data.alpha_analysis.alpha_category,
    total_pnl: .data.trade_analysis.total_pnl_usd,
    win_rate: .data.trade_analysis.win_rate,
    recommendation: .data.copy_trading_recommendations.recommendation,
    allocation: .data.copy_trading_recommendations.suggested_allocation_percentage
  }'
```

## 6. Test Multiple Wallets
```bash
#!/bin/bash
WALLETS=(
  "HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk"
  "A1nCMZqrG46Es1jh92dQQisAq662SmxELLLsHHe4YWrH" 
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
)

for wallet in "${WALLETS[@]}"; do
  echo "Testing wallet: ${wallet:0:8}..."
  curl -s -X GET "$API_URL/quick/$wallet" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" | jq '{
      wallet: .wallet_address[0:8],
      alpha_score: .alpha_score,
      pnl: .total_pnl_usd,
      source: .data_source
    }'
  sleep 2
done
```

## URLs Directes pour Postman

### Health Check
```
GET https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/health
```

### Quick Analysis  
```
GET https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/quick/HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk
```

### Complete Analysis
```
GET https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/complete/HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk
```

## Headers Required
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU
Content-Type: application/json
```
