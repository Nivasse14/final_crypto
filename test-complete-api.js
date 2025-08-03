#!/usr/bin/env node

/**
 * Test de la nouvelle API Complete Analysis avec gestion des jobs
 */

require('dotenv').config();

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function testCompleteAnalysis() {
    console.log('🔍 TEST: API Complete Analysis (5-10 minutes)');
    console.log('='.repeat(50));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    
    console.log(`👛 Wallet à analyser: ${walletAddress}`);
    console.log(`🚀 Lancement de l'analyse complète...\n`);
    
    try {
        // 1. DÉMARRER L'ANALYSE COMPLÈTE
        console.log('📡 Étape 1: Démarrage de l\'analyse...');
        
        const startResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/complete/${walletAddress}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status: ${startResponse.status}`);
        
        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.log(`❌ Erreur: ${errorText}`);
            
            if (errorText.includes('analysis_jobs')) {
                console.log('\n🔧 SOLUTION: La table analysis_jobs n\'existe pas encore.');
                console.log('Créez-la avec le script SQL suivant dans Supabase Dashboard:\n');
                console.log('```sql');
                console.log('-- Copiez le contenu de create-analysis-jobs-table.sql');
                console.log('CREATE TABLE analysis_jobs (');
                console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
                console.log('    wallet_address VARCHAR(100) NOT NULL,');
                console.log('    status VARCHAR(20) NOT NULL,');
                console.log('    analysis_type VARCHAR(20) NOT NULL,');
                console.log('    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
                console.log('    progress_percentage INTEGER DEFAULT 0,');
                console.log('    current_step TEXT DEFAULT \'Initializing...\',');
                console.log('    results JSONB');
                console.log(');');
                console.log('```\n');
            }
            
            return;
        }
        
        const jobData = await startResponse.json();
        console.log(`✅ Job créé avec succès !`);
        console.log(`🆔 Job ID: ${jobData.job_id}`);
        console.log(`⏱️  Durée estimée: ${jobData.estimated_duration}`);
        console.log(`📍 Endpoint de suivi: ${jobData.status_endpoint}`);
        
        // 2. SUIVRE LE PROGRÈS
        console.log('\n📊 Étape 2: Suivi du progrès...');
        console.log('-'.repeat(40));
        
        const jobId = jobData.job_id;
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes max
        
        while (attempts < maxAttempts) {
            // Attendre 5 secondes
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            try {
                const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/status/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!statusResponse.ok) {
                    const statusError = await statusResponse.text();
                    console.log(`❌ Erreur status: ${statusError}`);
                    break;
                }
                
                const job = await statusResponse.json();
                
                // Barre de progression
                const progressBar = '█'.repeat(Math.floor(job.progress_percentage / 5)) + 
                                   '░'.repeat(20 - Math.floor(job.progress_percentage / 5));
                
                console.log(`[${progressBar}] ${job.progress_percentage}% - ${job.current_step}`);
                
                // Vérifier le statut
                if (job.status === 'completed') {
                    console.log('\n🎉 ANALYSE TERMINÉE !');
                    console.log('='.repeat(30));
                    
                    if (job.results) {
                        displayResults(job.results);
                    }
                    
                    return job;
                    
                } else if (job.status === 'failed') {
                    console.log('\n❌ ANALYSE ÉCHOUÉE !');
                    console.log(`💥 Erreur: ${job.error_message}`);
                    return;
                }
                
                attempts++;
                
            } catch (error) {
                console.log(`⚠️  Erreur suivi: ${error.message}`);
                attempts++;
            }
        }
        
        console.log('\n⏰ TIMEOUT: Analyse trop longue (>10 minutes)');
        
    } catch (error) {
        console.error('\n💥 Erreur générale:', error.message);
    }
}

function displayResults(results) {
    console.log(`📊 TYPE: ${results.analysis_type}`);
    console.log(`👛 WALLET: ${results.wallet_address}`);
    console.log(`🕐 GÉNÉRÉ: ${results.generated_at}`);
    
    if (results.data) {
        const data = results.data;
        
        if (data.trade_analysis) {
            console.log(`\n💹 ANALYSE DES TRADES:`);
            console.log(`  Total trades: ${data.trade_analysis.total_trades}`);
            console.log(`  Trades profitables: ${data.trade_analysis.profitable_trades}`);
            console.log(`  Trades perdants: ${data.trade_analysis.losing_trades}`);
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
            console.log(`  Score timing sortie: ${data.alpha_analysis.exit_timing_score}/10`);
            console.log(`  Score gestion risque: ${data.alpha_analysis.risk_management_score}/10`);
        }
    }
}

async function quickTest() {
    console.log('🚀 TEST RAPIDE: API Quick Analysis');
    console.log('='.repeat(40));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    
    try {
        const startTime = Date.now();
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/quick/${walletAddress}`, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const duration = (Date.now() - startTime) / 1000;
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API Quick fonctionne (${duration.toFixed(1)}s)`);
            console.log(`🏆 Score Alpha: ${data.data.alpha_score}/10`);
            console.log(`⚠️  Risque: ${data.data.risk_analysis?.portfolio_risk_score?.toFixed(1)}/100`);
        } else {
            console.log(`❌ API Quick error: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`❌ Erreur Quick: ${error.message}`);
    }
}

async function main() {
    console.log('🧪 TEST DE L\'API COMPLETE ANALYSIS');
    console.log('='.repeat(50));
    
    // Test rapide d'abord
    await quickTest();
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 L\'API Complete Analysis nécessite la table analysis_jobs');
    console.log('   Si elle n\'existe pas, créez-la avec create-analysis-jobs-table.sql');
    console.log('='.repeat(50) + '\n');
    
    // Test de l'API complete
    await testCompleteAnalysis();
}

if (require.main === module) {
    main();
}

module.exports = { testCompleteAnalysis, quickTest };
