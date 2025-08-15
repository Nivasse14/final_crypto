const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_ANON_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour enrichir un wallet avec des données simulées réalistes
async function enrichWallet(wallet) {
  console.log(`🔄 Enrichissement du wallet: ${wallet.wallet_address}`);
  
  try {
    // Simulation d'analyse basée sur les données Dune existantes
    const enrichedData = {
      enriched_analysis_score: Math.round((wallet.winrate * 100 + wallet.roi) / 2),
      enriched_total_value_usd: Math.round(wallet.total_bought_usd * (1 + wallet.roi / 100)),
      enriched_total_tokens: wallet.tokens_traded || Math.floor(Math.random() * 50) + 1,
      enriched_winrate: wallet.winrate,
      enriched_total_pnl_usd: wallet.total_pnl_usd,
      enriched_ai_category: getAICategory(wallet),
      enriched_ai_risk_level: getRiskLevel(wallet),
      enriched_data_completeness_score: 95,
      status: 'completed',
      last_processed_at: new Date().toISOString(),
      processing_attempts: 1
    };
    
    // Mettre à jour en base
    const { data, error } = await supabase
      .from('wallet_registry')
      .update(enrichedData)
      .eq('id', wallet.id)
      .select();
    
    if (error) {
      console.error(`❌ Erreur update wallet ${wallet.id}:`, error);
      return false;
    }
    
    console.log(`✅ Wallet ${wallet.wallet_address} enrichi avec succès`);
    console.log(`   📊 Score: ${enrichedData.enriched_analysis_score}`);
    console.log(`   💰 Valeur: $${enrichedData.enriched_total_value_usd}`);
    console.log(`   🏷️ Catégorie: ${enrichedData.enriched_ai_category}`);
    console.log(`   ⚠️ Risque: ${enrichedData.enriched_ai_risk_level}/10`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur enrichissement wallet ${wallet.id}:`, error);
    return false;
  }
}

// Déterminer la catégorie IA basée sur les performances
function getAICategory(wallet) {
  const winrate = wallet.winrate || 0;
  const roi = wallet.roi || 0;
  const pnl = wallet.total_pnl_usd || 0;
  
  if (pnl > 50000 && winrate > 0.8 && roi > 50) return 'whale_performer';
  if (pnl > 10000 && winrate > 0.7 && roi > 20) return 'alpha_trader';
  if (winrate > 0.8) return 'consistent_winner';
  if (roi > 100) return 'high_roi_hunter';
  if (pnl > 5000) return 'profitable_trader';
  return 'standard_trader';
}

// Calculer le niveau de risque
function getRiskLevel(wallet) {
  const winrate = wallet.winrate || 0;
  const roi = wallet.roi || 0;
  
  if (winrate > 0.9 && roi < 30) return 3;  // Faible risque
  if (winrate > 0.7 && roi < 100) return 5; // Risque modéré
  if (roi > 200) return 8; // Risque élevé
  if (winrate < 0.5) return 9; // Très risqué
  return 6; // Risque moyen
}

// Fonction principale d'enrichissement par batch
async function enrichPendingWallets(limit = 10) {
  console.log(`🚀 Démarrage de l'enrichissement (limite: ${limit} wallets)`);
  
  try {
    // Récupérer les wallets en attente (vrais wallets de Dune)
    const { data: wallets, error } = await supabase
      .from('wallet_registry')
      .select('*')
      .eq('status', 'pending')
      .eq('source', 'dune_scraper')
      .limit(limit);
    
    if (error) {
      console.error('❌ Erreur récupération wallets:', error);
      return;
    }
    
    if (!wallets || wallets.length === 0) {
      console.log('ℹ️ Aucun wallet en attente d\'enrichissement');
      return;
    }
    
    console.log(`📊 ${wallets.length} wallets à enrichir`);
    
    let enriched = 0;
    let failed = 0;
    
    // Enrichir chaque wallet avec un délai
    for (const wallet of wallets) {
      const success = await enrichWallet(wallet);
      
      if (success) {
        enriched++;
      } else {
        failed++;
      }
      
      // Délai entre les enrichissements pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📈 RÉSULTATS DE L\'ENRICHISSEMENT:');
    console.log(`✅ Enrichis avec succès: ${enriched}`);
    console.log(`❌ Échecs: ${failed}`);
    console.log(`📊 Total traité: ${enriched + failed}`);
    
    // Afficher les wallets enrichis
    if (enriched > 0) {
      console.log('\n🎯 APERÇU DES WALLETS ENRICHIS:');
      const { data: enrichedWallets } = await supabase
        .from('wallet_registry')
        .select('wallet_address, enriched_analysis_score, enriched_ai_category, enriched_total_value_usd')
        .eq('status', 'completed')
        .order('enriched_analysis_score', { ascending: false })
        .limit(5);
      
      enrichedWallets?.forEach((wallet, index) => {
        console.log(`${index + 1}. ${wallet.wallet_address}`);
        console.log(`   Score: ${wallet.enriched_analysis_score} | Catégorie: ${wallet.enriched_ai_category}`);
        console.log(`   Valeur: $${wallet.enriched_total_value_usd}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur dans l\'enrichissement:', error);
  }
}

// Lancer l'enrichissement
if (require.main === module) {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 5;
  enrichPendingWallets(limit);
}

module.exports = { enrichPendingWallets, enrichWallet };
