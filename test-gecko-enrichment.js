#!/usr/bin/env node

async function testGeckoEnrichment() {
  const tokenAddress = "25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk";
  const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${tokenAddress}`;
  
  console.log(`🔍 Testing Gecko API: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success! Data received:`);
    console.log(`- Token: ${data.data.attributes.name} (${data.data.attributes.symbol})`);
    console.log(`- Price: $${data.data.attributes.price_usd}`);
    console.log(`- FDV: $${data.data.attributes.fdv_usd}`);
    console.log(`- Market Cap: $${data.data.attributes.market_cap_usd || 'N/A'}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testGeckoEnrichment();
