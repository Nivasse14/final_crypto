#!/usr/bin/env node

// Test complet de l'API wallet-analyzer avec analyse COMPLETE
// Ce script teste l'analyse complète (background job) + récupération des résultats

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Wallet Solana d'exemple (adresse réelle)
const TEST_WALLET = 'A1nCMZqrJUjsb7RnZ3dGqWJ4wE5Phy8N3Rz4sKvXoMnY'; // Exemple d'adresse Solana

async function testCompleteAnalysis() {
  console.log('🚀 Test de l\'analyse COMPLETE avec l\'API wallet-analyzer');
  console.log('===========================================================\n');
  
  try {
    // 1. Lancer l'analyse complète (POST)
    console.log('1️⃣ Lancement de l\'analyse complète...\n');
    
    const startResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/complete/${TEST_WALLET}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!startResponse.ok) {
      throw new Error(`Erreur démarrage analyse: ${startResponse.status} ${startResponse.statusText}`);
    }
    
    const jobInfo = await startResponse.json();
    console.log('📋 Job créé:', JSON.stringify(jobInfo, null, 2));
    
    const jobId = jobInfo.job_id;
    if (!jobId) {
      throw new Error('Aucun job_id retourné');
    }
    
    // 2. Attendre et surveiller le statut
    console.log('\n2️⃣ Surveillance du job...\n');
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 15 secondes = 10 minutes max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 15000)); // Attendre 15 secondes
      attempts++;
      
      console.log(`📊 Vérification statut (tentative ${attempts}/${maxAttempts})...`);
      
      const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!statusResponse.ok) {
        console.log(`⚠️ Erreur récupération statut: ${statusResponse.status}`);
        continue;
      }
      
      const status = await statusResponse.json();
      console.log(`   Status: ${status.status} | Progress: ${status.progress_percentage}% | ${status.current_step}`);
      
      if (status.status === 'completed') {
        completed = true;
        console.log('\n✅ Analyse terminée avec succès!\n');
        
        // 3. Affichage des résultats complets
        console.log('3️⃣ RÉSULTATS DE L\'ANALYSE COMPLÈTE');
        console.log('=====================================\n');
        
        if (status.results && status.results.data) {
          const data = status.results.data;
          
          // Résumé des transactions
          if (data.transaction_summary) {
            console.log('📈 RÉSUMÉ DES TRANSACTIONS:');
            console.log(`   • Total transactions: ${data.transaction_summary.total_transactions}`);
            console.log(`   • Achats: ${data.transaction_summary.buy_transactions}`);
            console.log(`   • Ventes: ${data.transaction_summary.sell_transactions}`);
            console.log(`   • Première transaction: ${new Date(data.transaction_summary.first_transaction).toLocaleDateString()}`);
            console.log(`   • Dernière transaction: ${new Date(data.transaction_summary.last_transaction).toLocaleDateString()}\n`);
          }
          
          // Analyse des trades
          if (data.trade_analysis && data.trade_analysis.trades) {
            console.log('💰 ANALYSE DES TRADES:');
            console.log(`   • Nombre de trades analysés: ${data.trade_analysis.trades.length}`);
            console.log(`   • Volume total tradé: $${data.trade_analysis.total_volume_usd?.toLocaleString() || 'N/A'}`);
            console.log(`   • PnL total: $${data.trade_analysis.total_pnl_usd?.toLocaleString() || 'N/A'}`);
            console.log(`   • Win rate: ${data.trade_analysis.win_rate?.toFixed(1) || 'N/A'}%\n`);
            
            // Afficher quelques trades exemple
            console.log('   📝 Exemples de trades:');
            data.trade_analysis.trades.slice(0, 3).forEach((trade, i) => {
              console.log(`   ${i+1}. ${trade.token_symbol}: ${trade.type} $${trade.amount_usd?.toFixed(0)} | PnL: $${trade.pnl_usd?.toFixed(0)} | ROI: ${trade.roi_percentage?.toFixed(1)}%`);
            });
            console.log('');
          }
          
          // Analyse des tokens
          if (data.token_analysis && data.token_analysis.tokens) {
            console.log('🎯 ANALYSE DES TOKENS:');
            console.log(`   • Tokens tradés: ${data.token_analysis.tokens.length}`);
            data.token_analysis.tokens.slice(0, 5).forEach((token, i) => {
              console.log(`   ${i+1}. ${token.symbol}: MC $${token.market_cap?.toLocaleString() || 'N/A'} | Vol 24h: $${token.volume_24h?.toLocaleString() || 'N/A'}`);
            });
            console.log('');
          }
          
          // Métriques avancées
          if (data.advanced_metrics) {
            console.log('📊 MÉTRIQUES AVANCÉES:');
            const metrics = data.advanced_metrics;
            console.log(`   • Ratio de Sharpe: ${metrics.sharpe_ratio?.toFixed(2) || 'N/A'}`);
            console.log(`   • Drawdown max: ${metrics.max_drawdown_percentage?.toFixed(1) || 'N/A'}%`);
            console.log(`   • Volatilité: ${metrics.volatility_percentage?.toFixed(1) || 'N/A'}%`);
            console.log(`   • Alpha generation: ${metrics.alpha_generation?.toFixed(1) || 'N/A'}%`);
            console.log(`   • Beta au marché: ${metrics.beta_to_market?.toFixed(2) || 'N/A'}`);
            console.log(`   • Série gagnante max: ${metrics.longest_winning_streak || 'N/A'}`);
            console.log(`   • Série perdante max: ${metrics.longest_losing_streak || 'N/A'}\n`);
          }
          
          // Analyse alpha
          if (data.alpha_analysis) {
            console.log('🔥 ANALYSE ALPHA:');
            const alpha = data.alpha_analysis;
            console.log(`   • Score Alpha: ${alpha.alpha_score?.toFixed(1) || 'N/A'}/10 (${alpha.alpha_category || 'N/A'})`);
            console.log(`   • Confiance: ${alpha.alpha_confidence || 'N/A'}%`);
            console.log(`   • Détection précoce: ${alpha.early_detection_ability || 'N/A'}`);
            console.log(`   • Force du signal: ${alpha.signal_strength || 'N/A'}/100`);
            console.log(`   • Score timing entrée: ${alpha.entry_timing_score || 'N/A'}/10`);
            console.log(`   • Score timing sortie: ${alpha.exit_timing_score || 'N/A'}/10`);
            console.log(`   • Gestion du risque: ${alpha.risk_management_score || 'N/A'}/10\n`);
          }
          
          // Recommandations copy-trading
          if (data.copy_trading_recommendations) {
            console.log('🎯 RECOMMANDATIONS COPY-TRADING:');
            const reco = data.copy_trading_recommendations;
            console.log(`   • Recommandation: ${reco.recommendation || 'N/A'}`);
            console.log(`   • Confiance: ${reco.confidence_level || 'N/A'}%`);
            console.log(`   • Allocation suggérée: ${reco.suggested_allocation_percentage || 'N/A'}%`);
            console.log(`   • Risque estimé: ${reco.risk_level || 'N/A'}`);
            console.log(`   • Horizon temporel: ${reco.time_horizon || 'N/A'}`);
            
            if (reco.risk_management && reco.risk_management.stop_loss_percentage) {
              console.log(`   • Stop loss: ${reco.risk_management.stop_loss_percentage}%`);
              console.log(`   • Take profit: ${reco.risk_management.take_profit_percentage}%`);
            }
            
            if (reco.strategies && reco.strategies.length > 0) {
              console.log('   • Stratégies recommandées:');
              reco.strategies.forEach((strategy, i) => {
                console.log(`     ${i+1}. ${strategy}`);
              });
            }
            console.log('');
          }
          
        } else {
          console.log('⚠️ Aucun résultat trouvé dans le job');
        }
        
      } else if (status.status === 'failed') {
        console.log(`❌ Analyse échouée: ${status.error_message}`);
        break;
      }
    }
    
    if (!completed && attempts >= maxAttempts) {
      console.log('⏰ Timeout - analyse trop longue');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Health check
async function healthCheck() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/health`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Service disponible:', health);
      return true;
    } else {
      console.log('❌ Service indisponible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:', error.message);
    return false;
  }
}

// Exécution
async function main() {
  console.log('🔍 Vérification de la disponibilité du service...\n');
  
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('❌ Le service n\'est pas disponible. Vérifiez la configuration.');
    process.exit(1);
  }
  
  console.log('');
  await testCompleteAnalysis();
}

main().catch(console.error);
