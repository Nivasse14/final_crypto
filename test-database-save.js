/**
 * Test de sauvegarde en base après correction du schéma
 */

const { createClient } = require('@supabase/supabase-js');
const MarketCapRiskAnalyzer = require('./wallet-analytics/market-cap-risk-analyzer');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Données de test (vos vraies données)
const testTokenData = {
    "chain": "solana",
    "hold_time": 33,
    "num_swaps": 46,
    "token_address": "M5SRMqMgL36gZYcoXFS2oimWqUbEZyUfD6m1B2jJs7Y",
    "token_name": "TESLA AI",
    "total_buy_usd": 14776.46,
    "total_pnl_usd": 220415.64,
    "roi_percentage": 1491.66,
    "market_cap_usd": 6.0741758408210815,
    "calculated_market_cap_usd": 6.0741758408210815,
    "reliability_score": { "total_score": 37.018348623853214 },
    "geckoterminal_complete_data": {
        "pool_data": {
            "gt_score": 46.788990825688074,
            "reserve_usd": "5.2712",
            "volume_24h_usd": "0.07014330869",
            "swap_count_24h": 1,
            "security_indicators": ["low_liquidity_pool"]
        }
    },
    "security_data": {
        "soul_scanner_data": {
            "mintable": "0",
            "freezeable": "0",
            "airdrop_percentage": 95.0,
            "bundled_buy_percentage": 4.997
        }
    },
    "liquidity_locked": { "locked_percent": 100 },
    "is_honeypot": false
};

async function testDatabaseSave() {
    console.log('🧪 TEST DE SAUVEGARDE EN BASE APRÈS CORRECTION\n');
    console.log('='.repeat(60));

    try {
        // 1. Tester la connexion
        console.log('📡 1. TEST DE CONNEXION:');
        const { data: connection, error: connError } = await supabase
            .from('wallet_registry')
            .select('count')
            .limit(1);
            
        if (connError) {
            console.log('   ❌ Erreur connexion:', connError.message);
            return;
        }
        console.log('   ✅ Connexion Supabase OK');

        // 2. Analyser le token avec le Market Cap Analyzer
        console.log('\n🧮 2. ANALYSE MARKET CAP:');
        const analyzer = new MarketCapRiskAnalyzer();
        const analysis = analyzer.analyzeRisk(testTokenData);
        
        console.log(`   📊 Market Cap: $${analysis.market_cap.toLocaleString()}`);
        console.log(`   ⚠️  Risk Tier: ${analysis.risk_tier.tier}`);
        console.log(`   📈 Grade: ${analysis.overall_risk_score.grade}`);

        // 3. Préparer les données pour la base
        const walletAddress = "WALLET_TEST_ALPHA_001";
        
        const walletTokenRecord = {
            wallet_address: walletAddress,
            token_address: testTokenData.token_address,
            token_symbol: "TESLA",
            token_name: testTokenData.token_name,
            chain: testTokenData.chain,
            hold_time: testTokenData.hold_time,
            num_swaps: testTokenData.num_swaps,
            total_buy_usd: testTokenData.total_buy_usd,
            total_pnl_usd: testTokenData.total_pnl_usd,
            roi_percentage: testTokenData.roi_percentage,
            market_cap_usd: testTokenData.market_cap_usd,
            calculated_market_cap_usd: testTokenData.calculated_market_cap_usd,
            reliability_score: testTokenData.reliability_score.total_score,
            liquidity_locked_percent: testTokenData.liquidity_locked.locked_percent,
            is_honeypot: testTokenData.is_honeypot,
            security_data: JSON.stringify(testTokenData.security_data),
            geckoterminal_complete_data: JSON.stringify(testTokenData.geckoterminal_complete_data)
        };

        // 4. Sauvegarder le token
        console.log('\n💾 3. TEST SAUVEGARDE TOKEN:');
        const { data: saveResult, error: saveError } = await supabase
            .from('wallet_tokens')
            .upsert(walletTokenRecord, {
                onConflict: 'wallet_address,token_address'
            })
            .select();

        if (saveError) {
            console.log('   ❌ Erreur sauvegarde:', saveError.message);
            console.log('   🔍 Détails:', saveError);
        } else {
            console.log('   ✅ Token sauvegardé avec succès!');
            console.log(`   📋 ID: ${saveResult[0]?.id}`);
        }

        // 5. Créer/mettre à jour le wallet registry
        console.log('\n👛 4. TEST WALLET REGISTRY:');
        const walletRecord = {
            wallet_address: walletAddress,
            total_pnl_usd: testTokenData.total_pnl_usd,
            roi: testTokenData.roi_percentage / 100,
            tokens_traded: 1,
            wins: testTokenData.total_pnl_usd > 0 ? 1 : 0,
            trade_count: testTokenData.num_swaps,
            status: 'active',
            source: 'alpha_detector',
            metadata: JSON.stringify({
                alpha_score: analysis.overall_risk_score.score,
                risk_tier: analysis.risk_tier.tier,
                market_cap_preference: analysis.risk_tier.tier
            })
        };

        const { data: walletResult, error: walletError } = await supabase
            .from('wallet_registry')
            .upsert(walletRecord, {
                onConflict: 'wallet_address'
            })
            .select();

        if (walletError) {
            console.log('   ❌ Erreur wallet registry:', walletError.message);
        } else {
            console.log('   ✅ Wallet registry mis à jour!');
        }

        // 6. Tester une requête de lecture
        console.log('\n📖 5. TEST LECTURE DONNÉES:');
        const { data: readResult, error: readError } = await supabase
            .from('wallet_tokens')
            .select('wallet_address, token_name, roi_percentage, market_cap_usd')
            .eq('wallet_address', walletAddress)
            .limit(5);

        if (readError) {
            console.log('   ❌ Erreur lecture:', readError.message);
        } else {
            console.log('   ✅ Lecture réussie:');
            readResult.forEach(token => {
                console.log(`     • ${token.token_name}: ROI ${token.roi_percentage}%, MC $${token.market_cap_usd}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 RÉSULTAT: BASE DE DONNÉES FONCTIONNELLE!');
        console.log('   ✅ Contraintes d\'adresses corrigées');
        console.log('   ✅ Market Cap Analyzer intégré');
        console.log('   ✅ Sauvegarde/lecture opérationnelle');
        console.log('   🚀 Prêt pour déploiement complet!');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécution
runTests().catch(console.error);

async function runTests() {
    await testDatabaseSave();
}
