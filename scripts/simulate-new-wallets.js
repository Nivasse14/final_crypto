const fs = require('fs');

// Simulation de nouveaux wallets "scrapés" depuis Dune
const generateNewWallets = () => {
  const generateRandomWallet = (index) => {
    const walletAddresses = [
      'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CTVQK',
      'AVNM3eNjKFGzKfyTyRgV3yQ4rBz8JhQxz9U5vRgQpD3R',
      'BGMhN6yJdVx4vUj3sLvRtG9Pz5FmTyNdQ8XwJkLbA2Sv',
      'CHKbvL3DqZq9kF5GtPjMx8HrNzJdUaVwP6Y4eRgBf7Tn',
      'DPGwXz2MnT8vFq4yRjVb9LsNpKxJdHgFe3AzUcQmB5Sk',
      'EQHmYt5BnV7pGk2jSzFdP9LrNqXvJdMgTe6ZuRbCx8Wa',
      'FRNgBv4CqX9mJt7yUzPd2LsVpKxFdMhGe8AzQbRnD5Tw',
      'GSBqCx5DnY8vJk2gUzTe3LrVpKdMfGh9A6ZuQmRbFw7S'
    ];

    const randomWalletAddress = walletAddresses[index % walletAddresses.length] + 
      Math.random().toString(36).substring(2, 8).toUpperCase();

    const totalPnlUsd = Math.random() * 2000000 + 50000; // Entre 50k et 2M
    const winRate = 0.6 + Math.random() * 0.3; // Entre 60% et 90%
    const tradeCount = Math.floor(Math.random() * 500) + 20; // Entre 20 et 520 trades
    const wins = Math.floor(tradeCount * winRate);
    const losses = tradeCount - wins;

    return {
      wallet: randomWalletAddress,
      solscan: `https://solscan.io/account/${randomWalletAddress}`,
      gmgn: `https://gmgn.ai/sol/address/${randomWalletAddress}`,
      cielo: `https://app.cielo.finance/profile/${randomWalletAddress}`,
      wallet_pnl_link: `https://dune.com/wallet/${randomWalletAddress}`,
      wallet_pnl: `$${totalPnlUsd.toFixed(0)}`,
      total_bought_usd: `$${(Math.random() * 500000 + 100000).toFixed(0)}`,
      total_pnl_usd: `$${totalPnlUsd.toFixed(0)}`,
      roi: `${(Math.random() * 500 + 50).toFixed(1)}%`,
      mroi: `${(Math.random() * 200 + 20).toFixed(1)}%`,
      invalids: Math.floor(Math.random() * 5).toString(),
      tokens: Math.floor(Math.random() * 100 + 10).toString(),
      nosells: Math.floor(Math.random() * 10).toString(),
      losses: losses.toString(),
      nulls: Math.floor(Math.random() * 3).toString(),
      wins: wins.toString(),
      winrate: `${(winRate * 100).toFixed(1)}%`,
      w2x: Math.floor(wins * 0.7).toString(),
      w10x: Math.floor(wins * 0.3).toString(),
      w100x: Math.floor(wins * 0.1).toString(),
      scalps: Math.floor(tradeCount * 0.2).toString(),
      scalp_ratio: `${(Math.random() * 0.3 + 0.1).toFixed(2)}`,
      bal: `$${(Math.random() * 100000 + 10000).toFixed(0)}`,
      bal_ratio: `${(Math.random() * 0.5 + 0.1).toFixed(2)}`,
      last_trade: `${Math.floor(Math.random() * 30) + 1}d ago`,
      trade_days: Math.floor(Math.random() * 365 + 30).toString(),
      trade_nums: tradeCount.toString(),
    };
  };

  const newWallets = [];
  for (let i = 0; i < 20; i++) {
    newWallets.push(generateRandomWallet(i));
  }

  return newWallets;
};

const uploadToSupabase = async (wallets) => {
  console.log('📤 Upload vers Supabase...');
  
  try {
    // Convertir les données Dune vers le format de la base
    const formattedWallets = wallets.map(wallet => {
      const totalPnlUsd = parseFloat(wallet.total_pnl_usd.replace(/[$,]/g, ''));
      const winrate = parseFloat(wallet.winrate.replace('%', '')) / 100;
      const tradeCount = parseInt(wallet.trade_nums);
      const wins = parseInt(wallet.wins);
      const losses = parseInt(wallet.losses);

      return {
        wallet_address: wallet.wallet,
        total_pnl_usd: totalPnlUsd,
        winrate: winrate,
        trade_count: tradeCount,
        roi: parseFloat(wallet.roi.replace('%', '')),
        wins: wins,
        losses: losses,
        tokens_traded: parseInt(wallet.tokens),
        last_trade_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          source: 'dune_simulated',
          scraped_at: new Date().toISOString(),
          original_data: wallet
        }
      };
    });

    // Upload batch vers wallet-registry
    const response = await fetch('https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/batch-insert', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ wallets: formattedWallets })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload réussi:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('❌ Erreur upload:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error);
    return null;
  }
};

const main = async () => {
  console.log('🎯 Génération de nouveaux wallets simulés...');
  
  const newWallets = generateNewWallets();
  console.log(`📊 ${newWallets.length} nouveaux wallets générés`);
  
  // Sauvegarder localement
  fs.writeFileSync('new-wallets-simulated.json', JSON.stringify(newWallets, null, 2));
  console.log('💾 Données sauvegardées dans new-wallets-simulated.json');
  
  // Upload vers Supabase
  const uploadResult = await uploadToSupabase(newWallets);
  
  if (uploadResult) {
    console.log('🎉 Nouveaux wallets ajoutés avec succès !');
    
    // Vérifier les résultats
    try {
      const checkResponse = await fetch('https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?limit=5&sortBy=created_at&sortDirection=desc', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'
        }
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('📋 Derniers wallets ajoutés:');
        checkData.data.slice(0, 3).forEach(wallet => {
          console.log(`  • ${wallet.wallet_address} - PnL: $${wallet.total_pnl_usd.toLocaleString()} - WR: ${(wallet.winrate * 100).toFixed(1)}%`);
        });
      }
    } catch (error) {
      console.log('⚠️ Impossible de vérifier les résultats:', error.message);
    }
  }
};

main().catch(console.error);
