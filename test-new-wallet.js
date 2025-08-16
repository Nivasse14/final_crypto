#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function testNewWalletEnrichment() {
  // Nouveau wallet pour test
  const testWallet = 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUFqT3HQhW';
  
  console.log('🧪 TEST: Enrichissement d\'un nouveau wallet');
  console.log(`📍 Wallet: ${testWallet}`);
  console.log('');
  
  try {
    // 1. Vérifier si le wallet existe déjà
    console.log('1️⃣ Vérification existence en base...');
    const checkResponse = await fetch(`${API_BASE}/wallet-registry/get/${testWallet}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkResponse.ok) {
      const existingWallet = await checkResponse.json();
      if (existingWallet.success && existingWallet.data) {
        console.log(`✅ Wallet trouvé en base - Status: ${existingWallet.data.status}`);
        console.log(`📊 Score enrichi: ${existingWallet.data.enriched_analysis_score || 'N/A'}`);
        console.log(`🏦 Portfolio: ${existingWallet.data.enriched_portfolio_tokens || 0} tokens`);
        console.log('');
      }
    } else {
      console.log('❌ Wallet non trouvé en base');
    }
    
    // 2. Lancer l'enrichissement
    console.log('2️⃣ Lancement de l\'enrichissement...');
    const enrichResponse = await fetch(`${API_BASE}/cielo-api/complete/${testWallet}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    if (!enrichResponse.ok) {
      throw new Error(`HTTP ${enrichResponse.status}: ${await enrichResponse.text()}`);
    }
    
    const enrichedData = await enrichResponse.json();
    console.log('✅ Enrichissement terminé !');
    console.log('');
    
    // 3. Vérifier les métriques principales
    console.log('3️⃣ Métriques obtenues:');
    if (enrichedData.consolidated_metrics) {
      const metrics = enrichedData.consolidated_metrics;
      console.log(`📈 Win Rate: ${(metrics.winrate * 100).toFixed(1)}%`);
      console.log(`💰 Total PnL: $${metrics.total_pnl_usd?.toFixed(2) || '0'}`);
      console.log(`🎯 ROI: ${metrics.roi_percentage?.toFixed(1) || '0'}%`);
      console.log(`🏆 Alpha Score: ${metrics.alpha_score?.toFixed(1) || '0'}`);
      console.log(`📊 Portfolio: $${metrics.portfolio_value?.toFixed(2) || '0'} (${metrics.portfolio_tokens || 0} tokens)`);
      console.log(`⚠️  Risk: ${metrics.risk_level || 'unknown'}`);
    }
    
    // 4. Vérifier l'enrichissement DexScreener
    if (enrichedData.dexscreener_pnl) {
      console.log('');
      console.log('4️⃣ Enrichissement DexScreener:');
      const dexStats = enrichedData.dexscreener_pnl.enrichment_stats;
      console.log(`🔍 Tokens analysés: ${dexStats.total_tokens}/${dexStats.enriched_tokens} enrichis`);
      console.log(`💹 Score fiabilité moyen: ${dexStats.average_reliability_score?.toFixed(1) || '0'}`);
      console.log(`📊 Market caps: ${dexStats.tokens_with_market_cap} tokens`);
    }
    
    // 5. Vérifier la sauvegarde en base
    console.log('');
    console.log('5️⃣ Vérification sauvegarde...');
    const verifyResponse = await fetch(`${API_BASE}/wallet-registry/get/${testWallet}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const savedWallet = await verifyResponse.json();
      if (savedWallet.success && savedWallet.data) {
        console.log(`✅ Wallet sauvegardé - Status: ${savedWallet.data.status}`);
        console.log(`📅 Dernière mise à jour: ${savedWallet.data.updated_at}`);
        console.log(`🔧 Version processing: ${savedWallet.data.processing_version}`);
        
        // Vérifier les données complexes
        if (savedWallet.data.cielo_complete_data && Object.keys(savedWallet.data.cielo_complete_data).length > 0) {
          console.log('✅ Données complexes sauvegardées');
        } else {
          console.log('❌ Données complexes manquantes');
        }
      } else {
        console.log('❌ Erreur de récupération après sauvegarde');
      }
    }
    
    console.log('');
    console.log('🎉 TEST TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

// Lancer le test
testNewWalletEnrichment();
