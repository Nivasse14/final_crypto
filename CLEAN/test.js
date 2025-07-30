#!/usr/bin/env node

// TEST SIMPLE DE L'API SUPABASE
const axios = require('axios');

async function testAPI() {
    console.log('🧪 TEST API SUPABASE');
    console.log('===================\n');
    
    const wallet = '2bdcq3CfFZfZ5e5RNMv4w3nTFHGzyJEM1cuFf8E4AQth';
    const url = `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${wallet}`;
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';
    
    try {
        console.log('📡 Test de l\'API...');
        const start = Date.now();
        
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${key}` },
            timeout: 30000
        });
        
        const duration = Date.now() - start;
        const data = response.data.data;
        
        console.log(`✅ SUCCÈS en ${duration}ms !`);
        console.log(`📊 Portfolio: ${data.portfolio?.data?.portfolio?.length || 0} tokens`);
        console.log(`💰 Valeur: $${data.summary?.current_portfolio_value?.toLocaleString() || 'N/A'}`);
        console.log(`📈 PNL: $${data.summary?.total_pnl_usd?.toLocaleString() || 'N/A'}`);
        console.log(`🎯 Win rate: ${data.summary?.winrate?.toFixed(1) || 'N/A'}%`);
        
        console.log('\n🎉 L\'API FONCTIONNE !');
        console.log('💡 Il ne reste qu\'à corriger le schéma DB');
        
    } catch (error) {
        console.log(`❌ ERREUR: ${error.message}`);
    }
}

testAPI();
