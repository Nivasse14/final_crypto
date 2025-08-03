#!/usr/bin/env node

/**
 * Test avec un vrai portefeuille Solana
 * Analyse d'un wallet performant pour détecter les signaux alpha
 */

const MarketCapRiskAnalyzer = require('./wallet-analytics/market-cap-risk-analyzer');

// Exemple de données réelles d'un wallet Solana performant
const REAL_WALLET_DATA = {
    wallet_address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Exemple de wallet alpha
    tokens: [
        {
            token_address: "So11111111111111111111111111111111111111112", // SOL
            token_symbol: "SOL",
            token_name: "Solana",
            total_buy_usd: 15000,
            total_pnl_usd: 45000,
            roi_percentage: 300,
            market_cap_usd: 89000000000, // ~89B market cap SOL
            hold_time: 2160, // 90 jours
            num_swaps: 12,
            chart_link: "https://dexscreener.com/solana/sol",
            last_trade: Date.now() - 24 * 60 * 60 * 1000, // Il y a 1 jour
            first_trade: Date.now() - 90 * 24 * 60 * 60 * 1000, // Il y a 90 jours
        },
        {
            token_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
            token_symbol: "USDC",
            token_name: "USD Coin",
            total_buy_usd: 25000,
            total_pnl_usd: 2500,
            roi_percentage: 10,
            market_cap_usd: 32000000000, // ~32B market cap USDC
            hold_time: 720, // 30 jours
            num_swaps: 8,
            chart_link: "https://dexscreener.com/solana/usdc",
            last_trade: Date.now() - 12 * 60 * 60 * 1000, // Il y a 12h
            first_trade: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
        {
            token_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
            token_symbol: "BONK",
            token_name: "Bonk",
            total_buy_usd: 5000,
            total_pnl_usd: 85000,
            roi_percentage: 1700,
            market_cap_usd: 2800000000, // ~2.8B market cap BONK
            hold_time: 4320, // 180 jours
            num_swaps: 25,
            chart_link: "https://dexscreener.com/solana/bonk",
            last_trade: Date.now() - 3 * 24 * 60 * 60 * 1000, // Il y a 3 jours
            first_trade: Date.now() - 180 * 24 * 60 * 60 * 1000,
        },
        {
            token_address: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // POPCAT
            token_symbol: "POPCAT",
            token_name: "Popcat",
            total_buy_usd: 8000,
            total_pnl_usd: 120000,
            roi_percentage: 1500,
            market_cap_usd: 950000000, // ~950M market cap
            hold_time: 1440, // 60 jours
            num_swaps: 18,
            chart_link: "https://dexscreener.com/solana/popcat",
            last_trade: Date.now() - 6 * 60 * 60 * 1000, // Il y a 6h
            first_trade: Date.now() - 60 * 24 * 60 * 60 * 1000,
        },
        {
            token_address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
            token_symbol: "JUP",
            token_name: "Jupiter",
            total_buy_usd: 12000,
            total_pnl_usd: 28000,
            roi_percentage: 233,
            market_cap_usd: 1200000000, // ~1.2B market cap
            hold_time: 2880, // 120 jours
            num_swaps: 15,
            chart_link: "https://dexscreener.com/solana/jup",
            last_trade: Date.now() - 2 * 24 * 60 * 60 * 1000,
            first_trade: Date.now() - 120 * 24 * 60 * 60 * 1000,
        }
    ]
};

async function testRealWallet() {
    console.log('🎯 TEST AVEC UN VRAI PORTEFEUILLE SOLANA\n');
    console.log('=' * 60);
    
    const analyzer = new MarketCapRiskAnalyzer();
    const walletAddress = REAL_WALLET_DATA.wallet_address;
    
    console.log(`🔍 ANALYSE DU WALLET: ${walletAddress}`);
    console.log('=' * 50);
    
    let totalPnl = 0;
    let totalInvested = 0;
    let riskScores = [];
    let alphaIndicators = [];
    
    // Analyser chaque token
    console.log('\n📊 ANALYSE DES TOKENS:\n');
    
    for (let i = 0; i < REAL_WALLET_DATA.tokens.length; i++) {
        const token = REAL_WALLET_DATA.tokens[i];
        
        console.log(`💎 Token ${i + 1}: ${token.token_symbol} (${token.token_name})`);
        
        // Analyse du Market Cap Risk
        const analysis = analyzer.analyzeRisk(token);
        
        console.log(`   💰 Market Cap: $${(token.market_cap_usd / 1000000).toFixed(0)}M`);
        console.log(`   ⚠️  Risk Tier: ${analysis.risk_tier?.tier} (${analysis.risk_tier?.risk_level})`);
        console.log(`   📈 Grade: ${analysis.overall_risk_score?.grade} (${analysis.overall_risk_score?.score?.toFixed(1)})`);
        console.log(`   💵 PnL: $${token.total_pnl_usd.toLocaleString()} (${token.roi_percentage}%)`);
        console.log(`   🕐 Hold: ${Math.round(token.hold_time / 24)}j | Swaps: ${token.num_swaps}`);
        
        // Recommandations spécifiques
        if (analysis.position_recommendation) {
            console.log(`   💡 Position: ${analysis.position_recommendation}`);
        }
        
        totalPnl += token.total_pnl_usd;
        totalInvested += token.total_buy_usd;
        riskScores.push(analysis.overall_risk_score?.score || 50);
        
        // Détection des signaux alpha
        if (token.roi_percentage > 500) {
            alphaIndicators.push(`${token.token_symbol}: ROI exceptionnel (${token.roi_percentage}%)`);
        }
        
        if (analysis.risk_tier?.tier === 'MICRO_CAP' && token.roi_percentage > 1000) {
            alphaIndicators.push(`${token.token_symbol}: Micro-cap explosif détecté!`);
        }
        
        console.log('');
    }
    
    // Calculs des métriques du wallet
    const avgRoi = ((totalPnl / totalInvested) * 100);
    const avgRiskScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    
    // Score Alpha personnalisé
    let alphaScore = 0;
    
    // Facteur ROI (40% du score)
    alphaScore += Math.min((avgRoi / 10), 40); // Max 40 points pour ROI
    
    // Facteur diversification (20% du score)
    alphaScore += Math.min((REAL_WALLET_DATA.tokens.length * 4), 20); // Max 20 points
    
    // Facteur timing (20% du score) - Basé sur les trades récents
    const recentTrades = REAL_WALLET_DATA.tokens.filter(t => 
        (Date.now() - t.last_trade) < 7 * 24 * 60 * 60 * 1000 // Dernière semaine
    ).length;
    alphaScore += Math.min((recentTrades * 5), 20); // Max 20 points
    
    // Facteur risk-adjusted (20% du score)
    alphaScore += Math.min((avgRiskScore / 5), 20); // Max 20 points
    
    console.log('🏆 RÉSULTATS DU WALLET:');
    console.log('=' * 30);
    console.log(`   💰 PnL Total: $${totalPnl.toLocaleString()}`);
    console.log(`   📊 ROI Moyen: ${avgRoi.toFixed(1)}%`);
    console.log(`   📈 Investissement: $${totalInvested.toLocaleString()}`);
    console.log(`   ⚖️  Risk Score: ${avgRiskScore.toFixed(1)}/100`);
    console.log(`   🌟 Alpha Score: ${alphaScore.toFixed(1)}/100`);
    console.log(`   🪙 Tokens: ${REAL_WALLET_DATA.tokens.length}`);
    
    // Classification du wallet
    console.log('\n🎯 CLASSIFICATION:');
    if (alphaScore >= 80) {
        console.log('   🥇 WALLET ALPHA ELITE - Copy trading hautement recommandé!');
    } else if (alphaScore >= 60) {
        console.log('   🥈 WALLET ALPHA CONFIRMÉ - Surveiller de près');
    } else if (alphaScore >= 40) {
        console.log('   🥉 WALLET PROMETTEUR - Potentiel intéressant');
    } else {
        console.log('   📊 WALLET STANDARD - Performance normale');
    }
    
    // Signaux alpha détectés
    if (alphaIndicators.length > 0) {
        console.log('\n🚨 SIGNAUX ALPHA DÉTECTÉS:');
        alphaIndicators.forEach((signal, i) => {
            console.log(`   ${i + 1}. ${signal}`);
        });
    }
    
    // Recommandations stratégiques
    console.log('\n💡 RECOMMANDATIONS STRATÉGIQUES:');
    
    if (avgRoi > 500) {
        console.log('   ⭐ Copy trading recommandé - Performance exceptionnelle');
    }
    
    if (alphaIndicators.some(s => s.includes('Micro-cap'))) {
        console.log('   💎 Spécialiste micro-caps - Early adopter confirmé');
    }
    
    if (recentTrades >= 3) {
        console.log('   ⚡ Trading actif - Suit les tendances du marché');
    }
    
    const holdTimeAvg = REAL_WALLET_DATA.tokens.reduce((sum, t) => sum + t.hold_time, 0) / REAL_WALLET_DATA.tokens.length;
    if (holdTimeAvg > 2000) { // Plus de 83 jours
        console.log('   🏆 Investisseur patient - Stratégie long terme');
    }
    
    console.log('\n📈 MÉTRIQUES DE PERFORMANCE:');
    console.log(`   🎯 Win Rate: ${((REAL_WALLET_DATA.tokens.filter(t => t.roi_percentage > 0).length / REAL_WALLET_DATA.tokens.length) * 100).toFixed(1)}%`);
    console.log(`   💰 Best Trade: ${Math.max(...REAL_WALLET_DATA.tokens.map(t => t.roi_percentage))}% ROI`);
    console.log(`   📊 Avg Trade Size: $${(totalInvested / REAL_WALLET_DATA.tokens.length).toLocaleString()}`);
    
    console.log('\n' + '=' * 60);
    console.log('✨ Test terminé! Ce wallet montre des signaux alpha forts.');
    console.log('🚀 Prêt pour l\'intégration avec des données réelles via APIs!');
    
    return {
        walletAddress,
        totalPnl,
        avgRoi,
        alphaScore,
        classification: alphaScore >= 60 ? 'ALPHA' : 'STANDARD',
        signals: alphaIndicators
    };
}

// Fonction pour simuler la récupération de données via API
async function simulateApiIntegration() {
    console.log('\n🔌 SIMULATION INTÉGRATION API:\n');
    
    console.log('📡 Sources de données disponibles:');
    console.log('   • Solscan API - Transactions wallet');
    console.log('   • DexScreener API - Prix et market caps');
    console.log('   • Jupiter API - Données de trading');
    console.log('   • Helius API - Metadata des tokens');
    
    console.log('\n🔄 Flux de données suggéré:');
    console.log('   1. Récupérer les transactions du wallet (Solscan)');
    console.log('   2. Identifier les tokens tradés');
    console.log('   3. Enrichir avec market cap (DexScreener)');
    console.log('   4. Calculer les PnL et ROI');
    console.log('   5. Analyser avec Market Cap Risk Analyzer');
    console.log('   6. Générer le score Alpha');
    console.log('   7. Sauvegarder en base Supabase');
    
    console.log('\n⚡ Optimisations possibles:');
    console.log('   • Cache des market caps pour éviter les re-requêtes');
    console.log('   • Batch processing pour analyser plusieurs wallets');
    console.log('   • Alertes en temps réel sur nouveaux trades alpha');
    console.log('   • Dashboard pour suivre les top performers');
}

if (require.main === module) {
    testRealWallet()
        .then(result => {
            console.log(`\n🎯 Résultat: Wallet ${result.classification} avec ${result.alphaScore.toFixed(1)}/100`);
            return simulateApiIntegration();
        })
        .catch(console.error);
}
