#!/usr/bin/env node

// Script simple pour vérifier si les nouvelles colonnes existent
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function quickCheck() {
  console.log('🔍 Vérification rapide des colonnes base de données\n');
  
  try {
    // Test si les nouvelles colonnes existent en essayant de les sélectionner
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?select=dexscreener_micro_cap_count,dexscreener_low_cap_count,dexscreener_middle_cap_count,dexscreener_large_cap_count,dexscreener_mega_cap_count,dexscreener_unknown_cap_count,dexscreener_total_analyzed_count&limit=1`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Les nouvelles colonnes DexScreener existent en base de données !');
      
      // Vérifier les données du wallet spécifique
      const walletResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB&select=wallet_address,dexscreener_total_analyzed_count,dexscreener_tokens_with_market_cap,pnl_total_analyzed_count`, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'apikey': BEARER_TOKEN
        }
      });
      
      if (walletResponse.ok) {
        const data = await walletResponse.json();
        if (data.length > 0) {
          const record = data[0];
          console.log('\n📊 Données wallet ABdAs...STB:');
          console.log('- DexScreener total analysé:', record.dexscreener_total_analyzed_count);
          console.log('- DexScreener avec market cap:', record.dexscreener_tokens_with_market_cap);  
          console.log('- PnL total analysé (ancien):', record.pnl_total_analyzed_count);
          
          console.log('\n🎯 Explication:');
          console.log('- Les colonnes pnl_*_cap_count (ancien système) analysent 8 tokens via Cielo');
          console.log('- Les colonnes dexscreener_*_cap_count (nouveau) analyseront 50 tokens via DexScreener');
          console.log('- La différence est normale : ce sont deux sources de données différentes');
          
          if (record.dexscreener_total_analyzed_count === null) {
            console.log('\n⚠️ Le wallet doit être retraité avec la nouvelle version pour avoir les métriques détaillées');
          } else {
            console.log('\n✅ Le wallet a les nouvelles métriques DexScreener !');
          }
        }
      }
      
    } else {
      const errorText = await testResponse.text();
      if (errorText.includes('does not exist')) {
        console.log('❌ Les nouvelles colonnes n\'existent pas encore en base de données');
        console.log('Il faut créer les colonnes avec une migration SQL ou laisser la fonction les créer automatiquement');
      } else {
        console.log('❌ Erreur de requête:', testResponse.status, errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickCheck();
