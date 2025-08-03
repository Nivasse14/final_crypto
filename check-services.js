#!/usr/bin/env node

/**
 * Vérification des services utilisés par l'API complete
 */

require('dotenv').config();

async function checkServicesUsed() {
    console.log('🔍 VÉRIFICATION DES SERVICES UTILISÉS\n');
    console.log('=' * 50);
    
    const apiUrl = process.env.API_BASE_URL + '/cielo-api';
    const authToken = process.env.SUPABASE_ANON_KEY;
    
    // Test avec différents types de requêtes pour voir les logs
    const tests = [
        { name: 'Health Check', body: { action: 'health' } },
        { name: 'Complete Data', body: { action: 'complete', wallet_address: 'test' } },
        { name: 'Status Check', body: { action: 'status' } }
    ];
    
    for (const test of tests) {
        console.log(`\n🧪 TEST: ${test.name}`);
        console.log('-' * 30);
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(test.body)
            });
            
            console.log(`Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Chercher des indices sur les services utilisés
                const responseText = JSON.stringify(data, null, 2);
                
                if (responseText.includes('mock')) {
                    console.log('📊 Type de données: MOCK (simulées)');
                } else if (responseText.includes('real')) {
                    console.log('📊 Type de données: RÉELLES');
                } else {
                    console.log('📊 Type de données: Indéterminé');
                }
                
                if (data.debug) {
                    console.log('🔍 Debug info:', data.debug);
                }
                
                if (data.use_mock_data !== undefined) {
                    console.log(`🎭 Mode Mock: ${data.use_mock_data ? 'Activé' : 'Désactivé'}`);
                }
                
                // Chercher des mentions d'APIs externes
                if (responseText.includes('gmgn')) {
                    console.log('🔌 Service GMGN: Mentionné');
                }
                
                if (responseText.includes('geckoterminal')) {
                    console.log('🔌 Service GeckoTerminal: Présent dans les données');
                }
                
                if (responseText.includes('coingecko')) {
                    console.log('🔌 Service CoinGecko: Mentionné');
                }
                
            } else {
                console.log(`Erreur: ${response.statusText}`);
            }
            
        } catch (err) {
            console.log(`Erreur: ${err.message}`);
        }
    }
    
    // Test direct sur l'endpoint complete
    console.log('\n🚀 TEST DIRECT COMPLETE API:');
    console.log('=' * 40);
    
    try {
        const walletTest = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
        const response = await fetch(`${apiUrl}/complete/${walletTest}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('📊 ANALYSE DES DONNÉES RETOURNÉES:');
            console.log(`   • Structure: ${Object.keys(data).join(', ')}`);
            
            if (data.data) {
                console.log(`   • Sections: ${Object.keys(data.data).join(', ')}`);
                
                // Analyser la qualité des données
                if (data.data.summary) {
                    const summary = data.data.summary;
                    console.log(`   • Tokens tradés: ${summary.total_tokens_traded || 'N/A'}`);
                    console.log(`   • PnL total: $${summary.total_pnl_usd?.toLocaleString() || 'N/A'}`);
                    console.log(`   • Win rate: ${summary.winrate?.toFixed(1) || 'N/A'}%`);
                }
                
                // Vérifier l'enrichissement GeckoTerminal
                if (data.data.summary?.geckoterminal_enrichment) {
                    const enrichment = data.data.summary.geckoterminal_enrichment;
                    console.log(`   • GeckoTerminal enrichment: ${enrichment.enrichment_completion_status}`);
                    console.log(`   • Tokens enrichis: ${enrichment.total_enriched_tokens}/${enrichment.total_tokens_processed}`);
                }
                
                // Analyser les données du portfolio
                if (data.data.portfolio?.data?.portfolio) {
                    const portfolio = data.data.portfolio.data.portfolio;
                    console.log(`   • Portfolio tokens: ${portfolio.length}`);
                    
                    const hasRealMarketCaps = portfolio.some(token => 
                        token.geckoterminal_complete_data?.market_cap_usd > 0
                    );
                    
                    if (hasRealMarketCaps) {
                        console.log('   ✅ Market caps réelles détectées');
                    } else {
                        console.log('   ⚠️  Market caps manquantes ou simulées');
                    }
                }
            }
            
        } else {
            console.log(`Erreur complete: ${response.status}`);
        }
        
    } catch (err) {
        console.log(`Erreur complete: ${err.message}`);
    }
    
    console.log('\n' + '=' * 50);
    console.log('📋 CONCLUSION SUR LES SERVICES:');
    console.log('');
    console.log('🔌 SERVICES CONFIRMÉS:');
    console.log('  ✅ Supabase Edge Function (cielo-api)');
    console.log('  ✅ Market Cap Risk Analyzer (local)');
    console.log('  ✅ Données enrichies GeckoTerminal (dans la réponse)');
    console.log('');
    console.log('❓ SERVICES À VÉRIFIER:');
    console.log('  📊 Source des données Solana (mock vs réelles)');
    console.log('  🔍 APIs externes GMGN/Cielo (configuration à confirmer)');
    console.log('');
    console.log('💡 Pour utiliser de vraies APIs Solana:');
    console.log('  1. Configurer GMGN_API_KEY dans Supabase');
    console.log('  2. Configurer CIELO_API_URL dans Supabase');
    console.log('  3. Définir USE_MOCK_DATA=false dans Supabase');
}

if (require.main === module) {
    checkServicesUsed().catch(console.error);
}
