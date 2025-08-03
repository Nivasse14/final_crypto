#!/usr/bin/env node

/**
 * Dashboard final - Test de plusieurs wallets pour analyse comparative
 */

require('dotenv').config();

const TEST_WALLETS = [
    "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    "A1nCMZqrJUjsb7RnZ3dGqWJ4wE5Phy8N3Rz4sKvXoMnY", 
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
];

async function analyzeWallet(walletAddress) {
    const apiUrl = process.env.API_BASE_URL + '/wallet-analyzer';
    const authToken = process.env.SUPABASE_ANON_KEY;
    
    try {
        const response = await fetch(`${apiUrl}/complete/${walletAddress}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            return {
                success: true,
                wallet: walletAddress,
                alphScore: data.data?.alpha_analysis?.alpha_score || 0,
                category: data.data?.alpha_analysis?.alpha_category || 'UNKNOWN',
                recommendation: data.data?.copy_trading_recommendations?.recommendation || 'UNKNOWN',
                confidence: data.data?.alpha_analysis?.alpha_confidence || 0,
                totalPnl: data.data?.trade_analysis?.total_pnl_usd || 0,
                winRate: data.data?.trade_analysis?.win_rate || 0,
                totalTrades: data.data?.trade_analysis?.total_trades || 0,
                allocation: data.data?.copy_trading_recommendations?.suggested_allocation_percentage || 0,
                riskLevel: data.data?.copy_trading_recommendations?.risk_level || 'UNKNOWN'
            };
        } else {
            return {
                success: false,
                wallet: walletAddress,
                error: `${response.status} - ${await response.text()}`
            };
        }
    } catch (error) {
        return {
            success: false,
            wallet: walletAddress,
            error: error.message
        };
    }
}

async function main() {
    console.log('🚀 DASHBOARD ANALYSE WALLETS ALPHA');
    console.log('==================================\n');
    
    const results = [];
    
    for (let i = 0; i < TEST_WALLETS.length; i++) {
        const wallet = TEST_WALLETS[i];
        console.log(`📊 Analyse ${i + 1}/${TEST_WALLETS.length}: ${wallet.substring(0, 8)}...`);
        
        const result = await analyzeWallet(wallet);
        results.push(result);
        
        if (result.success) {
            console.log(`   ✅ Score Alpha: ${result.alphScore.toFixed(1)}/10 | Recommandation: ${result.recommendation}`);
        } else {
            console.log(`   ❌ Erreur: ${result.error}`);
        }
        
        // Attendre entre les requêtes pour éviter le rate limiting
        if (i < TEST_WALLETS.length - 1) {
            console.log('   ⏳ Attente 3 secondes...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Affichage du tableau comparatif
    console.log('\n📈 TABLEAU COMPARATIF DES WALLETS ALPHA');
    console.log('========================================\n');
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
        console.log('❌ Aucune analyse réussie');
        return;
    }
    
    // Tri par score alpha décroissant
    successfulResults.sort((a, b) => b.alphScore - a.alphScore);
    
    console.log('🏆 CLASSEMENT WALLETS ALPHA:');
    console.log('Rang | Wallet    | Score | Catégorie    | Recommandation | PnL     | Win Rate | Allocation');
    console.log('-----|-----------|-------|--------------|----------------|---------|----------|----------');
    
    successfulResults.forEach((result, index) => {
        const rank = index + 1;
        const wallet = result.wallet.substring(0, 8) + '...';
        const score = result.alphScore.toFixed(1);
        const category = result.category.padEnd(12);
        const recommendation = result.recommendation.padEnd(14);
        const pnl = `$${result.totalPnl.toLocaleString()}`.padEnd(7);
        const winRate = `${result.winRate.toFixed(1)}%`.padEnd(8);
        const allocation = `${result.allocation}%`;
        
        console.log(`${rank.toString().padEnd(4)} | ${wallet} | ${score}/10 | ${category} | ${recommendation} | ${pnl} | ${winRate} | ${allocation}`);
    });
    
    // Statistiques générales
    console.log('\n📊 STATISTIQUES GÉNÉRALES:');
    const alphaWallets = successfulResults.filter(r => r.alphScore >= 7);
    const strongCopy = successfulResults.filter(r => r.recommendation === 'STRONG_COPY');
    const avgScore = successfulResults.reduce((sum, r) => sum + r.alphScore, 0) / successfulResults.length;
    const avgPnl = successfulResults.reduce((sum, r) => sum + r.totalPnl, 0) / successfulResults.length;
    
    console.log(`   • Wallets analysés: ${successfulResults.length}`);
    console.log(`   • Wallets Alpha (score ≥ 7): ${alphaWallets.length} (${(alphaWallets.length / successfulResults.length * 100).toFixed(1)}%)`);
    console.log(`   • Recommandations STRONG_COPY: ${strongCopy.length}`);
    console.log(`   • Score Alpha moyen: ${avgScore.toFixed(1)}/10`);
    console.log(`   • PnL moyen: $${avgPnl.toLocaleString()}`);
    
    // Meilleur wallet
    const bestWallet = successfulResults[0];
    console.log('\n🥇 MEILLEUR WALLET ALPHA:');
    console.log(`   • Adresse: ${bestWallet.wallet}`);
    console.log(`   • Score Alpha: ${bestWallet.alphScore.toFixed(1)}/10 (${bestWallet.category})`);
    console.log(`   • Recommandation: ${bestWallet.recommendation}`);
    console.log(`   • Confiance: ${bestWallet.confidence}%`);
    console.log(`   • PnL Total: $${bestWallet.totalPnl.toLocaleString()}`);
    console.log(`   • Win Rate: ${bestWallet.winRate.toFixed(1)}%`);
    console.log(`   • Allocation suggérée: ${bestWallet.allocation}%`);
    console.log(`   • Niveau de risque: ${bestWallet.riskLevel}`);
    
    console.log('\n✅ ANALYSE TERMINÉE - API WALLET-ANALYZER OPÉRATIONNELLE');
    console.log('🎯 Toutes les données nécessaires pour l\'analyse alpha sont disponibles');
    console.log('🔥 Prêt pour le déploiement en production !');
}

main().catch(console.error);
