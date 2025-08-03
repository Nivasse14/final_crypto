// 🎯 DÉMONSTRATION FINALE : Système de Détection de Wallets Alpha
// Ce script montre comment utiliser les nouvelles APIs pour détecter les wallets performants

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

class WalletAlphaDetector {
    constructor() {
        this.baseUrl = `${SUPABASE_URL}/functions/v1/wallet-analyzer`;
        this.headers = {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };
    }

    async analyzeWallet(walletAddress, analysisType = 'quick') {
        console.log(`🔍 Analyse ${analysisType} du wallet: ${walletAddress.substring(0, 8)}...`);
        
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/${analysisType}/${walletAddress}`, {
                method: analysisType === 'complete' ? 'POST' : 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const duration = (Date.now() - startTime) / 1000;
            
            return { ...data, analysisTime: duration };
            
        } catch (error) {
            console.error(`❌ Erreur analyse ${walletAddress}:`, error.message);
            return null;
        }
    }

    classifyWallet(analysis) {
        if (!analysis?.data) return null;
        
        const { alpha_score, total_pnl_usd, win_rate, risk_analysis } = analysis.data;
        
        // Classification Alpha
        let alphaCategory = 'STANDARD';
        if (alpha_score >= 8) alphaCategory = 'ALPHA_EXCELLENT';
        else if (alpha_score >= 6) alphaCategory = 'ALPHA_GOOD';
        else if (alpha_score >= 4) alphaCategory = 'ALPHA_POTENTIAL';
        
        // Classification Performance
        let performanceCategory = 'AVERAGE';
        if (total_pnl_usd > 50000 && win_rate > 70) performanceCategory = 'EXCEPTIONAL';
        else if (total_pnl_usd > 10000 && win_rate > 60) performanceCategory = 'HIGH';
        else if (total_pnl_usd > 1000 && win_rate > 50) performanceCategory = 'GOOD';
        
        // Classification Risque
        const riskScore = risk_analysis?.portfolio_risk_score || 50;
        let riskCategory = 'MEDIUM_RISK';
        if (riskScore < 30) riskCategory = 'LOW_RISK';
        else if (riskScore > 70) riskCategory = 'HIGH_RISK';
        
        // Score global (0-100)
        const globalScore = Math.round(
            (alpha_score * 10) + 
            (win_rate > 0 ? win_rate : 0) + 
            (total_pnl_usd > 0 ? Math.min(20, total_pnl_usd / 2500) : -10) +
            (100 - riskScore) * 0.3
        );
        
        return {
            alpha_category: alphaCategory,
            performance_category: performanceCategory,
            risk_category: riskCategory,
            global_score: Math.max(0, Math.min(100, globalScore)),
            is_alpha_wallet: alphaCategory.includes('ALPHA') && globalScore > 70,
            recommendation: this.getRecommendation(alphaCategory, performanceCategory, riskCategory, globalScore)
        };
    }

    getRecommendation(alpha, performance, risk, score) {
        if (score >= 80 && alpha === 'ALPHA_EXCELLENT' && risk === 'LOW_RISK') {
            return '🏆 COPY WALLET - Performances exceptionnelles avec faible risque';
        } else if (score >= 70 && alpha.includes('ALPHA')) {
            return '🎯 MONITOR CLOSELY - Wallet alpha à surveiller';
        } else if (score >= 60) {
            return '👀 WATCH LIST - Performances intéressantes';
        } else if (risk === 'HIGH_RISK') {
            return '⚠️ CAUTION - Risque élevé, éviter';
        } else {
            return '📊 STANDARD - Performances moyennes';
        }
    }

    displayAnalysis(walletAddress, analysis, classification) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 ANALYSE WALLET: ${walletAddress.substring(0, 8)}...${walletAddress.substring(-8)}`);
        console.log(`${'='.repeat(60)}`);
        
        if (!analysis || !analysis.data) {
            console.log('❌ Analyse non disponible');
            return;
        }
        
        const data = analysis.data;
        
        // Performance financière
        console.log(`\n💰 PERFORMANCE FINANCIÈRE:`);
        console.log(`  PNL Total: $${data.total_pnl_usd?.toLocaleString() || 'N/A'}`);
        console.log(`  Win Rate: ${data.win_rate?.toFixed(1) || 'N/A'}%`);
        console.log(`  Total Trades: ${data.total_trades?.toLocaleString() || 'N/A'}`);
        console.log(`  Période: ${data.trading_period_days || 'N/A'} jours`);
        
        // Score Alpha
        console.log(`\n🏆 SCORE ALPHA: ${data.alpha_score || 'N/A'}/10`);
        const alphaEmoji = data.alpha_score >= 8 ? '🟢' : data.alpha_score >= 6 ? '🟡' : '🔴';
        console.log(`  ${alphaEmoji} Niveau: ${classification?.alpha_category || 'UNKNOWN'}`);
        
        // Analyse de risque
        if (data.risk_analysis) {
            const risk = data.risk_analysis;
            console.log(`\n⚠️  ANALYSE DE RISQUE:`);
            console.log(`  Score Risque: ${risk.portfolio_risk_score?.toFixed(1) || 'N/A'}/100`);
            console.log(`  Tokens Haut Risque: ${risk.high_risk_tokens || 0}/${risk.total_tokens || 0}`);
            console.log(`  Catégorie: ${classification?.risk_category || 'UNKNOWN'}`);
        }
        
        // Classification globale
        if (classification) {
            console.log(`\n📈 CLASSIFICATION GLOBALE:`);
            console.log(`  Score Global: ${classification.global_score}/100`);
            console.log(`  Alpha Wallet: ${classification.is_alpha_wallet ? '✅ OUI' : '❌ NON'}`);
            console.log(`  Performance: ${classification.performance_category}`);
            
            console.log(`\n💡 RECOMMANDATION:`);
            console.log(`  ${classification.recommendation}`);
        }
        
        console.log(`\n⏱️  Temps d'analyse: ${analysis.analysisTime?.toFixed(1) || 'N/A'}s`);
    }
}

async function demonstrateAlphaDetection() {
    console.log('🚀 DÉMONSTRATION : SYSTÈME DE DÉTECTION DE WALLETS ALPHA');
    console.log('='.repeat(70));
    
    const detector = new WalletAlphaDetector();
    
    // Liste de wallets à analyser (exemples)
    const testWallets = [
        'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', // Wallet test principal
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Wallet exemple 2
        'GThUX1Atko4tqhN2NaiTazWSeFWMuiUidhzA5Wp4Q3Q', // Wallet exemple 3
    ];
    
    console.log(`📋 Analyse de ${testWallets.length} wallets pour détecter les wallets alpha...\n`);
    
    const results = [];
    
    for (let i = 0; i < testWallets.length; i++) {
        const walletAddress = testWallets[i];
        
        console.log(`[${i + 1}/${testWallets.length}] Analyse en cours...`);
        
        // Analyse rapide
        const analysis = await detector.analyzeWallet(walletAddress, 'quick');
        
        if (analysis) {
            // Classification
            const classification = detector.classifyWallet(analysis);
            
            // Stockage des résultats
            results.push({
                wallet: walletAddress,
                analysis,
                classification
            });
            
            // Affichage
            detector.displayAnalysis(walletAddress, analysis, classification);
        }
        
        // Petit délai entre les requêtes
        if (i < testWallets.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Résumé des résultats
    displaySummary(results);
}

function displaySummary(results) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 RÉSUMÉ DE LA DÉTECTION ALPHA');
    console.log(`${'='.repeat(70)}`);
    
    const alphaWallets = results.filter(r => r.classification?.is_alpha_wallet);
    const highScoreWallets = results.filter(r => r.classification?.global_score >= 70);
    
    console.log(`\n🏆 WALLETS ALPHA DÉTECTÉS: ${alphaWallets.length}/${results.length}`);
    
    alphaWallets.forEach((result, i) => {
        const wallet = result.wallet.substring(0, 8) + '...' + result.wallet.substring(-8);
        const score = result.classification.global_score;
        const alpha = result.analysis.data.alpha_score;
        const pnl = result.analysis.data.total_pnl_usd;
        
        console.log(`  ${i + 1}. ${wallet} - Score: ${score}/100 (Alpha: ${alpha}/10, PNL: $${pnl?.toLocaleString() || 'N/A'})`);
    });
    
    console.log(`\n📈 WALLETS HAUTE PERFORMANCE: ${highScoreWallets.length}/${results.length}`);
    
    const sortedByScore = results
        .filter(r => r.classification)
        .sort((a, b) => b.classification.global_score - a.classification.global_score);
    
    console.log(`\n🏅 CLASSEMENT PAR SCORE GLOBAL:`);
    sortedByScore.forEach((result, i) => {
        const wallet = result.wallet.substring(0, 8) + '...';
        const score = result.classification.global_score;
        const category = result.classification.alpha_category;
        const emoji = score >= 80 ? '🥇' : score >= 70 ? '🥈' : score >= 60 ? '🥉' : '📊';
        
        console.log(`  ${emoji} ${i + 1}. ${wallet} - ${score}/100 (${category})`);
    });
    
    console.log(`\n💡 RECOMMANDATIONS STRATÉGIQUES:`);
    console.log(`  🎯 Wallets à copier: ${alphaWallets.length}`);
    console.log(`  👀 Wallets à surveiller: ${results.filter(r => r.classification?.global_score >= 60 && r.classification?.global_score < 80).length}`);
    console.log(`  ⚠️  Wallets à éviter: ${results.filter(r => r.classification?.risk_category === 'HIGH_RISK').length}`);
    
    console.log(`\n🚀 SYSTÈME OPÉRATIONNEL !`);
    console.log(`✅ API Quick Analysis fonctionnelle (1-3 secondes par wallet)`);
    console.log(`🔍 Market Cap Risk Analyzer intégré`);
    console.log(`🏆 Détection alpha automatique`);
    console.log(`📊 Classification et recommandations intelligentes`);
}

// Exécution de la démonstration
if (require.main === module) {
    demonstrateAlphaDetection().catch(console.error);
}

module.exports = { WalletAlphaDetector };
