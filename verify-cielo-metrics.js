#!/usr/bin/env node

// 🔍 Vérification des métriques Cielo en base de données
// Ce script vérifie que les métriques ont été correctement sauvegardées

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

const TEST_WALLET = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

console.log('🔍 VÉRIFICATION MÉTRIQUES CIELO EN BASE');
console.log('======================================');

async function checkCieloMetrics() {
  try {
    console.log(`📡 Vérification des métriques pour ${TEST_WALLET}...`);
    
    // Récupérer le wallet avec toutes les nouvelles colonnes
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${TEST_WALLET}&select=wallet_address,average_holding_time,total_pnl,winrate,total_roi_percentage,swap_count,first_swap_timestamp,last_swap_timestamp,unique_trading_days,consecutive_trading_days,average_trades_per_token,total_tokens_traded,total_unrealized_pnl_usd,total_unrealized_roi_percentage,combined_pnl_usd,combined_roi_percentage,combined_average_hold_time,combined_median_hold_time`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.length === 0) {
      console.log('❌ Wallet non trouvé en base de données');
      return;
    }
    
    const wallet = data[0];
    console.log('✅ Wallet trouvé en base de données\n');
    
    console.log('📊 VÉRIFICATION DES NOUVELLES MÉTRIQUES:');
    console.log('=========================================');
    
    const metricsToCheck = [
      { key: 'average_holding_time', label: 'Temps de détention moyen (h)', format: (v) => v ? `${parseFloat(v).toFixed(2)}h` : 'null' },
      { key: 'total_pnl', label: 'PnL total (USD)', format: (v) => v ? `$${parseFloat(v).toFixed(2)}` : 'null' },
      { key: 'winrate', label: 'Taux de réussite (%)', format: (v) => v ? `${(parseFloat(v) * 100).toFixed(1)}%` : 'null' },
      { key: 'total_roi_percentage', label: 'ROI total (%)', format: (v) => v ? `${parseFloat(v).toFixed(1)}%` : 'null' },
      { key: 'swap_count', label: 'Nombre de swaps', format: (v) => v || 'null' },
      { key: 'first_swap_timestamp', label: 'Premier swap', format: (v) => v ? new Date(v).toLocaleDateString() : 'null' },
      { key: 'last_swap_timestamp', label: 'Dernier swap', format: (v) => v ? new Date(v).toLocaleDateString() : 'null' },
      { key: 'unique_trading_days', label: 'Jours de trading uniques', format: (v) => v || 'null' },
      { key: 'consecutive_trading_days', label: 'Jours consécutifs', format: (v) => v || 'null' },
      { key: 'average_trades_per_token', label: 'Trades par token (moy.)', format: (v) => v ? parseFloat(v).toFixed(1) : 'null' },
      
      // === NOUVELLES MÉTRIQUES PNL_DATA ===
      { key: 'total_tokens_traded', label: 'Total tokens tradés', format: (v) => v || 'null' },
      { key: 'total_unrealized_pnl_usd', label: 'PnL non réalisé (USD)', format: (v) => v ? `$${parseFloat(v).toFixed(2)}` : 'null' },
      { key: 'total_unrealized_roi_percentage', label: 'ROI non réalisé (%)', format: (v) => v ? `${parseFloat(v).toFixed(1)}%` : 'null' },
      { key: 'combined_pnl_usd', label: 'PnL combiné (USD)', format: (v) => v ? `$${parseFloat(v).toFixed(2)}` : 'null' },
      { key: 'combined_roi_percentage', label: 'ROI combiné (%)', format: (v) => v ? `${parseFloat(v).toFixed(1)}%` : 'null' },
      { key: 'combined_average_hold_time', label: 'Temps détention combiné (h)', format: (v) => v ? `${parseFloat(v).toFixed(1)}h` : 'null' },
      { key: 'combined_median_hold_time', label: 'Temps détention médian (h)', format: (v) => v ? `${parseFloat(v).toFixed(1)}h` : 'null' }
    ];
    
    let filledCount = 0;
    let totalCount = metricsToCheck.length;
    
    metricsToCheck.forEach(metric => {
      const value = wallet[metric.key];
      const isSet = value !== null && value !== undefined;
      const status = isSet ? '✅' : '❌';
      const formattedValue = metric.format(value);
      
      console.log(`   ${status} ${metric.label}: ${formattedValue}`);
      
      if (isSet) filledCount++;
    });
    
    console.log(`\n📈 SCORE DE PRÉSENCE: ${filledCount}/${totalCount} (${((filledCount/totalCount)*100).toFixed(1)}%)`);
    
    if (filledCount === totalCount) {
      console.log('🎉 PARFAIT ! Toutes les métriques sont remplies !');
    } else if (filledCount >= totalCount * 0.8) {
      console.log('👍 TRÈS BIEN ! La plupart des métriques sont remplies');
    } else if (filledCount >= totalCount * 0.5) {
      console.log('👌 CORRECT ! La moitié des métriques sont remplies');
    } else {
      console.log('⚠️ INSUFFISANT ! Peu de métriques sont remplies');
    }
    
    // Comparaison avec les anciennes métriques s'il y en a
    console.log('\n🔄 COMPARAISON AVEC ANCIENNES MÉTRIQUES:');
    console.log('========================================');
    
    const oldMetricsResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${TEST_WALLET}&select=total_pnl_usd,roi,profit_percentage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (oldMetricsResponse.ok) {
      const oldData = await oldMetricsResponse.json();
      if (oldData.length > 0) {
        const oldWallet = oldData[0];
        console.log(`   Ancien PnL: $${oldWallet.total_pnl_usd || 'N/A'} → Nouveau: $${parseFloat(wallet.total_pnl || 0).toFixed(2)}`);
        console.log(`   Ancien ROI: ${oldWallet.roi || 'N/A'}% → Nouveau: ${parseFloat(wallet.total_roi_percentage || 0).toFixed(1)}%`);
      }
    }
    
    console.log('\n✅ VÉRIFICATION TERMINÉE !');
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

checkCieloMetrics();
