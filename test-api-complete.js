#!/usr/bin/env node

/**
 * Test de l'API "complete" déployée sur Supabase
 * Vérifie que l'Edge Function cielo-api fonctionne
 */

require('dotenv').config();

async function testCompleteAPI() {
    console.log('🧪 TEST DE L\'API "COMPLETE" SUR SUPABASE\n');
    console.log('=' * 50);
    
    const apiUrl = process.env.API_BASE_URL + '/cielo-api';
    const authToken = process.env.SUPABASE_ANON_KEY;
    
    console.log(`📡 URL API: ${apiUrl}`);
    console.log(`🔑 Token: ${authToken ? 'Configuré' : 'Manquant'}\n`);
    
    // Test 1: Health check
    console.log('🔍 TEST 1: Health Check...');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                action: 'health',
                test: true 
            })
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.text();
            console.log(`   ✅ Réponse: ${data}`);
        } else {
            console.log(`   ❌ Erreur: ${response.statusText}`);
        }
    } catch (err) {
        console.log(`   ❌ Erreur réseau: ${err.message}`);
    }
    
    // Test 2: API complete avec un wallet exemple
    console.log('\n🔍 TEST 2: API Complete avec wallet...');
    try {
        const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                action: 'complete',
                wallet_address: testWallet,
                include_analysis: true
            })
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Données reçues: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
            
            if (data.tokens && data.tokens.length > 0) {
                console.log(`   📊 Tokens trouvés: ${data.tokens.length}`);
                console.log(`   💰 Premier token: ${data.tokens[0].token_symbol || 'N/A'}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Erreur: ${errorText}`);
        }
    } catch (err) {
        console.log(`   ❌ Erreur réseau: ${err.message}`);
    }
    
    // Test 3: Vérification des endpoints disponibles
    console.log('\n🔍 TEST 3: Endpoints disponibles...');
    const endpoints = [
        { action: 'ping' },
        { action: 'status' },
        { action: 'version' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(endpoint)
            });
            
            console.log(`   ${endpoint.action}: Status ${response.status}`);
        } catch (err) {
            console.log(`   ${endpoint.action}: Erreur ${err.message}`);
        }
    }
    
    console.log('\n' + '=' * 50);
    console.log('📋 RÉSUMÉ:');
    console.log('• Si Status 200: API fonctionnelle ✅');
    console.log('• Si Status 404: Edge Function non trouvée ❌');
    console.log('• Si Status 401: Problème d\'authentification ❌');
    console.log('• Si Status 500: Erreur serveur ❌');
    
    console.log('\n💡 POUR APPELER L\'API COMPLETE:');
    console.log(`curl -X POST "${apiUrl}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${authToken}" \\`);
    console.log(`  -d '{"action": "complete", "wallet_address": "WALLET_ADDRESS_HERE"}'`);
}

// Test direct avec fetch simple
async function testSimpleCall() {
    console.log('\n🔧 TEST SIMPLE DIRECT...\n');
    
    const url = process.env.API_BASE_URL + '/cielo-api';
    
    try {
        const response = await fetch(url, {
            method: 'GET'
        });
        
        console.log(`GET ${url}: ${response.status}`);
        
        if (response.ok) {
            const text = await response.text();
            console.log(`Réponse: ${text.substring(0, 200)}...`);
        }
    } catch (err) {
        console.log(`Erreur GET: ${err.message}`);
    }
}

if (require.main === module) {
    testCompleteAPI()
        .then(() => testSimpleCall())
        .catch(console.error);
}
