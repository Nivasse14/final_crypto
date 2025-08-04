// Test local du serveur de scraping
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'default-token';

async function testServer() {
  console.log('🧪 Test du serveur de scraping...\n');

  try {
    // 1. Test health check
    console.log('1️⃣ Test Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    console.log('');

    // 2. Démarrer un job de test
    console.log('2️⃣ Démarrage job de scraping...');
    const jobId = `test_${Date.now()}`;
    
    const startResponse = await fetch(`${BASE_URL}/api/start-scraping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        jobId: jobId,
        url: 'https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3',
        callback_url: null // Pas de webhook pour le test
      })
    });

    const startData = await startResponse.json();
    console.log('✅ Job démarré:', startData);
    console.log('');

    // 3. Vérifier le statut périodiquement
    console.log('3️⃣ Surveillance du statut...');
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 secondes
      
      const statusResponse = await fetch(`${BASE_URL}/api/job-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log(`📊 Statut (${++attempts}/60):`, {
        status: statusData.status,
        current_page: statusData.current_page || 0,
        total_pages: statusData.total_pages || 'unknown',
        wallets_count: statusData.wallets_count || 0
      });

      if (statusData.status === 'completed') {
        console.log('✅ Job terminé avec succès!');
        console.log(`🎯 Résultats: ${statusData.wallets_count} wallets récupérés`);
        break;
      }

      if (statusData.status === 'failed') {
        console.log('❌ Job échoué:', statusData.error);
        break;
      }
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ Timeout: Job trop long');
    }

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testServer();
}

module.exports = { testServer };
