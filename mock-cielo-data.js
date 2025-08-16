// Données de test pour simuler une réponse Cielo quand l'API est bloquée
export const mockCieloData = {
  portfolio: [
    {
      symbol: 'SDOG',
      mint: '4ERBJKY3NnF2z718fQcFm9Q6MnHirZHXVrdpVbhwpump',
      balance: 1000000,
      value_usd: 8.34
    },
    {
      symbol: 'BONK',
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      balance: 50000000,
      value_usd: 12.45
    },
    {
      symbol: 'JUP',
      mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      balance: 100,
      value_usd: 85.30
    }
  ],
  
  pnl_tokens: [
    {
      token_symbol: 'SDOG',
      symbol: 'SDOG',
      mint: '4ERBJKY3NnF2z718fQcFm9Q6MnHirZHXVrdpVbhwpump',
      pnl_usd: 234.56,
      pnl_percentage: 15.7
    },
    {
      token_symbol: 'BONK',
      symbol: 'BONK', 
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      pnl_usd: -45.23,
      pnl_percentage: -8.2
    },
    {
      token_symbol: 'JUP',
      symbol: 'JUP',
      mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      pnl_usd: 567.89,
      pnl_percentage: 45.3
    },
    {
      token_symbol: 'WIF',
      symbol: 'WIF',
      mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      pnl_usd: 123.45,
      pnl_percentage: 12.1
    }
  ]
};

export default mockCieloData;
