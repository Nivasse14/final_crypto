async function testPersistenceWithMockData() {
  const fetch = (await import('node-fetch')).default;
  console.log('🧪 Test de persistance Supabase avec données simulées...');
  
  const mockWallets = [
    {
      wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      total_pnl_usd: '$1,234.56',
      total_bought_usd: '$5,000.00',
      roi: '24.69%',
      winrate: '75.5%',
      tokens: '15',
      wins: '12',
      losses: '3',
      trade_nums: '25',
      last_trade: '7', // il y a 7 jours
      solscan: 'https://solscan.io/account/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      gmgn: 'https://gmgn.ai/sol/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      cielo: 'https://app.cielo.finance/profile/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      wallet_pnl_link: 'https://dune.com/test'
    },
    {
      wallet: 'GKvqsuNcnwWqPzzuhLmGi4rzzh55FhJtGizkhHaEJqiV',
      total_pnl_usd: '$890.12',
      total_bought_usd: '$3,200.00',
      roi: '27.82%',
      winrate: '68.2%',
      tokens: '8',
      wins: '7',
      losses: '3',
      trade_nums: '18',
      last_trade: '14', // il y a 14 jours
      solscan: 'https://solscan.io/account/GKvqsuNcnwWqPzzuhLmGi4rzzh55FhJtGizkhHaEJqiV',
      gmgn: 'https://gmgn.ai/sol/address/GKvqsuNcnwWqPzzuhLmGi4rzzh55FhJtGizkhHaEJqiV',
      cielo: 'https://app.cielo.finance/profile/GKvqsuNcnwWqPzzuhLmGi4rzzh55FhJtGizkhHaEJqiV',
      wallet_pnl_link: 'https://dune.com/test2'
    }
  ];

  try {
    const response = await fetch('http://localhost:3000/api/start-scraping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer default-token'
      },
      body: JSON.stringify({
        jobId: 'test-mock-data-persistence',
        url: 'https://dune.com/mock-test'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Job créé:', result);
      
      // Simuler l'ajout direct de données pour tester la persistance
      await testDirectPersistence(mockWallets);
      
    } else {
      const error = await response.text();
      console.log('❌ Erreur lors de la création du job:', error);
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

async function testDirectPersistence(wallets) {
  console.log('💾 Test de persistance directe avec', wallets.length, 'wallets...');
  
  const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';
  
  // Fonction helper pour convertir les dates relatives
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '' || dateStr === 'N/A' || dateStr === '-') {
      return null;
    }
    
    // Vérifier si c'est un nombre (jours depuis aujourd'hui)
    const daysAgo = parseInt(dateStr);
    if (!isNaN(daysAgo) && daysAgo > 0 && daysAgo < 1000) {
      // Calculer la date il y a X jours
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      console.log(`📅 Conversion: "${dateStr}" jours → ${date.toISOString().split('T')[0]}`);
      return date.toISOString();
    }
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log(`⚠️ Date invalide ignorée: "${dateStr}"`);
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.log(`⚠️ Erreur de conversion de date: "${dateStr}" - ${error.message}`);
      return null;
    }
  };

  // Préparer les données pour Supabase
  const supabaseData = wallets.map(wallet => ({
    wallet_address: wallet.wallet,
    solscan_url: wallet.solscan,
    gmgn_url: wallet.gmgn,
    cielo_url: wallet.cielo,
    wallet_pnl_link: wallet.wallet_pnl_link,
    
    // Données Dune avec préfixe dune_
    dune_wallet_pnl: parseFloat(wallet.total_pnl_usd?.replace(/[$,]/g, '')) || 0,
    dune_total_bought_usd: parseFloat(wallet.total_bought_usd?.replace(/[$,]/g, '')) || 0,
    dune_total_pnl_usd: wallet.total_pnl_usd || '0',
    dune_roi: wallet.roi || '0%',
    dune_winrate: parseInt(wallet.wins) || 0,
    dune_tokens: parseInt(wallet.tokens) || 0,
    dune_wins: wallet.winrate || '0%',
    dune_losses: parseInt(wallet.losses) || 0,
    
    // Colonnes de base (compatibilité)
    total_pnl_usd: parseFloat(wallet.total_pnl_usd?.replace(/[$,]/g, '')) || 0,
    total_bought_usd: parseFloat(wallet.total_bought_usd?.replace(/[$,]/g, '')) || 0,
    roi: parseFloat(wallet.roi?.replace(/%/g, '')) || 0,
    winrate: parseFloat(wallet.winrate?.replace(/%/g, '')) || 0,
    tokens_traded: parseInt(wallet.tokens) || 0,
    wins: parseInt(wallet.wins) || 0,
    losses: parseInt(wallet.losses) || 0,
    trade_count: parseInt(wallet.trade_nums) || 0,
    last_trade_date: parseDate(wallet.last_trade),
    
    // Métadonnées et statut
    source: 'test_mock_data',
    data_source: 'test_persistence',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      test_session: 'persistence_test_' + Date.now(),
      raw_data: wallet
    }
  }));

  try {
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabaseData)
    });
    
    if (supabaseResponse.ok) {
      const result = await supabaseResponse.json();
      console.log('✅ Persistance réussie:', result.length, 'wallets sauvés');
      console.log('Premier wallet sauvé:', result[0]);
      
      // Vérifier la lecture
      const readResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry?source=eq.test_mock_data&limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      if (readResponse.ok) {
        const data = await readResponse.json();
        console.log('✅ Lecture vérifiée:', data.length, 'enregistrements trouvés');
        console.log('Dates converties:');
        data.forEach(w => {
          console.log(`  - ${w.wallet_address}: last_trade_date = ${w.last_trade_date}`);
        });
      }
      
    } else {
      const error = await supabaseResponse.text();
      console.log('❌ Erreur persistance:', error);
    }
    
  } catch (error) {
    console.log('❌ Erreur test persistance:', error.message);
  }
}

testPersistenceWithMockData();
