import fetch from 'node-fetch';

// Test de nos améliorations de headers tRPC directement
const CIELO_BASE_URL = 'https://app.cielo.finance';

const getCieloHeaders = () => ({
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://app.cielo.finance/',
  'Origin': 'https://app.cielo.finance',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"'
});

async function testImprovedHeaders() {
  console.log('🧪 Test des headers améliorés pour Cielo tRPC');
  
  const walletAddress = 'CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy';
  
  // Test 1: Portfolio avec headers améliorés
  console.log('\n1️⃣ Test Portfolio avec headers améliorés...');
  try {
    const proceduresList = 'profile.getWalletPortfolio';
    const inputParams = new URLSearchParams();
    inputParams.append('batch', '1');
    
    const encodedInputs = {
      "0": { json: { wallet: walletAddress } }
    };
    inputParams.append('input', JSON.stringify(encodedInputs));
    
    const url = `${CIELO_BASE_URL}/api/trpc/${proceduresList}?${inputParams.toString()}`;
    console.log(`📡 URL: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getCieloHeaders()
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Response length: ${JSON.stringify(data).length} chars`);
      
      if (data[0]?.result?.data?.portfolio) {
        console.log(`   Portfolio tokens: ${data[0].result.data.portfolio.length}`);
        const firstTokens = data[0].result.data.portfolio.slice(0, 3);
        firstTokens.forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || 'Unknown'} - Balance: ${token.balance}`);
        });
      } else {
        console.log(`   Pas de portfolio dans la réponse`);
        console.log(`   Structure:`, Object.keys(data[0]?.result?.data || {}));
      }
    } else {
      console.log(`❌ Error: ${response.status}`);
      
      if (response.status === 403) {
        console.log(`🔍 Trying with minimal headers...`);
        
        // Test avec headers minimaux
        const minimalResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://app.cielo.finance/'
          }
        });
        
        console.log(`   Minimal headers result: ${minimalResponse.status}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }

  // Test 2: PnL avec headers améliorés  
  console.log('\n2️⃣ Test PnL avec headers améliorés...');
  try {
    const proceduresList = 'profile.fetchTokenPnlFast';
    const inputParams = new URLSearchParams();
    inputParams.append('batch', '1');
    
    const encodedInputs = {
      "0": { 
        json: { 
          wallet: walletAddress,
          chains: '',
          timeframe: 'max',
          sortBy: '',
          page: '1',
          tokenFilter: ''
        } 
      }
    };
    inputParams.append('input', JSON.stringify(encodedInputs));
    
    const url = `${CIELO_BASE_URL}/api/trpc/${proceduresList}?${inputParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getCieloHeaders()
    });
    
    console.log(`📊 PnL Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ PnL Success! Response length: ${JSON.stringify(data).length} chars`);
      
      // Chercher les tokens dans différentes structures
      let tokens = null;
      if (data[0]?.result?.data?.json?.data?.tokens) {
        tokens = data[0].result.data.json.data.tokens;
        console.log(`   PnL tokens (json structure): ${tokens.length}`);
      } else if (data[0]?.result?.data?.tokens) {
        tokens = data[0].result.data.tokens;
        console.log(`   PnL tokens (direct structure): ${tokens.length}`);
      } else {
        console.log(`   Pas de tokens PnL trouvés`);
        console.log(`   Structure:`, Object.keys(data[0]?.result?.data || {}));
      }
      
      if (tokens && tokens.length > 0) {
        tokens.slice(0, 3).forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || token.token_symbol || 'Unknown'} - PnL: ${token.pnl_usd || 'N/A'}`);
        });
        
        // Chercher SDOG spécifiquement
        const sdogTokens = tokens.filter(token => {
          const symbol = token.symbol || token.token_symbol || '';
          return symbol.toLowerCase().includes('sdog') || symbol.toLowerCase().includes('dog');
        });
        
        if (sdogTokens.length > 0) {
          console.log(`   🐕 SDOG tokens trouvés: ${sdogTokens.length}`);
          sdogTokens.forEach(token => {
            console.log(`      - ${token.symbol || token.token_symbol}: PnL ${token.pnl_usd || 'N/A'}`);
          });
        }
      }
    } else {
      console.log(`❌ PnL Error: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ PnL Exception: ${error.message}`);
  }
}

testImprovedHeaders().catch(console.error);
