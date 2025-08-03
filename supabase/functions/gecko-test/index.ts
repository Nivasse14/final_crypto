// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

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
    console.log(`✅ Success! Data received for: ${data.data.attributes.name} (${data.data.attributes.symbol})`);
    
    return {
      success: true,
      token: data.data.attributes.name,
      symbol: data.data.attributes.symbol,
      price: data.data.attributes.price_usd,
      fdv: data.data.attributes.fdv_usd
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const result = await testGeckoEnrichment();
    
    return new Response(JSON.stringify({
      test: 'gecko-enrichment',
      timestamp: new Date().toISOString(),
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
