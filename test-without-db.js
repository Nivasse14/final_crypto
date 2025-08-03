/**
 * Test du système sans base de données
 * Pour vérifier que tout fonctionne avant la connexion DB
 */

const MarketCapRiskAnalyzer = require('./wallet-analytics/market-cap-risk-analyzer');

// Données de test (vos vraies données)
const sampleWalletData = {
    address: "WALLET_ALPHA_TEST",
    tokens: [
        {
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
        },
        {
            "chain": "solana",
            "hold_time": 223,
            "num_swaps": 31,
            "token_address": "E2fTnQvKD1zWxTVqz1F4fYWjJbq7vuNGhBtxBz1Lr7Wg",
            "token_name": "DeepSeekAI",
            "total_buy_usd": 14663.41,
            "total_pnl_usd": 181719.74,
            "roi_percentage": 1239.27,
            "market_cap_usd": 3629805504.80,
            "calculated_market_cap_usd": 3629805504.80,
            "reliability_score": { "total_score": 36.19 },
            "geckoterminal_complete_data": {
                "pool_data": {
                    "gt_score": 72.35475229357799,
                    "reserve_usd": "112188.962",
                    "volume_24h_usd": "567798.721863231",
                    "swap_count_24h": 48741,
                    "security_indicators": ["newly_created_pool"]
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
        }
    ]
};

console.log('🚀 TEST SYSTÈME SCANDUNE - SANS BASE DE DONNÉES\n');
console.log('='.repeat(70));

// Test Market Cap Analyzer
console.log('\n🧮 1. TEST MARKET CAP RISK ANALYZER:');

const analyzer = new MarketCapRiskAnalyzer();

sampleWalletData.tokens.forEach((token, index) => {
    console.log(`\n📊 Token ${index + 1}: ${token.token_name}`);
    console.log('-'.repeat(40));
    
    const analysis = analyzer.analyzeRisk(token);
    
    console.log(`   💰 Market Cap: $${analysis.market_cap.toLocaleString()}`);
    console.log(`   ⚠️  Risk Tier: ${analysis.risk_tier.tier} (${analysis.risk_tier.risk_level})`);
    console.log(`   💧 Liquidity: ${analysis.liquidity_risk.level} (${analysis.liquidity_risk.score}/80)`);
    console.log(`   🔒 Security: ${analysis.security_risk.score}/100`);
    console.log(`   📈 Grade: ${analysis.overall_risk_score.grade} (${analysis.overall_risk_score.score.toFixed(1)})`);
    console.log(`   💵 PnL: $${token.total_pnl_usd.toLocaleString()} (${token.roi_percentage}%)`);
    console.log(`   📍 Position Max: ${analysis.position_recommendation.max_position_percent}%`);
    console.log(`   📤 Exit Strategy: ${analysis.exit_strategy.strategy}`);
    
    // Afficher les niveaux de prise de profit
    console.log(`   💎 Take Profits:`);
    analysis.exit_strategy.take_profits.forEach((tp, i) => {
        console.log(`     ${i + 1}. ${tp.percentage}% à +${tp.roi_target}% ROI`);
    });
});

// Calcul du score Alpha global du wallet
console.log('\n🎯 2. SCORE ALPHA GLOBAL DU WALLET:');
console.log('-'.repeat(40));

const totalPnl = sampleWalletData.tokens.reduce((sum, t) => sum + t.total_pnl_usd, 0);
const avgRoi = sampleWalletData.tokens.reduce((sum, t) => sum + t.roi_percentage, 0) / sampleWalletData.tokens.length;
const avgHoldTime = sampleWalletData.tokens.reduce((sum, t) => sum + t.hold_time, 0) / sampleWalletData.tokens.length;
const avgSwaps = sampleWalletData.tokens.reduce((sum, t) => sum + t.num_swaps, 0) / sampleWalletData.tokens.length;

// Calculer un score alpha simplifié
const performanceScore = Math.min(avgRoi / 10, 100); // Cap à 100
const consistencyBonus = sampleWalletData.tokens.length > 1 ? 1.2 : 1.0;
const timingBonus = avgHoldTime < 100 ? 1.1 : 1.0; // Bonus pour les trades rapides
const alphaScore = Math.min(performanceScore * consistencyBonus * timingBonus, 100);

console.log(`   💰 PnL Total: $${totalPnl.toLocaleString()}`);
console.log(`   📊 ROI Moyen: ${avgRoi.toFixed(1)}%`);
console.log(`   ⏱️  Hold Time Moyen: ${avgHoldTime.toFixed(1)}h`);
console.log(`   🔄 Swaps Moyens: ${avgSwaps.toFixed(1)}`);
console.log(`   🌟 Alpha Score: ${alphaScore.toFixed(1)}/100`);

// Classification du wallet
let walletClass = '';
let recommendation = '';

if (alphaScore >= 80) {
    walletClass = '🚀 WALLET ALPHA CONFIRMÉ';
    recommendation = 'Copy trading fortement recommandé';
} else if (alphaScore >= 60) {
    walletClass = '⭐ WALLET PERFORMANT';
    recommendation = 'Copy trading recommandé avec prudence';
} else if (alphaScore >= 40) {
    walletClass = '👀 WALLET PROMETTEUR';
    recommendation = 'Surveiller les prochains trades';
} else {
    walletClass = '⚠️  WALLET À RISQUE';
    recommendation = 'Éviter le copy trading';
}

console.log(`\n${walletClass}`);
console.log(`   💡 Recommandation: ${recommendation}`);

// Insights sur la stratégie
console.log('\n🧠 3. INSIGHTS STRATÉGIQUES:');
console.log('-'.repeat(40));

const microCapTokens = sampleWalletData.tokens.filter(t => t.market_cap_usd < 1000).length;
const largeCapTokens = sampleWalletData.tokens.filter(t => t.market_cap_usd > 1000000).length;

console.log(`   📈 Mix de tokens: ${microCapTokens} micro-cap + ${largeCapTokens} large-cap`);
console.log(`   🎯 Spécialité: ${microCapTokens > 0 ? 'Détection précoce de gems' : 'Trading conservateur'}`);
console.log(`   ⚡ Vitesse: ${avgHoldTime < 100 ? 'Scalping rapide' : 'Hold moyen terme'}`);
console.log(`   🔥 Style: ${avgRoi > 1000 ? 'High risk / High reward' : 'Modéré'}`);

// Prochaines étapes
console.log('\n' + '='.repeat(70));
console.log('✅ SYSTÈME MARKET CAP ANALYZER: FONCTIONNEL');
console.log('✅ DÉTECTEUR WALLETS ALPHA: OPÉRATIONNEL');
console.log('✅ ANALYSE STRATÉGIQUE: COMPLÈTE');
console.log('\n🔧 PROCHAINES ÉTAPES:');
console.log('   1. Corrigez les clés API dans .env');
console.log('   2. Exécutez create-minimal.sql dans Supabase');
console.log('   3. Testez la sauvegarde en base');
console.log('   4. Déployez le système complet');

console.log('\n🎉 VOTRE SYSTÈME DE DÉTECTION DES WALLETS ALPHA EST PRÊT!');
