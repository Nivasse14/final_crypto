/**
 * Test du Market Cap Risk Analyzer avec les données réelles
 */

const MarketCapRiskAnalyzer = require('./market-cap-risk-analyzer');

// Données d'exemple basées sur votre JSON
const testTokens = [
    {
        name: "TESLA AI (Micro Cap)",
        market_cap_usd: 6.07,
        calculated_market_cap_usd: 6.07,
        is_honeypot: false,
        reliability_score: { total_score: 37.02 },
        security_data: {
            soul_scanner_data: {
                mintable: "0",
                freezeable: "0",
                airdrop_percentage: 95.0,
                bundled_buy_percentage: 4.997
            }
        },
        liquidity_locked: { locked_percent: 100 },
        geckoterminal_complete_data: {
            pool_data: {
                reserve_usd: "5.2712",
                volume_24h_usd: "0.07014330869",
                swap_count_24h: 1,
                security_indicators: ["low_liquidity_pool"]
            }
        },
        trading_performance: {
            roi_percentage: 1491.66,
            total_pnl_usd: 220415.64
        }
    },
    {
        name: "DeepSeekAI (Large Cap)",
        market_cap_usd: 3629805504.80,
        calculated_market_cap_usd: 3629805504.80,
        is_honeypot: false,
        reliability_score: { total_score: 36.19 },
        security_data: {
            soul_scanner_data: {
                mintable: "0",
                freezeable: "0",
                airdrop_percentage: 95.0,
                bundled_buy_percentage: 4.997
            }
        },
        liquidity_locked: { locked_percent: 100 },
        geckoterminal_complete_data: {
            pool_data: {
                reserve_usd: "112188.962",
                volume_24h_usd: "567798.721863231",
                swap_count_24h: 48741,
                security_indicators: ["newly_created_pool"]
            }
        },
        trading_performance: {
            roi_percentage: 1233717.06,
            total_pnl_usd: 180905088.96
        }
    }
];

function analyzeTokens() {
    const analyzer = new MarketCapRiskAnalyzer();
    
    console.log('🎯 ANALYSE DES RISQUES PAR MARKET CAP\n');
    console.log('='.repeat(80));
    
    testTokens.forEach((token, index) => {
        console.log(`\n📊 TOKEN ${index + 1}: ${token.name}`);
        console.log('-'.repeat(50));
        
        const analysis = analyzer.analyzeRisk(token);
        
        console.log(`💰 Market Cap: $${analysis.market_cap.toLocaleString()}`);
        console.log(`⚠️  Risk Tier: ${analysis.risk_tier.tier} (${analysis.risk_tier.risk_level})`);
        console.log(`🔒 Liquidity Risk: ${analysis.liquidity_risk.level} (Score: ${analysis.liquidity_risk.score})`);
        console.log(`🛡️  Security Score: ${analysis.security_risk.score}/100`);
        console.log(`📈 Overall Risk: ${analysis.overall_risk_score.grade} (${analysis.overall_risk_score.score.toFixed(1)})`);
        
        console.log(`\n💡 RECOMMANDATIONS:`);
        console.log(`   • Position Max: ${analysis.position_recommendation.max_position_percent}% du portefeuille`);
        console.log(`   • Stratégie d'entrée: ${analysis.position_recommendation.recommended_entry}`);
        
        if (analysis.position_recommendation.warning) {
            console.log(`   ⚠️  WARNING: ${analysis.position_recommendation.warning}`);
        }
        
        console.log(`\n📤 STRATÉGIE DE SORTIE (${analysis.exit_strategy.strategy}):`);
        analysis.exit_strategy.take_profits.forEach((tp, i) => {
            console.log(`   ${i + 1}. Vendre ${tp.percentage}% à +${tp.roi_target}% ROI`);
        });
        console.log(`   🛑 Stop Loss: ${analysis.exit_strategy.stop_loss}%`);
        
        // Calcul du potentiel profit ajusté au risque
        const performanceData = token.trading_performance;
        const riskAdjustedProfit = performanceData.total_pnl_usd * analysis.risk_tier.multiplier;
        
        console.log(`\n📊 PERFORMANCE ANALYSIS:`);
        console.log(`   • ROI Réalisé: ${performanceData.roi_percentage.toLocaleString()}%`);
        console.log(`   • Profit Brut: $${performanceData.total_pnl_usd.toLocaleString()}`);
        console.log(`   • Profit Ajusté Risque: $${riskAdjustedProfit.toLocaleString()}`);
        console.log(`   • Score Risk/Reward: ${(riskAdjustedProfit / 1000).toFixed(1)}/10`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 INSIGHTS POUR VOTRE STRATÉGIE:');
    console.log('   1. Les micro-caps (<$1K) offrent le plus gros potentiel mais EXTREME RISK');
    console.log('   2. Limitez les positions micro-cap à 0.5% max du portefeuille');
    console.log('   3. Les large-caps (>$10M) sont plus sûrs mais potentiel limité');
    console.log('   4. Utilisez le DCA pour les entrées sur micro/nano caps');
    console.log('   5. Prenez des profits par tranches pour optimiser les gains');
}

// Fonction pour intégrer avec votre système existant
function integrateWithScanDune() {
    console.log('\n🔧 INTÉGRATION AVEC SCANDUNE:');
    console.log('   • Ajoutez cette analyse à votre pipeline d\'enrichissement');
    console.log('   • Créez des alertes basées sur les scores de risque');
    console.log('   • Implémentez les recommandations de position sizing');
    console.log('   • Utilisez les stratégies de sortie automatiques');
}

// Exécution
analyzeTokens();
integrateWithScanDune();
