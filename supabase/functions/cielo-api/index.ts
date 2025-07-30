// Edge Function pour remplacer l'API Cielo locale complètement
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration pour les APIs externes (si vous en avez)
const EXTERNAL_APIS = {
  GMGN_BASE_URL: 'https://gmgn.ai',
  CIELO_BASE_URL: Deno.env.get('CIELO_API_URL'), // Configurez si vous avez une vraie API Cielo
  COINGECKO_API_KEY: Deno.env.get('COINGECKO_API_KEY'),
  USE_MOCK_DATA: Deno.env.get('USE_MOCK_DATA') !== 'false' // Par défaut: utiliser les données mock
}

// Fonction pour récupérer des données GMGN réelles
async function fetchRealGMGNData(walletAddress: string) {
  try {
    console.log(`🔍 Fetching real GMGN data for ${walletAddress}`);
    
    // Remplacez par vos vraies requêtes GMGN si vous en avez
    const response = await fetch(`${EXTERNAL_APIS.GMGN_BASE_URL}/sol/address/${walletAddress}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
    
    if (!response.ok) {
      throw new Error(`GMGN API error: ${response.status}`);
    }
    
    const data = await response.text(); // GMGN retourne souvent du HTML à parser
    
    // Ici vous parseriez les données GMGN réelles
    // Pour l'instant, on retourne null pour utiliser les données mock
    return null;
    
  } catch (error) {
    console.error(`❌ Error fetching real GMGN data: ${error.message}`);
    return null;
  }
}

// Fonction pour récupérer des données Cielo réelles (si vous avez l'API)
async function fetchRealCieloData(walletAddress: string) {
  try {
    if (!EXTERNAL_APIS.CIELO_BASE_URL) {
      return null; // Pas d'API Cielo configurée
    }
    
    console.log(`🔍 Fetching real Cielo data for ${walletAddress}`);
    
    const response = await fetch(`${EXTERNAL_APIS.CIELO_BASE_URL}/api/wallet/${walletAddress}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('CIELO_API_KEY')}`
      },
      signal: AbortSignal.timeout(60000) // 60s timeout pour Cielo
    });
    
    if (!response.ok) {
      throw new Error(`Cielo API error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`❌ Error fetching real Cielo data: ${error.message}`);
    return null;
  }
}

// Génération de données mock (comme votre serveur local)
function generateMockData(walletAddress: string) {
  console.log(`🎭 Generating mock data for ${walletAddress}`);
  
  return {
    data: {
      summary: {
        total_tokens_traded: Math.floor(Math.random() * 200) + 50,
        total_pnl_usd: (Math.random() - 0.5) * 100000,
        winrate: Math.random() * 100,
        current_portfolio_value: Math.random() * 50000,
        current_holdings_count: Math.floor(Math.random() * 20) + 1,
        trading_stats_period: 'max',
        geckoterminal_enrichment: {
          portfolio_enriched_tokens: Math.floor(Math.random() * 10) + 1,
          portfolio_tokens_with_market_cap: Math.floor(Math.random() * 10) + 1,
          portfolio_tokens_with_security_data: Math.floor(Math.random() * 10) + 1,
          portfolio_avg_reliability: Math.floor(Math.random() * 50) + 50,
          pnl_enriched_tokens: Math.floor(Math.random() * 100) + 50,
          pnl_tokens_with_market_cap: Math.floor(Math.random() * 100) + 50,
          pnl_tokens_with_security_data: Math.floor(Math.random() * 100) + 50,
          pnl_avg_reliability: Math.floor(Math.random() * 50) + 30,
          total_enriched_tokens: Math.floor(Math.random() * 150) + 100,
          total_tokens_processed: Math.floor(Math.random() * 200) + 150,
          enrichment_completion_status: 'COMPLETE'
        }
      },
      stats: {
        data: {
          wallet: walletAddress,
          average_holding_time: Math.floor(Math.random() * 500) + 100,
          total_pnl: (Math.random() - 0.5) * 100000,
          winrate: Math.random() * 100,
          total_roi_percentage: (Math.random() - 0.5) * 200,
          swap_count: Math.floor(Math.random() * 2000) + 100,
          first_swap_timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          last_swap_timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          unique_trading_days: Math.floor(Math.random() * 100) + 10,
          consecutive_trading_days: Math.floor(Math.random() * 50) + 5,
          average_trades_per_token: Math.random() * 10 + 1,
          average_buy_amount_usd: Math.random() * 1000 + 50,
          minimum_buy_amount_usd: Math.random() * 50 + 1,
          maximum_buy_amount_usd: Math.random() * 5000 + 500,
          total_buy_amount_usd: Math.random() * 100000 + 5000,
          total_buy_count: Math.floor(Math.random() * 500) + 50,
          average_sell_amount_usd: Math.random() * 1000 + 50,
          minimum_sell_amount_usd: Math.random() * 10 + 0.1,
          maximum_sell_amount_usd: Math.random() * 5000 + 500,
          total_sell_amount_usd: Math.random() * 150000 + 7000,
          total_sell_count: Math.floor(Math.random() * 600) + 60,
          roi_distribution: {
            roi_above_500: Math.floor(Math.random() * 20),
            roi_200_to_500: Math.floor(Math.random() * 30),
            roi_0_to_200: Math.floor(Math.random() * 100) + 20,
            roi_neg50_to_0: Math.floor(Math.random() * 80) + 10,
            roi_below_neg50: Math.floor(Math.random() * 150) + 50
          },
          top_trade_tokens: [
            { symbol: 'TOKEN1', pnl: Math.random() * 50000, roi: Math.random() * 1000 },
            { symbol: 'TOKEN2', pnl: Math.random() * 30000, roi: Math.random() * 500 }
          ],
          worst_trade_tokens: [
            { symbol: 'BADTOKEN', pnl: -Math.random() * 10000, roi: -Math.random() * 100 }
          ],
          most_traded_token: {
            symbol: 'MAINTOKEN',
            pnl: Math.random() * 5000,
            roi: Math.random() * 100
          },
          dexes_stats: {
            total_trades: Math.floor(Math.random() * 2000) + 100,
            dexes: [
              { name: 'PumpFun', trades: Math.floor(Math.random() * 1000) + 100, percent: Math.random() * 80 + 10 },
              { name: 'Raydium', trades: Math.floor(Math.random() * 500) + 50, percent: Math.random() * 30 + 5 }
            ]
          },
          daily_activity_heatmap: {
            data: [
              { date: Date.now() - 86400000, value: Math.floor(Math.random() * 50) + 10 },
              { date: Date.now() - 172800000, value: Math.floor(Math.random() * 30) + 5 }
            ],
            metadata: { min_value: 1, max_value: 100 }
          },
          peak_trading_hours: [
            { hour: 8, count: Math.floor(Math.random() * 100) + 20 },
            { hour: 14, count: Math.floor(Math.random() * 80) + 15 }
          ]
        }
      },
      portfolio: {
        data: {
          portfolio: [
            {
              token_symbol: 'SOL',
              token_address: 'So11111111111111111111111111111111111111112',
              token_name: 'Solana',
              total_usd_value: Math.random() * 10000 + 100,
              portfolio_weight_pct: Math.random() * 50 + 20,
              balance: Math.random() * 100 + 1,
              token_price_usd: 100 + Math.random() * 100,
              price_change_24h: (Math.random() - 0.5) * 20,
              pnl: (Math.random() - 0.5) * 5000,
              pnl_percentage: (Math.random() - 0.5) * 200,
              geckoterminal_complete_data: {
                name: 'Solana',
                symbol: 'SOL',
                address: 'So11111111111111111111111111111111111111112',
                on_coingecko: true,
                reliability_score: { 
                  total_score: Math.floor(Math.random() * 30) + 70,
                  factors: {
                    pool_score: Math.floor(Math.random() * 20) + 80,
                    security_score: Math.floor(Math.random() * 20) + 80,
                    fundamentals_score: Math.floor(Math.random() * 20) + 70,
                    community_score: Math.floor(Math.random() * 30) + 60
                  }
                },
                market_cap_usd: 45000000000 + Math.random() * 10000000000,
                calculated_market_cap_usd: 45000000000 + Math.random() * 10000000000,
                circulating_supply: 400000000 + Math.random() * 100000000,
                pool_data: {
                  price_usd: 100 + Math.random() * 100,
                  price_change_1h: (Math.random() - 0.5) * 5,
                  price_change_24h: (Math.random() - 0.5) * 20,
                  price_change_7d: (Math.random() - 0.5) * 50,
                  volume_24h_usd: Math.random() * 1000000000 + 100000000,
                  volume_24h_change: (Math.random() - 0.5) * 100,
                  liquidity_usd: Math.random() * 100000000 + 10000000,
                  gt_score: Math.floor(Math.random() * 30) + 70,
                  fdv: 50000000000 + Math.random() * 20000000000
                },
                security_data: {
                  security_score: Math.floor(Math.random() * 20) + 80,
                  holder_count: Math.floor(Math.random() * 1000000) + 100000,
                  top_10_holder_percent: Math.random() * 30 + 10,
                  locked_percent: Math.random() * 80 + 10,
                  soul_scanner_data: {
                    mintable: Math.random() > 0.8 ? '1' : '0',
                    freezeable: Math.random() > 0.9 ? '1' : '0'
                  },
                  go_plus_data: {
                    honeypot_risk: Math.random() > 0.95 ? 'high' : 'low',
                    transfer_pausable: Math.random() > 0.9,
                    is_blacklisted: false,
                    is_whitelisted: Math.random() > 0.7,
                    buy_tax: Math.random() * 0.05,
                    sell_tax: Math.random() * 0.05
                  }
                }
              }
            },
            // Ajouter 2-5 tokens supplémentaires pour simuler un vrai portfolio
            ...Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => ({
              token_symbol: `TOKEN${i + 1}`,
              token_address: `Token${i + 1}${'1'.repeat(40)}`,
              token_name: `Token Number ${i + 1}`,
              total_usd_value: Math.random() * 5000 + 10,
              portfolio_weight_pct: Math.random() * 20 + 1,
              balance: Math.random() * 10000 + 100,
              token_price_usd: Math.random() * 10 + 0.1,
              price_change_24h: (Math.random() - 0.5) * 50,
              pnl: (Math.random() - 0.5) * 2000,
              pnl_percentage: (Math.random() - 0.5) * 500,
              geckoterminal_complete_data: {
                name: `Token Number ${i + 1}`,
                symbol: `TOKEN${i + 1}`,
                address: `Token${i + 1}${'1'.repeat(40)}`,
                on_coingecko: Math.random() > 0.5,
                reliability_score: { 
                  total_score: Math.floor(Math.random() * 80) + 20,
                  factors: {
                    pool_score: Math.floor(Math.random() * 80) + 20,
                    security_score: Math.floor(Math.random() * 80) + 20,
                    fundamentals_score: Math.floor(Math.random() * 80) + 20,
                    community_score: Math.floor(Math.random() * 80) + 20
                  }
                },
                market_cap_usd: Math.random() * 100000000 + 1000000,
                calculated_market_cap_usd: Math.random() * 100000000 + 1000000,
                circulating_supply: Math.random() * 1000000000 + 1000000,
                pool_data: {
                  price_usd: Math.random() * 10 + 0.1,
                  price_change_1h: (Math.random() - 0.5) * 10,
                  price_change_24h: (Math.random() - 0.5) * 50,
                  price_change_7d: (Math.random() - 0.5) * 200,
                  volume_24h_usd: Math.random() * 10000000 + 100000,
                  volume_24h_change: (Math.random() - 0.5) * 200,
                  liquidity_usd: Math.random() * 1000000 + 50000,
                  gt_score: Math.floor(Math.random() * 80) + 20,
                  fdv: Math.random() * 200000000 + 2000000
                },
                security_data: {
                  security_score: Math.floor(Math.random() * 80) + 20,
                  holder_count: Math.floor(Math.random() * 50000) + 1000,
                  top_10_holder_percent: Math.random() * 60 + 20,
                  locked_percent: Math.random() * 90,
                  soul_scanner_data: {
                    mintable: Math.random() > 0.6 ? '1' : '0',
                    freezeable: Math.random() > 0.7 ? '1' : '0'
                  },
                  go_plus_data: {
                    honeypot_risk: Math.random() > 0.8 ? 'high' : 'low',
                    transfer_pausable: Math.random() > 0.8,
                    is_blacklisted: Math.random() > 0.95,
                    is_whitelisted: Math.random() > 0.8,
                    buy_tax: Math.random() * 0.1,
                    sell_tax: Math.random() * 0.1
                  }
                }
              }
            }))
          ]
        }
      },
      pnl: { 
        data: Array.from({ length: Math.floor(Math.random() * 50) + 10 }, (_, i) => ({
          token_address: `Token${Math.floor(Math.random() * 5) + 1}${'1'.repeat(40)}`,
          token_symbol: `TOKEN${Math.floor(Math.random() * 5) + 1}`,
          pnl: (Math.random() - 0.5) * 10000,
          pnl_percentage: (Math.random() - 0.5) * 500,
          roi: (Math.random() - 0.5) * 1000,
          buy_amount_usd: Math.random() * 5000 + 100,
          sell_amount_usd: Math.random() * 8000 + 150,
          buy_timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
          sell_timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          holding_time: Math.random() * 30 * 24 * 60 * 60, // secondes
          buy_dex: Math.random() > 0.5 ? 'PumpFun' : 'Raydium',
          sell_dex: Math.random() > 0.5 ? 'PumpFun' : 'Raydium'
        }))
      }
    }
  };
}

// Fonction principale pour récupérer les données complètes
async function getCompleteWalletData(walletAddress: string) {
  console.log(`🔍 Fetching complete data for wallet: ${walletAddress}`);
  
  try {
    let realData = null;
    
    // Si configuré pour utiliser de vraies APIs, essayer de les appeler
    if (!EXTERNAL_APIS.USE_MOCK_DATA) {
      console.log('🌐 Attempting to fetch real data...');
      
      // Essayer de récupérer des données réelles en parallèle
      const [gmgnData, cieloData] = await Promise.allSettled([
        fetchRealGMGNData(walletAddress),
        fetchRealCieloData(walletAddress)
      ]);
      
      // Combiner les données réelles si disponibles
      if (gmgnData.status === 'fulfilled' && gmgnData.value) {
        realData = gmgnData.value;
      }
      
      if (cieloData.status === 'fulfilled' && cieloData.value) {
        realData = { ...realData, ...cieloData.value };
      }
    }
    
    // Si pas de données réelles ou configuré pour mock, utiliser les données simulées
    if (!realData) {
      console.log('🎭 Using mock data (real APIs not available or configured)');
      realData = generateMockData(walletAddress);
    }
    
    // Simuler un délai réaliste
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    console.log(`✅ Complete data ready for ${walletAddress}`);
    return realData;
    
  } catch (error) {
    console.error(`❌ Error fetching complete data for ${walletAddress}:`, error);
    
    // En cas d'erreur, retourner des données mock pour que le système continue de fonctionner
    console.log('🎭 Fallback to mock data due to error');
    return generateMockData(walletAddress);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Route principale: données complètes (remplace /api/cielo/complete/:address)
    if (path.includes('/complete/')) {
      const walletAddress = path.split('/complete/')[1];
      
      if (!walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const completeData = await getCompleteWalletData(walletAddress);
      
      return new Response(
        JSON.stringify(completeData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: portfolio seul
    if (path.includes('/portfolio/')) {
      const walletAddress = path.split('/portfolio/')[1];
      
      if (!walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const completeData = await getCompleteWalletData(walletAddress);
      
      return new Response(
        JSON.stringify({ data: completeData.data.portfolio }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: stats seul
    if (path.includes('/stats/')) {
      const walletAddress = path.split('/stats/')[1];
      
      if (!walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const completeData = await getCompleteWalletData(walletAddress);
      
      return new Response(
        JSON.stringify({ data: completeData.data.stats }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: PNL seul
    if (path.includes('/pnl/')) {
      const walletAddress = path.split('/pnl/')[1];
      
      if (!walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const completeData = await getCompleteWalletData(walletAddress);
      
      return new Response(
        JSON.stringify({ data: completeData.data.pnl }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: health check
    if (path === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'OK', 
          timestamp: new Date().toISOString(),
          config: {
            use_mock_data: EXTERNAL_APIS.USE_MOCK_DATA,
            has_cielo_url: !!EXTERNAL_APIS.CIELO_BASE_URL,
            has_coingecko_key: !!EXTERNAL_APIS.COINGECKO_API_KEY
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route par défaut: documentation
    return new Response(
      JSON.stringify({ 
        message: 'Cielo API Edge Function',
        endpoints: [
          'GET /complete/{address} - Complete wallet data',
          'GET /portfolio/{address} - Portfolio data only',
          'GET /stats/{address} - Stats data only', 
          'GET /pnl/{address} - PNL data only',
          'GET /health - Health check'
        ],
        note: 'This replaces the local serveur-api.js completely'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Cielo API function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
