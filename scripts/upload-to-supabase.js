const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Fonction pour parser une date de manière sécurisée
function parseValidDate(dateString) {
  if (!dateString || dateString === '' || dateString === '-') {
    return null;
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`⚠️ Date invalide ignorée: "${dateString}"`);
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.warn(`⚠️ Erreur parsing date: "${dateString}"`, error.message);
    return null;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL et SUPABASE_ANON_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload un fichier JSON de wallets vers Supabase
 * @param {string} filePath - Chemin vers le fichier JSON
 */
async function uploadWalletsToSupabase(filePath) {
  try {
    console.log(`📤 Upload du fichier ${filePath} vers Supabase...`);
    
    // Lire le fichier JSON
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const wallets = JSON.parse(fileContent);
    
    console.log(`📊 ${wallets.length} wallets à traiter`);
    
    // Traiter par batch de 100
    const batchSize = 100;
    let processed = 0;
    let errors = 0;
    
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      
      console.log(`🔄 Traitement du batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(wallets.length/batchSize)} (${batch.length} wallets)`);
      
      // Préparer les données pour Supabase
      const walletsData = batch.map(wallet => ({
        wallet_address: wallet.wallet?.trim(),
        total_pnl_usd: parseFloat(wallet.total_pnl_usd?.replace(/[$,]/g, '')) || 0,
        total_bought_usd: parseFloat(wallet.total_bought_usd?.replace(/[$,]/g, '')) || 0,
        roi: parseFloat(wallet.roi?.replace(/%/g, '')) || 0,
        winrate: parseFloat(wallet.winrate?.replace(/%/g, '')) || 0,
        tokens_traded: parseInt(wallet.tokens) || 0,
        wins: parseInt(wallet.wins) || 0,
        losses: parseInt(wallet.losses) || 0,
        trade_count: parseInt(wallet.trade_nums) || 0,
        last_trade_date: wallet.last_trade ? parseValidDate(wallet.last_trade) : null,
        source: 'dune_scraper',
        status: 'pending',
        metadata: {
          original_data: wallet,
          solscan_url: wallet.solscan,
          gmgn_url: wallet.gmgn,
          cielo_url: wallet.cielo,
          wallet_pnl_link: wallet.wallet_pnl_link,
          scraped_at: new Date().toISOString()
        }
      })).filter(w => w.wallet_address && w.wallet_address.length > 10);
      
      // Upsert dans Supabase (insert ou update si existe déjà)
      const { data, error } = await supabase
        .from('wallet_registry')
        .upsert(walletsData, { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ Erreur batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        errors++;
      } else {
        processed += walletsData.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} traité avec succès (${walletsData.length} wallets)`);
      }
      
      // Petite pause entre les batchs
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Résultats de l'upload:`);
    console.log(`✅ ${processed} wallets traités avec succès`);
    console.log(`❌ ${errors} batchs en erreur`);
    console.log(`💾 Données disponibles dans la table 'wallet_registry'`);
    
    return { processed, errors };
    
  } catch (error) {
    console.error('❌ Erreur upload Supabase:', error.message);
    throw error;
  }
}

module.exports = uploadWalletsToSupabase;
