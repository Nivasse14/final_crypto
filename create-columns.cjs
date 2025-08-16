#!/usr/bin/env node

// Script pour créer les nouvelles colonnes DexScreener via API REST
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function createColumns() {
  console.log('🔧 Création des nouvelles colonnes DexScreener...\n');
  
  // Les colonnes à ajouter
  const columns = [
    'dexscreener_micro_cap_count',
    'dexscreener_low_cap_count', 
    'dexscreener_middle_cap_count',
    'dexscreener_large_cap_count',
    'dexscreener_mega_cap_count',
    'dexscreener_unknown_cap_count',
    'dexscreener_total_analyzed_count'
  ];
  
  console.log('ℹ️ Note: Les colonnes seront créées automatiquement par Supabase lors du premier INSERT');
  console.log('Testons en mettant à jour un wallet existant avec les nouvelles métriques...\n');
  
  try {
    // Mettre à jour un wallet avec les nouvelles colonnes (valeurs par défaut)
    const updateData = {
      dexscreener_micro_cap_count: 0,
      dexscreener_low_cap_count: 0,
      dexscreener_middle_cap_count: 0,
      dexscreener_large_cap_count: 0,
      dexscreener_mega_cap_count: 0,
      dexscreener_unknown_cap_count: 0,
      dexscreener_total_analyzed_count: 0,
      processing_version: 'v4_trpc_complete_with_dexscreener_caps_test'
    };
    
    console.log('📝 Tentative d\'ajout des colonnes via UPDATE...');
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      console.log('✅ Nouvelles colonnes créées avec succès !');
      
      // Vérifier que les colonnes existent maintenant
      const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB&select=dexscreener_micro_cap_count,dexscreener_total_analyzed_count,processing_version`, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'apikey': BEARER_TOKEN
        }
      });
      
      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        console.log('📊 Vérification:', data[0]);
        console.log('\n🎉 Les nouvelles colonnes sont prêtes !');
        console.log('Maintenant, relancer l\'API pour traiter le wallet avec les nouvelles métriques.');
      }
      
    } else {
      const errorText = await updateResponse.text();
      console.error('❌ Erreur UPDATE:', updateResponse.status, errorText);
      
      if (errorText.includes('column') && errorText.includes('does not exist')) {
        console.log('\n⚠️ Les colonnes n\'existent pas. Il faut les créer via le Dashboard Supabase:');
        console.log('1. Aller sur https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor');
        console.log('2. Ouvrir la table wallet_registry');
        console.log('3. Ajouter les colonnes suivantes (type INTEGER, default 0):');
        columns.forEach(col => console.log(`   - ${col}`));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createColumns();
