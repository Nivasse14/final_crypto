// Test de la nouvelle API d'analyse avec gestion des jobs
const SUPABASE_URL = 'https://qpqwafqznpmrscmjlgla.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcXdhZnF6bnBtcnNjbWpsZ2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwOTgzMzUsImV4cCI6MjA1MTY3NDMzNX0.T_Jz8Rb7SfPbadl2WkOzCH0zNP6fO0MBlKSjR9QwgPU';

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

async function testQuickAnalysis() {
    console.log('\n🚀 TEST: Analyse rapide (30 secondes)');
    console.log('='.repeat(50));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'; // Wallet Solana réel
    
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
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Analyse rapide terminée en ${duration.toFixed(1)}s`);
        console.log(`📊 Type: ${data.analysis_type}`);
        console.log(`👛 Wallet: ${data.wallet_address}`);
        console.log(`💰 PNL: $${data.data.total_pnl_usd?.toFixed(2) || 'N/A'}`);
        console.log(`🎯 Win Rate: ${data.data.win_rate?.toFixed(1) || 'N/A'}%`);
        console.log(`🏆 Alpha Score: ${data.data.alpha_score || 'N/A'}/10`);
        console.log(`📈 Holdings: ${data.data.current_holdings?.length || 0} tokens`);
        
        if (data.data.risk_analysis) {
            console.log(`⚠️  Portfolio Risk: ${data.data.risk_analysis.portfolio_risk_score?.toFixed(1) || 'N/A'}/100`);
            console.log(`🔴 High Risk Tokens: ${data.data.risk_analysis.high_risk_tokens || 0}`);
        }
        
        console.log(`📝 Note: ${data.note}`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Erreur analyse rapide:', error.message);
        throw error;
    }
}

async function testCompleteAnalysis() {
    console.log('\n🔍 TEST: Analyse complète (5-10 minutes)');
    console.log('='.repeat(50));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    
    try {
        // 1. Lancer l'analyse
        console.log('🚀 Lancement de l\'analyse complète...');
        
        const response = await fetch(`${BASE_URL}/wallet-analyzer/complete/${walletAddress}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const jobData = await response.json();
        console.log(`✅ Job créé: ${jobData.job_id}`);
        console.log(`⏱️  Durée estimée: ${jobData.estimated_duration}`);
        console.log(`📍 Endpoint de suivi: ${jobData.status_endpoint}`);
        
        // 2. Suivre le progrès
        const jobId = jobData.job_id;
        return await followJobProgress(jobId);
        
    } catch (error) {
        console.error('❌ Erreur analyse complète:', error.message);
        throw error;
    }
}

async function followJobProgress(jobId) {
    console.log(`\n👀 Suivi du job ${jobId}...`);
    
    let attempts = 0;
    const maxAttempts = 120; // 120 * 5s = 10 minutes max
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${BASE_URL}/wallet-analyzer/status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            
            const job = await response.json();
            
            // Affichage du progrès
            const progressBar = '█'.repeat(Math.floor(job.progress_percentage / 5)) + 
                               '░'.repeat(20 - Math.floor(job.progress_percentage / 5));
            
            console.log(`[${progressBar}] ${job.progress_percentage}% - ${job.current_step}`);
            
            // Vérifier le statut
            if (job.status === 'completed') {
                console.log('\n✅ Analyse complète terminée !');
                console.log(`⏱️  Durée totale: ${calculateDuration(job.started_at, job.completed_at)}`);
                
                if (job.results) {
                    displayCompleteResults(job.results);
                }
                
                return job;
            } else if (job.status === 'failed') {
                console.log('\n❌ Analyse échouée !');
                console.log(`💥 Erreur: ${job.error_message}`);
                throw new Error(`Job failed: ${job.error_message}`);
            }
            
            // Attendre 5 secondes avant le prochain check
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
            
        } catch (error) {
            console.error(`❌ Erreur suivi job: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }
    }
    
    throw new Error('Timeout: analyse trop longue (>10 minutes)');
}

function displayCompleteResults(results) {
    console.log('\n📊 RÉSULTATS DE L\'ANALYSE COMPLÈTE');
    console.log('='.repeat(50));
    
    console.log(`📈 Type: ${results.analysis_type}`);
    console.log(`👛 Wallet: ${results.wallet_address}`);
    console.log(`🕐 Généré: ${results.generated_at}`);
    
    if (results.data) {
        const data = results.data;
        
        if (data.trade_analysis) {
            console.log(`\n💹 ANALYSE DES TRADES:`);
            console.log(`  Total trades: ${data.trade_analysis.total_trades}`);
            console.log(`  Profitable: ${data.trade_analysis.profitable_trades}`);
            console.log(`  Perdants: ${data.trade_analysis.losing_trades}`);
            console.log(`  Profit moyen: $${data.trade_analysis.average_profit_per_trade}`);
        }
        
        if (data.advanced_metrics) {
            console.log(`\n📏 MÉTRIQUES AVANCÉES:`);
            console.log(`  Sharpe Ratio: ${data.advanced_metrics.sharpe_ratio}`);
            console.log(`  Max Drawdown: ${data.advanced_metrics.max_drawdown}%`);
            console.log(`  Win Rate: ${data.advanced_metrics.win_rate}%`);
            console.log(`  Profit Factor: ${data.advanced_metrics.profit_factor}`);
        }
        
        if (data.alpha_analysis) {
            console.log(`\n🏆 ANALYSE ALPHA:`);
            console.log(`  Score Alpha: ${data.alpha_analysis.alpha_score}/10`);
            console.log(`  Catégorie: ${data.alpha_analysis.alpha_category}`);
            console.log(`  Détection précoce: ${data.alpha_analysis.early_detection_ability}`);
            console.log(`  Timing de sortie: ${data.alpha_analysis.exit_timing_score}/10`);
            console.log(`  Gestion risque: ${data.alpha_analysis.risk_management_score}/10`);
        }
    }
}

function calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
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
            const icon = status === 'connected' || status === 'available' ? '✅' : '⚠️';
            console.log(`  ${icon} ${service}: ${status}`);
        });
        
        return health;
        
    } catch (error) {
        console.error('❌ Erreur health check:', error.message);
        throw error;
    }
}

async function runAllTests() {
    console.log('🧪 TESTS DE LA NOUVELLE API WALLET ANALYZER');
    console.log('='.repeat(60));
    
    try {
        // 1. Health check
        await testHealthCheck();
        
        // 2. Analyse rapide
        await testQuickAnalysis();
        
        // 3. Demander confirmation pour l'analyse complète
        console.log('\n❓ Voulez-vous tester l\'analyse complète (5-10 minutes) ?');
        console.log('   (Tapez Ctrl+C pour annuler, ou attendez 10 secondes pour continuer)');
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 10000); // 10 secondes
            
            process.on('SIGINT', () => {
                clearTimeout(timeout);
                reject(new Error('Test annulé par l\'utilisateur'));
            });
        });
        
        // 4. Analyse complète
        await testCompleteAnalysis();
        
        console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
        
    } catch (error) {
        if (error.message.includes('annulé')) {
            console.log('\n⏸️  Tests partiels terminés (analyse complète annulée)');
        } else {
            console.error('\n💥 Erreur dans les tests:', error.message);
        }
    }
}

// Exécution
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testQuickAnalysis,
    testCompleteAnalysis,
    testHealthCheck,
    followJobProgress
};
