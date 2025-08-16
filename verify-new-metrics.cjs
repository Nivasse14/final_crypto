#!/usr/bin/env node

// Script pour vérifier les nouvelles métriques DexScreener après déploiement
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function verifyNewMetrics() {
  console.log('🔍 Vérification des nouvelles métriques DexScreener\n');
  
  try {
    // 1. Vérifier l'API avec le wallet ABdAs (qui a déjà des données)
    console.log('📊 1. Test API sur wallet existant...');
    const apiResponse = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    
    if (apiResponse.ok) {
      console.log('✅ API répond correctement');
      
      // Attendre un peu puis vérifier en base
      setTimeout(async () => {
        console.log('\n📋 2. Vérification en base de données...');
        
        const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB&select=wallet_address,dexscreener_micro_cap_count,dexscreener_low_cap_count,dexscreener_middle_cap_count,dexscreener_large_cap_count,dexscreener_mega_cap_count,dexscreener_unknown_cap_count,dexscreener_total_analyzed_count,processing_version,last_processed_at`, {
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            'apikey': BEARER_TOKEN
          }
        });
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          if (dbData.length > 0) {
            const record = dbData[0];
            console.log('✅ Données trouvées en base:');
            console.log('- dexscreener_micro_cap_count:', record.dexscreener_micro_cap_count);
            console.log('- dexscreener_low_cap_count:', record.dexscreener_low_cap_count);
            console.log('- dexscreener_middle_cap_count:', record.dexscreener_middle_cap_count);
            console.log('- dexscreener_large_cap_count:', record.dexscreener_large_cap_count);
            console.log('- dexscreener_mega_cap_count:', record.dexscreener_mega_cap_count);
            console.log('- dexscreener_unknown_cap_count:', record.dexscreener_unknown_cap_count);
            console.log('- dexscreener_total_analyzed_count:', record.dexscreener_total_analyzed_count);
            console.log('- processing_version:', record.processing_version);
            console.log('- last_processed_at:', record.last_processed_at);
            
            const totalCalculated = (record.dexscreener_micro_cap_count || 0) + 
                                   (record.dexscreener_low_cap_count || 0) + 
                                   (record.dexscreener_middle_cap_count || 0) + 
                                   (record.dexscreener_large_cap_count || 0) + 
                                   (record.dexscreener_mega_cap_count || 0) + 
                                   (record.dexscreener_unknown_cap_count || 0);
            
            console.log('\n📊 Vérification des totaux:');
            console.log('- Somme des caps DexScreener:', totalCalculated);
            console.log('- Total analysé DexScreener:', record.dexscreener_total_analyzed_count);
            console.log('- Cohérence:', totalCalculated === record.dexscreener_total_analyzed_count ? '✅' : '❌');
            
            if (record.processing_version === 'v4_trpc_complete_with_dexscreener_caps') {
              console.log('\n🎉 SUCCÈS : Nouvelles métriques déployées et fonctionnelles !');
            } else {
              console.log('\n⚠️ Version de traitement non mise à jour, le wallet doit être retraité');
            }
          } else {
            console.log('❌ Wallet non trouvé en base');
          }
        } else {
          console.log('❌ Erreur accès base:', dbResponse.status);
        }
      }, 3000);
      
    } else {
      console.log('❌ Erreur API:', apiResponse.status, apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.log('Détails:', errorText.substring(0, 300));
    }
    
    // 3. Test avec un nouveau wallet
    console.log('\n🧪 3. Test avec nouveau wallet...');
    const newWalletResponse = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/8sLbNZfGUrj3ADbMXmzZe8p3GbXVKWfxo9B8b2D5NWnV`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    
    if (newWalletResponse.ok) {
      console.log('✅ Nouveau wallet traité avec succès');
    } else {
      console.log('❌ Erreur nouveau wallet:', newWalletResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyNewMetrics();
