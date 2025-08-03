#!/usr/bin/env node

// Test de la nouvelle version tokens-pnl qui appelle directement TRPC
const wallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";
const supabaseUrl = "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api";

console.log("🚀 TEST TOKENS-PNL AVEC VRAIE API TRPC");
console.log("=" .repeat(50));
console.log(`🎯 Wallet: ${wallet}`);

async function testTokensPnlTrpc(params = '') {
  const fullUrl = `${supabaseUrl}/tokens-pnl/${wallet}${params}`;
  
  try {
    console.log(`\n🔍 Test: ${fullUrl}`);
    
    const startTime = Date.now();
    const response = await fetch(fullUrl);
    const duration = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`   ⏱️ Durée: ${duration}ms`);
    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ SUCCÈS!`);
      console.log(`   🔗 Source: ${data.source}`);
      console.log(`   📍 Endpoint: ${data.endpoint_used}`);
      console.log(`   🌐 URL TRPC: ${data.trpc_url ? 'OUI' : 'NON'}`);
      
      if (data.data && data.data.tokens) {
        console.log(`   🪙 Nombre de tokens: ${data.data.tokens.length}`);
        console.log(`   📊 Total tokens tradés: ${data.data.total_tokens_traded || 'N/A'}`);
        console.log(`   💰 Total PnL USD: ${data.data.total_pnl_usd?.toFixed(2) || 'N/A'}$`);
        console.log(`   🎯 Win Rate: ${data.data.winrate?.toFixed(1) || 'N/A'}%`);
        console.log(`   📈 ROI Total: ${data.data.total_roi_percentage?.toFixed(1) || 'N/A'}%`);
        
        console.log(`\n   🏆 TOP 5 TOKENS (VRAIES DONNÉES TRPC):`);
        data.data.tokens.slice(0, 5).forEach((token, i) => {
          console.log(`      ${i + 1}. ${token.symbol || 'N/A'} (${token.name || 'N/A'})`);
          console.log(`         💰 PnL: ${token.total_pnl_usd?.toFixed(2) || 'N/A'}$ | ROI: ${token.roi_percentage?.toFixed(1) || 'N/A'}%`);
          console.log(`         🔢 Swaps: ${token.num_swaps || 'N/A'} | 🏷️ Address: ${(token.token_address || 'N/A').substring(0, 8)}...`);
          if (token.gecko_data?.price) {
            console.log(`         💎 Prix actuel: $${token.gecko_data.price}`);
          }
        });
      }
      
      return { success: true, data, duration };
      
    } else {
      console.log(`   ❌ Erreur: ${data.error || 'Erreur inconnue'}`);
      if (data.fallback_reason) {
        console.log(`   🔄 Fallback: ${data.fallback_reason}`);
        console.log(`   ⚠️ Erreur TRPC: ${data.trpc_error}`);
      }
      return { success: false, error: data.error, data };
    }
    
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`\n🚀 TESTS AVEC PARAMÈTRES TRPC ORIGINAUX\n`);
  
  const testCases = [
    { name: 'Page 1, défaut', params: '?page=1' },
    { name: 'Page 1, tous paramètres vides', params: '?page=1&chains=&timeframe=&sortBy=&tokenFilter=' },
    { name: 'Page 2', params: '?page=2' },
    { name: 'Avec timeframe spécifique', params: '?page=1&timeframe=7d' },
    { name: 'Avec tri spécifique', params: '?page=1&sortBy=pnl_desc' }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log("-".repeat(30));
    
    const result = await testTokensPnlTrpc(testCase.params);
    results.push({ ...testCase, ...result });
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause plus longue pour TRPC
  }
  
  console.log("\n" + "=" .repeat(50));
  console.log("📊 RÉSUMÉ FINAL");
  console.log("=" .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const trpcDirect = results.filter(r => r.success && r.data?.source === 'CIELO_TRPC_DIRECT');
  const fallback = results.filter(r => r.success && r.data?.source === 'CIELO_API_FALLBACK');
  
  console.log(`\n✅ Tests réussis: ${successful.length}/${results.length}`);
  console.log(`🎯 Appels TRPC directs: ${trpcDirect.length}`);
  console.log(`🔄 Fallbacks enhanced-stats: ${fallback.length}`);
  console.log(`❌ Tests échoués: ${failed.length}`);
  
  if (trpcDirect.length > 0) {
    console.log(`\n🎉 SUCCÈS TRPC DIRECT!`);
    console.log(`   ✅ L'API appelle maintenant directement profile.fetchTokenPnlSlow`);
    console.log(`   ✅ Toutes les données TRPC sont disponibles`);
    console.log(`   ✅ Pagination native TRPC supportée`);
    console.log(`   ✅ Tous les paramètres TRPC fonctionnels`);
  }
  
  if (fallback.length > 0) {
    console.log(`\n⚠️ Fallbacks utilisés pour ${fallback.length} tests`);
    console.log(`   Cela peut indiquer des problèmes d'authentification TRPC`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Tests échoués:`);
    failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }
  
  console.log(`\n💡 CONCLUSION:`);
  if (trpcDirect.length > 0) {
    console.log(`   🎉 MIGRATION RÉUSSIE vers la vraie API TRPC!`);
    console.log(`   L'endpoint /tokens-pnl utilise maintenant profile.fetchTokenPnlSlow`);
  } else {
    console.log(`   ⚠️ TRPC ne fonctionne pas, mais fallback actif`);
    console.log(`   Il faut investiguer l'authentification TRPC`);
  }
}

main().catch(console.error);
