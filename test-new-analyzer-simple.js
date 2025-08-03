// Version simplifiée pour tester sans la table analysis_jobs
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

async function testQuickAnalysis() {
    console.log('\n🚀 TEST: Nouvelle API Quick Analysis');
    console.log('='.repeat(50));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    
    try {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/wallet-analyzer/quick/${walletAddress}`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const duration = (Date.now() - startTime) / 1000;
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Status: ${response.status}`);
            console.log(`❌ Error: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Analyse terminée en ${duration.toFixed(1)} secondes`);
        console.log(`📊 Type d'analyse: ${data.analysis_type}`);
        console.log(`👛 Wallet: ${data.wallet_address}`);
        console.log(`🕐 Généré à: ${data.generated_at}`);
        
        if (data.data) {
            const walletData = data.data;
            console.log(`\n💰 PERFORMANCE FINANCIÈRE:`);
            console.log(`  PNL Total: $${walletData.total_pnl_usd?.toFixed(2) || 'N/A'}`);
            console.log(`  Win Rate: ${walletData.win_rate?.toFixed(1) || 'N/A'}%`);
            console.log(`  Total Trades: ${walletData.total_trades || 'N/A'}`);
            console.log(`  Période: ${walletData.trading_period_days || 'N/A'} jours`);
            
            console.log(`\n📈 PORTFOLIO ACTUEL:`);
            console.log(`  Holdings: ${walletData.current_holdings?.length || 0} tokens`);
            
            if (walletData.current_holdings?.length > 0) {
                console.log(`  Top 3 holdings:`);
                walletData.current_holdings.slice(0, 3).forEach((token, i) => {
                    console.log(`    ${i+1}. ${token.symbol}: $${token.value_usd?.toFixed(2) || 'N/A'} (MC: $${(token.market_cap || 0).toLocaleString()})`);
                });
            }
            
            if (walletData.alpha_score) {
                console.log(`\n🏆 SCORE ALPHA: ${walletData.alpha_score}/10`);
                let category = 'Standard';
                if (walletData.alpha_score >= 8) category = 'Excellent (Alpha Wallet)';
                else if (walletData.alpha_score >= 6) category = 'Bon (Potentiel Alpha)';
                else if (walletData.alpha_score >= 4) category = 'Moyen';
                console.log(`  Catégorie: ${category}`);
            }
            
            if (walletData.risk_analysis) {
                const risk = walletData.risk_analysis;
                console.log(`\n⚠️  ANALYSE DE RISQUE:`);
                console.log(`  Score de risque portfolio: ${risk.portfolio_risk_score?.toFixed(1) || 'N/A'}/100`);
                console.log(`  Tokens à haut risque: ${risk.high_risk_tokens || 0}/${risk.total_tokens || 0}`);
                console.log(`  Valeur totale: $${risk.total_value_usd?.toFixed(2) || 'N/A'}`);
                
                if (risk.recommendations) {
                    console.log(`  🔴 Sorties immédiates: ${risk.recommendations.immediate_exits || 0}`);
                    console.log(`  🟡 Réductions positions: ${risk.recommendations.position_reductions || 0}`);
                    console.log(`  👀 Surveillance étroite: ${risk.recommendations.monitor_closely || 0}`);
                }
            }
        }
        
        console.log(`\n📝 ${data.note}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Erreur test quick analysis:', error.message);
        throw error;
    }
}

async function testHealthCheck() {
    console.log('\n🏥 TEST: Health Check');
    console.log('='.repeat(30));
    
    try {
        const response = await fetch(`${BASE_URL}/wallet-analyzer/health`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const health = await response.json();
        
        console.log(`✅ Status: ${health.status}`);
        console.log(`🕐 Timestamp: ${health.timestamp}`);
        console.log(`📊 Services:`);
        
        Object.entries(health.services).forEach(([service, status]) => {
            const icon = status === 'connected' || status === 'available' ? '✅' : 
                         status === 'simulated' ? '🎭' : '⚠️';
            console.log(`  ${icon} ${service}: ${status}`);
        });
        
        return health;
        
    } catch (error) {
        console.error('❌ Erreur health check:', error.message);
        throw error;
    }
}

async function demonstrateCompleteAPI() {
    console.log('\n🔍 DÉMO: API Complete Analysis (Non disponible sans table analysis_jobs)');
    console.log('='.repeat(70));
    
    console.log('📋 L\'API Complete Analysis nécessite la table analysis_jobs pour fonctionner.');
    console.log('   Une fois la table créée, elle permettra:');
    console.log('');
    console.log('🚀 FONCTIONNALITÉS COMPLÈTES:');
    console.log('  • Analyse blockchain réelle (5-10 minutes)');
    console.log('  • Suivi de progression en temps réel');
    console.log('  • Métriques financières avancées (Sharpe ratio, etc.)');
    console.log('  • Score alpha précis basé sur des données réelles');
    console.log('  • Recommandations d\'investissement détaillées');
    console.log('');
    console.log('📊 ENDPOINTS DISPONIBLES APRÈS SETUP:');
    console.log(`  POST ${BASE_URL}/wallet-analyzer/complete/{wallet_address}`);
    console.log(`  GET  ${BASE_URL}/wallet-analyzer/status/{job_id}`);
    console.log('');
    console.log('🔧 POUR ACTIVER: Créer la table analysis_jobs dans Supabase Dashboard');
}

async function compareWithOldAPI() {
    console.log('\n🔄 COMPARAISON: Ancienne vs Nouvelle API');
    console.log('='.repeat(50));
    
    // Test ancienne API
    console.log('🔴 Test ancienne API (/cielo-api/complete)...');
    try {
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}/cielo-api/complete/HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const oldDuration = (Date.now() - startTime) / 1000;
        const oldData = await response.json();
        
        console.log(`  ✅ Durée: ${oldDuration.toFixed(1)}s`);
        console.log(`  📊 Type: Données principalement mockées`);
        console.log(`  🎯 PNL: $${oldData.data?.summary?.total_pnl_usd?.toFixed(2) || 'N/A'}`);
        console.log(`  🏆 Analyse risque: ❌ Non disponible`);
        console.log(`  🔍 Score alpha: ❌ Non disponible`);
        
    } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
    }
    
    // Test nouvelle API
    console.log('\n🟢 Test nouvelle API (/wallet-analyzer/quick)...');
    try {
        await testQuickAnalysis();
        
        console.log('\n📋 AVANTAGES NOUVELLE API:');
        console.log('  ✅ Analyse de risque intégrée');
        console.log('  ✅ Score alpha automatique');
        console.log('  ✅ Recommandations d\'action');
        console.log('  ✅ Structure de données améliorée');
        console.log('  ✅ Gestion des analyses longues (API complete)');
        
    } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
    }
}

async function runTests() {
    console.log('🧪 TESTS DE LA NOUVELLE API WALLET ANALYZER');
    console.log('='.repeat(60));
    
    try {
        // Health check
        await testHealthCheck();
        
        // Test principal
        await testQuickAnalysis();
        
        // Comparaison
        await compareWithOldAPI();
        
        // Démo API complete
        await demonstrateCompleteAPI();
        
        console.log('\n🎉 TESTS RÉUSSIS !');
        console.log('\n📋 PROCHAINES ÉTAPES:');
        console.log('  1. Créer la table analysis_jobs dans Supabase Dashboard');
        console.log('  2. Tester l\'API complete analysis');
        console.log('  3. Migrer les applications vers les nouvelles APIs');
        
    } catch (error) {
        console.error('\n💥 Erreur dans les tests:', error.message);
    }
}

// Exécution
if (require.main === module) {
    runTests();
}

module.exports = {
    testQuickAnalysis,
    testHealthCheck,
    demonstrateCompleteAPI
};
