const https = require('https');

// Configuration depuis votre .env
const config = {
  SUPABASE_URL: 'https://xkndddxqqlxqknbqtefv.supabase.co',
  API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'
};

class WalletAnalyzerAPI {
  constructor(config) {
    this.baseURL = config.SUPABASE_URL;
    this.apiKey = config.API_KEY;
  }

  async request(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseURL}/functions/v1/wallet-analyzer${endpoint}`;
      
      const req = https.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  async health() {
    console.log('🏥 Test Health Check...');
    try {
      const result = await this.request('/health');
      console.log('✅ API Status:', result.data.status);
      console.log('📅 Timestamp:', result.data.timestamp);
      console.log('🔧 Version:', result.data.version);
      return result.data;
    } catch (error) {
      console.log('❌ Health Check failed:', error.message);
      throw error;
    }
  }

  async quickAnalysis(walletAddress) {
    console.log(`⚡ Analyse rapide de ${walletAddress.slice(0, 8)}...`);
    try {
      const result = await this.request(`/quick/${walletAddress}`);
      const data = result.data;
      
      console.log('📊 Résultats:');
      console.log(`   🔗 Source: ${data.data_source}`);
      console.log(`   🎯 Score Alpha: ${data.alpha_score}/10`);
      console.log(`   📈 PnL Total: $${data.total_pnl_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   🏆 Win Rate: ${data.win_rate?.toFixed(1) || 'N/A'}%`);
      console.log(`   📊 Total Trades: ${data.total_trades || 'N/A'}`);
      
      return data;
    } catch (error) {
      console.log('❌ Quick Analysis failed:', error.message);
      throw error;
    }
  }

  async completeAnalysis(walletAddress) {
    console.log(`🎯 Analyse complète de ${walletAddress.slice(0, 8)}...`);
    try {
      const result = await this.request(`/complete/${walletAddress}`);
      const data = result.data;
      
      console.log('📊 ANALYSE COMPLÈTE:');
      console.log(`   🔗 Source: ${data.data_source}`);
      console.log(`   📅 Généré: ${new Date(data.generated_at).toLocaleString()}`);
      
      if (data.data) {
        const alpha = data.data.alpha_analysis;
        const trade = data.data.trade_analysis;
        const recommendation = data.data.copy_trading_recommendations;
        
        console.log('\n🎯 ANALYSE ALPHA:');
        console.log(`   Score: ${alpha.alpha_score}/10 (${alpha.alpha_category})`);
        console.log(`   Confiance: ${alpha.alpha_confidence}%`);
        console.log(`   Détection précoce: ${alpha.early_detection_ability}`);
        
        console.log('\n📈 PERFORMANCE TRADING:');
        console.log(`   PnL Total: $${trade.total_pnl_usd?.toLocaleString() || 'N/A'}`);
        console.log(`   Volume Total: $${trade.total_volume_usd?.toLocaleString() || 'N/A'}`);
        console.log(`   Win Rate: ${trade.win_rate?.toFixed(1) || 'N/A'}%`);
        console.log(`   Tokens Uniques: ${trade.unique_tokens || 'N/A'}`);
        
        console.log('\n💼 RECOMMANDATION COPY-TRADING:');
        console.log(`   Action: ${recommendation.recommendation}`);
        console.log(`   Allocation: ${recommendation.suggested_allocation_percentage}%`);
        console.log(`   Niveau de Risque: ${recommendation.risk_level}`);
        console.log(`   Confiance: ${recommendation.confidence_level}%`);
      }
      
      return data;
    } catch (error) {
      console.log('❌ Complete Analysis failed:', error.message);
      throw error;
    }
  }

  async testMultipleWallets(wallets) {
    console.log('🎯 TEST DE PLUSIEURS WALLETS');
    console.log('='.repeat(50));
    
    const results = [];
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      console.log(`\n📊 Wallet ${i + 1}/${wallets.length}: ${wallet.slice(0, 8)}...`);
      
      try {
        const analysis = await this.quickAnalysis(wallet);
        results.push({
          address: wallet,
          score: analysis.alpha_score,
          pnl: analysis.total_pnl_usd,
          winRate: analysis.win_rate,
          recommendation: 'N/A' // Quick analysis doesn't have recommendation
        });
        
        // Pause entre les requêtes
        if (i < wallets.length - 1) {
          console.log('   ⏳ Pause 2 secondes...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        results.push({
          address: wallet,
          error: error.message
        });
      }
    }
    
    console.log('\n📋 RÉSUMÉ COMPARATIF:');
    console.log('='.repeat(50));
    
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`${index + 1}. ${result.address.slice(0, 8)}... - ERREUR`);
      } else {
        console.log(`${index + 1}. ${result.address.slice(0, 8)}... - Score: ${result.score}/10, PnL: $${result.pnl?.toLocaleString() || 'N/A'}, Win: ${result.winRate?.toFixed(1) || 'N/A'}%`);
      }
    });
    
    return results;
  }
}

// Usage et exemples
async function main() {
  const api = new WalletAnalyzerAPI(config);
  
  console.log('🚀 TEST DE L\'API WALLET ANALYZER');
  console.log('='.repeat(50));
  
  try {
    // 1. Health Check
    await api.health();
    
    console.log('\n');
    
    // 2. Analyse rapide d'un wallet
    await api.quickAnalysis('HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk');
    
    console.log('\n');
    
    // 3. Analyse complète d'un wallet
    await api.completeAnalysis('HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk');
    
    console.log('\n');
    
    // 4. Test de plusieurs wallets (optionnel - décommentez pour activer)
    /*
    const testWallets = [
      'HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk',
      'A1nCMZqrG46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
    ];
    
    await api.testMultipleWallets(testWallets);
    */
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Exporter la classe pour réutilisation
module.exports = { WalletAnalyzerAPI, config };

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

// Instructions d'utilisation
console.log('\n💡 COMMENT UTILISER CE SCRIPT:');
console.log('================================');
console.log('1. node test-api-interactive.js                    # Exécuter tous les tests');
console.log('2. Modifier la variable "testWallets" pour vos adresses');
console.log('3. Décommenter la section "Test de plusieurs wallets"');
console.log('4. Utiliser la classe WalletAnalyzerAPI dans vos projets');
