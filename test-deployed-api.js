#!/usr/bin/env node

// Test de l'API déployée avec l'enrichissement DexScreener
// Version: v4_trpc_complete_with_dexscreener

console.log('🚀 Test de l\'API déployée avec enrichissement DexScreener...\n');

const SUPABASE_FUNCTION_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';

// Test avec le wallet SDOG connu
const testWallet = 'CTz1ULubG4XeJgfKYzKakqwTxNuzv9ERnCvg5ieWZokq';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrbnpk/your_anon_key_here',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
};

async function testDeployedAPI() {
    try {
        console.log(`📡 Appel API pour wallet: ${testWallet}`);
        console.log(`🔗 URL: ${SUPABASE_FUNCTION_URL}\n`);

        const startTime = Date.now();
        
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                wallet_address: testWallet,
                version: 'v4_trpc_complete_with_dexscreener'
            })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️  Durée de la requête: ${duration}ms`);
        console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API:', errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ Réponse reçue !');
        
        // Analyser la réponse pour vérifier l'enrichissement DexScreener
        console.log('\n📋 Analyse de la réponse:');
        console.log(`- Success: ${result.success}`);
        console.log(`- Version: ${result.version}`);
        console.log(`- Timestamp: ${result.timestamp}`);
        
        if (result.enrichment_stats) {
            console.log('\n🎯 Statistiques d\'enrichissement:');
            console.log(`- Total tokens: ${result.enrichment_stats.total_tokens}`);
            console.log(`- Enrichis avec succès: ${result.enrichment_stats.successful_enrichments}`);
            console.log(`- Échecs: ${result.enrichment_stats.failed_enrichments}`);
            console.log(`- Source: ${result.enrichment_stats.enrichment_source}`);
            console.log(`- Durée: ${result.enrichment_stats.enrichment_duration_ms}ms`);
        }

        if (result.portfolio_tokens && result.portfolio_tokens.length > 0) {
            console.log('\n💰 Tokens du portfolio enrichis:');
            result.portfolio_tokens.slice(0, 3).forEach((token, index) => {
                console.log(`\n${index + 1}. ${token.symbol || 'Unknown'} (${token.mint_address})`);
                if (token.dexscreener_data) {
                    console.log(`   💹 Prix: $${token.dexscreener_data.price || 'N/A'}`);
                    console.log(`   🌊 Liquidité: $${token.dexscreener_data.liquidity?.usd?.toLocaleString() || 'N/A'}`);
                    console.log(`   📈 Market Cap: $${token.dexscreener_data.market_cap?.toLocaleString() || 'N/A'}`);
                    console.log(`   🎯 Score: ${token.dexscreener_data.reliability_score || 'N/A'}/100`);
                } else {
                    console.log('   ❌ Pas d\'enrichissement DexScreener');
                }
            });
        }

        if (result.pnl_tokens && result.pnl_tokens.length > 0) {
            console.log('\n📊 Tokens PnL enrichis:');
            result.pnl_tokens.slice(0, 3).forEach((token, index) => {
                console.log(`\n${index + 1}. ${token.symbol || 'Unknown'} (${token.mint_address})`);
                if (token.dexscreener_data) {
                    console.log(`   💹 Prix: $${token.dexscreener_data.price || 'N/A'}`);
                    console.log(`   🌊 Liquidité: $${token.dexscreener_data.liquidity?.usd?.toLocaleString() || 'N/A'}`);
                    console.log(`   📈 Market Cap: $${token.dexscreener_data.market_cap?.toLocaleString() || 'N/A'}`);
                    console.log(`   🎯 Score: ${token.dexscreener_data.reliability_score || 'N/A'}/100`);
                } else {
                    console.log('   ❌ Pas d\'enrichissement DexScreener');
                }
            });
        }

        // Sauvegarder la réponse complète pour analyse
        const fs = await import('fs');
        const filename = `api-response-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(result, null, 2));
        console.log(`\n💾 Réponse complète sauvegardée dans: ${filename}`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
        if (error.cause) {
            console.error('   Cause:', error.cause);
        }
    }
}

// Test avec timeout
const timeout = setTimeout(() => {
    console.log('⏰ Timeout après 30 secondes');
    process.exit(1);
}, 30000);

testDeployedAPI().then(() => {
    clearTimeout(timeout);
    console.log('\n✅ Test terminé');
}).catch(error => {
    clearTimeout(timeout);
    console.error('\n❌ Test échoué:', error);
    process.exit(1);
});
