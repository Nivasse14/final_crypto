#!/usr/bin/env node

/**
 * Test rapide de l'API wallet-analyzer
 */

require('dotenv').config();

async function testQuickAPI() {
    console.log('🚀 TEST RAPIDE API WALLET-ANALYZER\n');
    
    const apiUrl = process.env.API_BASE_URL + '/wallet-analyzer';
    const authToken = process.env.SUPABASE_ANON_KEY;
    const testWallet = "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH";
    
    console.log(`🔍 Test analyse rapide pour: ${testWallet}`);
    console.log(`📡 Endpoint: /quick/${testWallet}\n`);
    
    try {
        const response = await fetch(`${apiUrl}/quick/${testWallet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ ANALYSE RAPIDE RÉUSSIE:');
            console.log(`   • Wallet: ${data.wallet_address}`);
            console.log(`   • Type: ${data.analysis_type}`);
            console.log(`   • Total trades: ${data.total_trades}`);
            console.log(`   • Win rate: ${data.win_rate?.toFixed(1)}%`);
            console.log(`   • PnL total: $${data.total_pnl_usd?.toLocaleString()}`);
            console.log(`   • Volume total: $${data.total_volume_usd?.toLocaleString()}`);
            console.log(`   • Alpha score: ${data.alpha_score?.toFixed(1)}/10`);
            
            if (data.recent_tokens) {
                console.log(`\n💎 Tokens récents (${data.recent_tokens.length}):`);
                data.recent_tokens.forEach((token, i) => {
                    console.log(`   ${i+1}. ${token.symbol}: MC $${token.market_cap?.toLocaleString()}`);
                });
            }
            
        } else {
            const errorText = await response.text();
            console.log(`\n❌ ERREUR API: ${response.status} - ${errorText}`);
        }
        
    } catch (err) {
        console.log(`\n❌ ERREUR RÉSEAU: ${err.message}`);
    }
}

async function testCompleteAPIJob() {
    console.log('\n🔥 TEST ANALYSE COMPLÈTE (JOB)');
    console.log('===============================\n');
    
    const apiUrl = process.env.API_BASE_URL + '/wallet-analyzer';
    const authToken = process.env.SUPABASE_ANON_KEY;
    const testWallet = "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH";
    
    try {
        // Lancer l'analyse complète (POST)
        console.log('📤 Lancement de l\'analyse complète...');
        const startResponse = await fetch(`${apiUrl}/complete/${testWallet}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (startResponse.ok) {
            const jobData = await startResponse.json();
            console.log(`✅ Job créé: ${jobData.job_id}`);
            console.log(`⏱️ Durée estimée: ${jobData.estimated_duration}`);
            console.log(`📊 Statut endpoint: ${jobData.status_endpoint}\n`);
            
            // Attendre un peu puis vérifier le statut
            console.log('⏳ Attente de 10 secondes puis vérification du statut...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const statusResponse = await fetch(`${apiUrl}/status/${jobData.job_id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (statusResponse.ok) {
                const status = await statusResponse.json();
                console.log(`📈 Status: ${status.status}`);
                console.log(`📊 Progress: ${status.progress_percentage}%`);
                console.log(`📝 Current step: ${status.current_step}`);
                
                if (status.status === 'completed' && status.results) {
                    console.log('\n🎉 ANALYSE TERMINÉE ! Quelques résultats:');
                    const results = status.results;
                    console.log(`   • Wallet: ${results.wallet_address}`);
                    console.log(`   • Type: ${results.analysis_type}`);
                    console.log(`   • Généré: ${results.generated_at}`);
                    console.log(`   • Données disponibles: ${Object.keys(results.data || {}).join(', ')}`);
                }
            }
            
        } else {
            const errorText = await startResponse.text();
            console.log(`❌ Erreur lancement job: ${startResponse.status} - ${errorText}`);
        }
        
    } catch (err) {
        console.log(`❌ Erreur job test: ${err.message}`);
    }
}

async function testHealth() {
    console.log('\n🏥 TEST HEALTH CHECK');
    console.log('====================\n');
    
    const apiUrl = process.env.API_BASE_URL + '/wallet-analyzer';
    const authToken = process.env.SUPABASE_ANON_KEY;
    
    try {
        const response = await fetch(`${apiUrl}/health`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const health = await response.json();
            console.log('✅ Service disponible:');
            console.log(`   • Status: ${health.status}`);
            console.log(`   • Timestamp: ${health.timestamp}`);
            console.log(`   • Supabase: ${health.services?.supabase}`);
            console.log(`   • GeckoTerminal: ${health.services?.geckoterminal}`);
            console.log(`   • Blockchain data: ${health.services?.blockchain_data}`);
        } else {
            console.log(`❌ Health check failed: ${response.status}`);
        }
    } catch (err) {
        console.log(`❌ Health check error: ${err.message}`);
    }
}

async function main() {
    await testHealth();
    await testQuickAPI();
    await testCompleteAPIJob();
    
    console.log('\n🎯 RÉSUMÉ:');
    console.log('- Health check: vérifier la disponibilité du service');
    console.log('- Quick analysis: analyse rapide immédiate');
    console.log('- Complete analysis: analyse complète en background');
    console.log('- Status check: suivi de progression des jobs');
}

main().catch(console.error);
