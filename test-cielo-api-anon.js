#!/usr/bin/env node

// 🧪 Test de l'API Cielo avec la clé anon Supabase correcte
// Ce script teste l'appel à l'API Cielo via notre fonction Supabase

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

// Wallet de test performant
const TEST_WALLET = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

console.log('🚀 Test de l\'API Cielo avec la clé anon Supabase');
console.log('=' * 60);
console.log(`📍 URL Supabase: ${SUPABASE_URL}`);
console.log(`🔑 Clé anon: ${SUPABASE_ANON_KEY.substring(0, 50)}...`);
console.log(`💼 Wallet de test: ${TEST_WALLET}`);
console.log('=' * 60);

async function testCieloAPI() {
  try {
    console.log('\n🌐 1. TEST DE L\'API CIELO VIA SUPABASE FUNCTION...');
    
    const apiUrl = `${SUPABASE_URL}/functions/v1/cielo-api/complete/${TEST_WALLET}`;
    console.log(`📡 URL d'appel: ${apiUrl}`);
    
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Durée de l'appel: ${duration}ms`);
    console.log(`📊 Status de réponse: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erreur HTTP:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.statusText}`);
      console.log(`   Détails: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    
    console.log('\n✅ RÉPONSE REÇUE AVEC SUCCÈS !');
    console.log('📋 Aperçu des données:');
    
    if (data.success) {
      console.log(`   ✓ Succès: ${data.success}`);
      console.log(`   💼 Wallet: ${data.wallet_address}`);
      
      if (data.data) {
        console.log('\n📊 Données disponibles:');
        Object.keys(data.data).forEach(key => {
          if (data.data[key] && typeof data.data[key] === 'object') {
            if (data.data[key].success !== undefined) {
              console.log(`   ${key}: ${data.data[key].success ? '✅' : '❌'} (${Object.keys(data.data[key]).length} clés)`);
            } else {
              console.log(`   ${key}: Object avec ${Object.keys(data.data[key]).length} clés`);
            }
          } else {
            console.log(`   ${key}: ${data.data[key]}`);
          }
        });
        
        // Détails spécifiques pour tokens-pnl
        if (data.data.tokens_pnl && data.data.tokens_pnl.data) {
          const tokensData = data.data.tokens_pnl.data;
          if (tokensData.json && tokensData.json.data && tokensData.json.data.tokens) {
            const tokens = tokensData.json.data.tokens;
            console.log(`\n🪙 TOKENS TROUVÉS: ${tokens.length} tokens`);
            
            // Afficher les 3 premiers tokens
            tokens.slice(0, 3).forEach((token, idx) => {
              console.log(`   ${idx + 1}. ${token.token_symbol || token.symbol || 'N/A'}`);
              console.log(`      💰 PnL: $${token.total_pnl_usd || token.pnl_usd || 'N/A'}`);
              console.log(`      💲 Prix: $${token.token_price_usd || token.price_usd || 'N/A'}`);
              console.log(`      📊 Balance: ${token.holding_amount || token.balance || 'N/A'}`);
            });
            
            if (tokens.length > 3) {
              console.log(`   ... et ${tokens.length - 3} autres tokens`);
            }
          }
        }
      }
      
      return true;
      
    } else {
      console.log('❌ Réponse indique un échec:');
      console.log(`   Erreur: ${data.error || 'Non spécifiée'}`);
      console.log(`   Détails: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
      return false;
    }
    
  } catch (error) {
    console.log('💥 ERREUR LORS DE L\'APPEL:');
    console.log(`   Type: ${error.name}`);
    console.log(`   Message: ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[0]}`);
    }
    return false;
  }
}

async function testDirectCieloAPI() {
  try {
    console.log('\n🔍 2. TEST DIRECT DE L\'API CIELO (pour comparaison)...');
    
    // Configuration directe de l'API Cielo
    const CIELO_CONFIG = {
      baseUrl: 'https://feed-api.cielo.finance/v1',
      headers: {
        'Api-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOjE3NTM1NTAxNjV9.auH6IR4uqg8NlkhyT82sEpav6mvvvRnMMf6hjOnSd0w',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiNkhQRVQ3UkxZZHZ6Z0hTVHVhRWNWbTRoTTV3VkxYa3Z2OTVOWm4yYW0xNGkiLCJpc3MiOiJodHRwczovL2FwaS51bml3aGFsZXMuaW8vIiwic3ViIjoidXNlciIsInBsYW4iOiJiYXNpYyIsImJhbGFuY2UiOjAsImlhdCI6MTc1MzU1MDAxNywiZXhwIjoxNzUzNTYwODE3fQ.t99299sp1pEKJnr8B61GLdj4e6f3bs29uM4xCLUpqVE',
        'Content-Type': 'application/json'
      }
    };
    
    const url = `${CIELO_CONFIG.baseUrl}/tokens-pnl/${TEST_WALLET}`;
    console.log(`📡 URL directe: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: CIELO_CONFIG.headers
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Appel direct réussi !');
      if (data.data && data.data.tokens) {
        console.log(`🪙 ${data.data.tokens.length} tokens récupérés directement`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Appel direct échoué:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Erreur: ${errorText.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`💥 Erreur appel direct: ${error.message}`);
  }
}

async function main() {
  const supabaseSuccess = await testCieloAPI();
  await testDirectCieloAPI();
  
  console.log('\n' + '=' * 60);
  console.log('📋 RÉSUMÉ DES TESTS:');
  console.log(`   🟢 API Supabase (avec clé anon): ${supabaseSuccess ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log('\n🎯 CONCLUSION:');
  
  if (supabaseSuccess) {
    console.log('✅ L\'authentification avec la clé anon fonctionne correctement !');
    console.log('✅ L\'API Cielo répond via la fonction Supabase');
    console.log('✅ Les données de tokens sont récupérées avec succès');
    console.log('\n🚀 Prochaines étapes suggérées:');
    console.log('   1. Tester avec d\'autres wallets');
    console.log('   2. Implémenter la sauvegarde en base');
    console.log('   3. Ajouter l\'enrichissement GeckoTerminal');
  } else {
    console.log('❌ Problème avec l\'authentification ou l\'API');
    console.log('🔧 Vérifications suggérées:');
    console.log('   1. Valider la clé anon Supabase');
    console.log('   2. Vérifier que la fonction cielo-api est déployée');
    console.log('   3. Contrôler les logs de la fonction Supabase');
  }
  
  console.log('=' * 60);
}

// Exécution du script
main().catch(console.error);
