#!/usr/bin/env node

/**
 * Inspection détaillée de la réponse API
 */

require('dotenv').config();

async function inspectAPIResponse() {
    console.log('🔍 INSPECTION DÉTAILLÉE DE L\'API RESPONSE\n');
    
    const apiUrl = process.env.API_BASE_URL + '/cielo-api';
    const authToken = process.env.SUPABASE_ANON_KEY;
    const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    
    try {
        const response = await fetch(`${apiUrl}/complete/${testWallet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            
            console.log('\n📊 RÉPONSE COMPLÈTE:');
            console.log('=' * 30);
            console.log(JSON.stringify(data, null, 2));
            
            console.log('\n🔍 ANALYSE:');
            console.log(`Type: ${typeof data}`);
            console.log(`Clés de niveau 1: ${Object.keys(data).join(', ')}`);
            
            if (data.data) {
                console.log(`Clés dans data: ${Object.keys(data.data).join(', ')}`);
                
                if (data.data.tokens) {
                    console.log(`Nombre de tokens: ${data.data.tokens.length}`);
                    
                    if (data.data.tokens.length > 0) {
                        console.log(`Premier token: ${JSON.stringify(data.data.tokens[0], null, 2)}`);
                    }
                }
            }
            
        } else {
            console.log(`Erreur: ${response.status}`);
            const text = await response.text();
            console.log(`Détails: ${text}`);
        }
        
    } catch (err) {
        console.log(`Erreur: ${err.message}`);
    }
}

if (require.main === module) {
    inspectAPIResponse().catch(console.error);
}
