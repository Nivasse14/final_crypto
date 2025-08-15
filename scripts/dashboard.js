const fetch = require('node-fetch');

const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
  'Content-Type': 'application/json'
};

async function displayDashboard() {
  console.log('🚀 SCANDUNE - DASHBOARD DES MEILLEURS WALLETS\n');
  console.log('=' .repeat(60));
  
  try {
    // Récupérer les top wallets
    const response = await fetch(
      'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?limit=10&sortBy=total_pnl_usd&sortDirection=desc',
      { headers }
    );
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`📊 Total wallets trouvés: ${data.data.length}`);
      console.log(`💰 PnL total combiné: $${data.stats?.total_pnl?.toLocaleString() || 'N/A'}`);
      console.log(`🎯 Win rate moyen: ${((data.stats?.avg_win_rate || 0) * 100).toFixed(1)}%`);
      console.log('');
      
      data.data.forEach((wallet, index) => {
        console.log(`${index + 1}. 💼 ${wallet.wallet_address.slice(0, 8)}...${wallet.wallet_address.slice(-4)}`);
        console.log(`   💰 PnL: $${wallet.total_pnl_usd?.toLocaleString() || 'N/A'}`);
        console.log(`   🎯 Win Rate: ${((wallet.winrate || 0) * 100).toFixed(1)}%`);
        console.log(`   📈 Trades: ${wallet.trade_count || 'N/A'}`);
        console.log(`   📊 Status: ${wallet.status}`);
        
        if (wallet.enriched_ai_category) {
          console.log(`   🤖 AI Category: ${wallet.enriched_ai_category}`);
          console.log(`   ⚠️  Risk Level: ${wallet.enriched_ai_risk_level}`);
          console.log(`   💎 Portfolio Value: $${wallet.enriched_total_value_usd?.toLocaleString() || 'N/A'}`);
        }
        
        console.log('   ' + '-'.repeat(50));
      });
      
      // Compter les wallets par statut
      const statusCount = data.data.reduce((acc, wallet) => {
        acc[wallet.status] = (acc[wallet.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 STATUT DES WALLETS:');
      Object.entries(statusCount).forEach(([status, count]) => {
        const emoji = status === 'completed' ? '✅' : status === 'pending' ? '⏳' : '🔄';
        console.log(`   ${emoji} ${status}: ${count}`);
      });
      
      // Filtrer les wallets d'élite
      const eliteWallets = data.data.filter(w => 
        w.total_pnl_usd > 100000 && w.winrate > 0.8
      );
      
      console.log(`\n🏆 WALLETS D'ÉLITE (PnL > $100k + Win Rate > 80%): ${eliteWallets.length}`);
      
    } else {
      console.log('❌ Erreur récupération données:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

displayDashboard();
