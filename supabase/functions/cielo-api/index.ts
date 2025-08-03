// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuration API Cielo
const CIELO_CONFIG = {
  baseUrl: 'https://feed-api.cielo.finance/v1',
  headers: {
    'Api-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOjE3NTM1NTAxNjV9.auH6IR4uqg8NlkhyT82sEpav6mvvvRnMMf6hjOnSd0w',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiNkhQRVQ3UkxZZHZ6Z0hTVHVhRWNWbTRoTTV3VkxYa3Z2OTVOWm4yYW0xNGkiLCJpc3MiOiJodHRwczovL2FwaS51bml3aGFsZXMuaW8vIiwic3ViIjoidXNlciIsInBsYW4iOiJiYXNpYyIsImJhbGFuY2UiOjAsImlhdCI6MTc1MzU1MDAxNywiZXhwIjoxNzUzNTYwODE3fQ.t99299sp1pEKJnr8B61GLdj4e6f3bs29uM4xCLUpqVE',
    'Content-Type': 'application/json'
  }
};

// Configuration API Geckoterminal
const GECKOTERMINAL_CONFIG = {
  baseUrl: 'https://app.geckoterminal.com/api/p1',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

// Cache pour éviter les requêtes répétées
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fonction utilitaire pour faire des requêtes à l'API Cielo
 */
async function cieloRequest(endpoint: string): Promise<any> {
  const fullUrl = `${CIELO_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`🌐 [CIELO REQUEST] ${fullUrl}`);
    console.log(`📤 [CIELO HEADERS]`, JSON.stringify(CIELO_CONFIG.headers, null, 2));
    
    const startTime = Date.now();
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: CIELO_CONFIG.headers
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ [CIELO RESPONSE] ${response.status} ${response.statusText} (${duration}ms)`);

    if (!response.ok) {
      console.error(`❌ [CIELO ERROR] HTTP ${response.status}: ${response.statusText}`);
      console.error(`🔗 [CIELO ERROR URL] ${fullUrl}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📥 [CIELO RESPONSE DATA] Taille: ${JSON.stringify(data).length} caractères`);
    console.log(`🔍 [CIELO RESPONSE STRUCTURE]:`, Object.keys(data));
    
    // Log du premier niveau de structure pour le debug
    if (data.data) {
      console.log(`📊 [CIELO DATA STRUCTURE]:`, Object.keys(data.data));
      
      // Cas spécifique pour les tokens PnL
      if (data.data.tokens && Array.isArray(data.data.tokens)) {
        console.log(`🪙 [CIELO TOKENS] ${data.data.tokens.length} tokens trouvés`);
        if (data.data.tokens.length > 0) {
          console.log(`🔍 [CIELO FIRST TOKEN]:`, Object.keys(data.data.tokens[0]));
        }
      }
      
      // Cas spécifique pour le portfolio
      if (data.data.portfolio && Array.isArray(data.data.portfolio)) {
        console.log(`📋 [CIELO PORTFOLIO] ${data.data.portfolio.length} tokens dans le portfolio`);
        if (data.data.portfolio.length > 0) {
          console.log(`🔍 [CIELO FIRST PORTFOLIO TOKEN]:`, Object.keys(data.data.portfolio[0]));
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`💥 [CIELO ERROR] ${fullUrl}:`, error.message);
    throw error;
  }
}

/**
 * Fonction utilitaire pour faire des requêtes à l'API Geckoterminal
 */
async function geckoterminalRequest(endpoint: string): Promise<any> {
  const fullUrl = `${GECKOTERMINAL_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`🦎 [GECKO REQUEST] ${fullUrl}`);
    console.log(`📤 [GECKO HEADERS]`, JSON.stringify(GECKOTERMINAL_CONFIG.headers, null, 2));
    
    const startTime = Date.now();
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: GECKOTERMINAL_CONFIG.headers
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ [GECKO RESPONSE] ${response.status} ${response.statusText} (${duration}ms)`);

    if (!response.ok) {
      console.log(`⚠️ [GECKO WARNING] HTTP ${response.status}: ${response.statusText}`);
      console.log(`🔗 [GECKO WARNING URL] ${fullUrl}`);
      
      // Gérer les erreurs 404 spécialement (token/pool non trouvé)
      if (response.status === 404) {
        console.log(`🔍 [GECKO 404] Token/Pool non trouvé sur Geckoterminal`);
        return { data: null, error: 'not_found' };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📥 [GECKO RESPONSE DATA] Taille: ${JSON.stringify(data).length} caractères`);
    console.log(`🔍 [GECKO RESPONSE STRUCTURE]:`, Object.keys(data));
    
    return data;
  } catch (error) {
    // Ne pas logger les erreurs 404 comme des erreurs
    if (!error.message.includes('404')) {
      console.error(`💥 [GECKO ERROR] ${fullUrl}:`, error.message);
    }
    throw error;
  }
}

/**
 * Enrichir les données avec Geckoterminal (prix, market cap, etc.)
 */
async function enrichTokenWithGecko(token: any, network: string = 'solana'): Promise<any> {
  if (!token.token_address) {
    return token;
  }

  const cacheKey = `gecko_${network}_${token.token_address}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`📦 [GECKO CACHE HIT] ${token.token_address}`);
    return { ...token, ...cachedData.data };
  }

  try {
    const endpoint = `/${network}/tokens/${token.token_address}`;
    const geckoData = await geckoterminalRequest(endpoint);
    
    if (geckoData && geckoData.data && geckoData.data.attributes) {
      const attrs = geckoData.data.attributes;
      const enrichedData = {
        gecko_price_usd: attrs.price_usd,
        gecko_market_cap_usd: attrs.market_cap_usd,
        gecko_volume_24h: attrs.volume_24h,
        gecko_price_change_24h: attrs.price_change_percentage?.['24h'],
        gecko_fdv_usd: attrs.fdv_usd,
        gecko_updated_at: attrs.updated_at
      };
      
      // Mettre en cache
      cache.set(cacheKey, {
        data: enrichedData,
        timestamp: Date.now()
      });
      
      console.log(`✅ [GECKO ENRICHED] ${token.token_address} - Prix: $${attrs.price_usd}`);
      return { ...token, ...enrichedData };
    }
  } catch (error) {
    console.log(`⚠️ [GECKO SKIP] ${token.token_address}: ${error.message}`);
  }
  
  return token;
}

/**
 * Calculer les statistiques de période (7j, all time)
 */
function calculatePeriodStats(data: any, period: string): any {
  // Cette fonction peut être étendue selon les besoins spécifiques
  const stats = {
    period: period,
    calculated_at: new Date().toISOString()
  };

  if (data.data && data.data.tokens) {
    const tokens = data.data.tokens;
    
    // Calculer les stats de base
    const totalPnl = tokens.reduce((sum: number, token: any) => {
      return sum + (token.realized_pnl || 0) + (token.unrealized_pnl || 0);
    }, 0);

    const totalVolume = tokens.reduce((sum: number, token: any) => {
      return sum + (token.volume_usd || 0);
    }, 0);

    const winningTrades = tokens.filter((token: any) => 
      (token.realized_pnl || 0) + (token.unrealized_pnl || 0) > 0
    ).length;

    const totalTrades = tokens.length;

    return {
      ...stats,
      total_pnl: totalPnl,
      total_volume: totalVolume,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      win_rate: totalTrades > 0 ? winningTrades / totalTrades : 0,
      tokens_count: totalTrades
    };
  }

  return stats;
}

/**
 * Données stables pour les tests et fallback
 */
function getStableWalletData(walletAddress: string): any {
  if (walletAddress === 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB') {
    return {
      wallet_address: walletAddress,
      total_usd_value: 127500.45,
      total_pnl_usd: 34250.80,
      win_rate: 73.5,
      total_trades: 156,
      alpha_score: 8.7,
      tokens: [
        {
          mint: "So11111111111111111111111111111111111111112",
          symbol: "SOL",
          name: "Solana",
          balance: 125.45,
          usd_value: 18500.75,
          total_pnl_usd: 4250.30,
          roi_percentage: 187.5,
          trade_count: 23,
          win_rate: 78.3
        }
      ],
      data_source: 'stable_fallback',
      timestamp: new Date().toISOString()
    };
  }
  
  // Générer des données cohérentes basées sur l'adresse
  const hash = walletAddress.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const baseValue = Math.abs(hash) % 100000;
  
  return {
    wallet_address: walletAddress,
    total_usd_value: baseValue * 0.25,
    total_pnl_usd: baseValue * 0.15,
    win_rate: ((baseValue % 80) + 20) / 100 * 100, // 20-100%
    total_trades: Math.floor(baseValue / 100) + 10,
    alpha_score: (baseValue % 100) / 10, // 0-10
    tokens: [],
    data_source: 'stable_generated',
    timestamp: new Date().toISOString()
  };
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log(`🔍 [ROUTE DEBUG] pathname=${url.pathname}, pathParts=${JSON.stringify(pathParts)}`);
    
    // Format attendu: /cielo-api/action/wallet_address
    // pathParts = ["cielo-api", "health"] ou ["cielo-api", "portfolio", "ABd..."]
    
    if (pathParts.length < 2 || pathParts[0] !== 'cielo-api') {
      return new Response(JSON.stringify({
        error: 'Invalid path format',
        expected: '/cielo-api/action/wallet_address',
        received: url.pathname,
        pathParts: pathParts
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const action = pathParts[1]; // health, portfolio, stats, etc.
    const walletAddress = pathParts[2]; // adresse du wallet (optionnel pour health)

    console.log(`🎯 [CIELO API] action="${action}", wallet="${walletAddress || 'none'}"`);

    // Le health check ne nécessite pas d'adresse de wallet
    if (action === 'health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        version: 'deno-cielo-api-v3',
        timestamp: new Date().toISOString(),
        cielo_base_url: CIELO_CONFIG.baseUrl,
        test_wallet: 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB',
        data_source: 'REAL_CIELO_API_WITH_FALLBACK',
        available_endpoints: ['portfolio', 'stats', 'stats-7d', 'profitability', 'profitability-7d', 'track-status', 'tokens-pnl', 'pnl', 'pnl-complete', 'complete', 'health']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!walletAddress) {
      return new Response(JSON.stringify({ 
        error: 'Wallet address required',
        example: '/cielo-api/portfolio/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB',
        received_action: action,
        available_actions: ['portfolio', 'stats', 'stats-7d', 'pnl', 'pnl-complete', 'complete', 'health']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      switch (action) {
        case 'portfolio': {
          console.log(`📋 [PORTFOLIO] Récupération du portfolio pour ${walletAddress}`);
          const data = await cieloRequest(`/wallet/${walletAddress}/portfolio`);
          
          // Enrichir avec Geckoterminal si possible
          if (data.data && data.data.portfolio && Array.isArray(data.data.portfolio)) {
            console.log(`🔄 [PORTFOLIO] Enrichissement de ${data.data.portfolio.length} tokens`);
            for (let i = 0; i < data.data.portfolio.length && i < 5; i++) { // Limiter à 5 pour éviter timeout
              data.data.portfolio[i] = await enrichTokenWithGecko(data.data.portfolio[i]);
            }
          }
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            enriched_with_gecko: true,
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'stats': {
          console.log(`📊 [STATS ALL TIME] Récupération des stats pour ${walletAddress}`);
          const data = await cieloRequest(`/enhanced-stats/aggregated/${walletAddress}?days=max`);
          const periodStats = calculatePeriodStats(data, 'all_time');
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            period_stats: periodStats,
            source: 'CIELO_API',
            endpoint_used: '/enhanced-stats/aggregated',
            cielo_url: `${CIELO_CONFIG.baseUrl}/enhanced-stats/aggregated/${walletAddress}?days=max`,
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'stats-7d': {
          console.log(`📊 [STATS 7D] Récupération des stats 7j pour ${walletAddress}`);
          const data = await cieloRequest(`/enhanced-stats/aggregated/${walletAddress}?days=7`);
          const periodStats = calculatePeriodStats(data, '7_days');
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            period_stats: periodStats,
            source: 'CIELO_API',
            endpoint_used: '/enhanced-stats/aggregated',
            period: '7_days',
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'profitability': {
          console.log(`💹 [PROFITABILITY] Récupération des données de profitabilité pour ${walletAddress}`);
          const data = await cieloRequest(`/enhanced-stats/profitability/${walletAddress}?days=max`);
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            endpoint_used: '/enhanced-stats/profitability',
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'profitability-7d': {
          console.log(`💹 [PROFITABILITY 7D] Récupération de la profitabilité 7j pour ${walletAddress}`);
          const data = await cieloRequest(`/enhanced-stats/profitability/${walletAddress}?days=7`);
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            endpoint_used: '/enhanced-stats/profitability',
            period: '7_days',
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'pnl': {
          console.log(`💰 [PNL] Récupération du PnL pour ${walletAddress}`);
          const data = await cieloRequest(`/wallet/${walletAddress}/pnl`);
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'pnl-complete': {
          console.log(`💰 [PNL COMPLETE] Récupération du PnL complet pour ${walletAddress}`);
          const data = await cieloRequest(`/wallet/${walletAddress}/pnl?include_tokens=true`);
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            include_tokens: true,
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'complete': {
          console.log(`🔄 [COMPLETE] Récupération des données complètes pour ${walletAddress}`);
          
          // Fonction helper pour appeler tokens-pnl avec TRPC
          const fetchTokensPnlTRPC = async () => {
            const trpcInput = {
              "0": {
                "json": {
                  "wallet": walletAddress,
                  "chains": "",
                  "timeframe": "",
                  "sortBy": "",
                  "page": "1",
                  "tokenFilter": ""
                }
              }
            };
            
            const encodedInput = encodeURIComponent(JSON.stringify(trpcInput));
            const trpcUrl = `https://app.cielo.finance/api/trpc/profile.fetchTokenPnlSlow?batch=1&input=${encodedInput}`;
            
            const trpcResponse = await fetch(trpcUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://app.cielo.finance/',
                'Origin': 'https://app.cielo.finance'
              }
            });
            
            if (!trpcResponse.ok) {
              throw new Error(`TRPC request failed: ${trpcResponse.status} ${trpcResponse.statusText}`);
            }
            
            const trpcData = await trpcResponse.json();
            if (!trpcData[0] || !trpcData[0].result || !trpcData[0].result.data) {
              throw new Error('Format de réponse TRPC invalide');
            }
            
            return trpcData[0].result.data;
          };
          
          // Appeler tous les endpoints découverts dans les requêtes TRPC + tokens-pnl TRPC
          const [portfolioData, statsAggregatedData, profitabilityData, trackStatusData, tokensPnlData] = await Promise.allSettled([
            cieloRequest(`/wallet/${walletAddress}/portfolio`),
            cieloRequest(`/enhanced-stats/aggregated/${walletAddress}?days=max`),
            cieloRequest(`/enhanced-stats/profitability/${walletAddress}?days=max`),
            cieloRequest(`/wallet/${walletAddress}/track-status`),
            fetchTokensPnlTRPC()
          ]);

          const result: any = {
            success: true,
            wallet_address: walletAddress,
            timestamp: new Date().toISOString(),
            source: 'CIELO_API',
            trpc_equivalent: 'profile.getWalletPortfolio + profile.getEnhancedStatsAggregated + profile.getEnhancedStatsProfitability + profile.getWalletGlobalTrackStatus + profile.fetchTokenPnlSlow',
            endpoints_called: [
              `/wallet/${walletAddress}/portfolio`,
              `/enhanced-stats/aggregated/${walletAddress}?days=max`,
              `/enhanced-stats/profitability/${walletAddress}?days=max`,
              `/wallet/${walletAddress}/track-status`,
              `TRPC profile.fetchTokenPnlSlow`
            ]
          };

          if (portfolioData.status === 'fulfilled') {
            result.portfolio = portfolioData.value.data;
          } else {
            console.log(`⚠️ [COMPLETE] Portfolio failed: ${portfolioData.reason}`);
            result.portfolio_error = portfolioData.reason.message;
          }

          if (statsAggregatedData.status === 'fulfilled') {
            result.stats_aggregated = statsAggregatedData.value.data;
            result.period_stats = calculatePeriodStats(statsAggregatedData.value, 'all_time');
          } else {
            console.log(`⚠️ [COMPLETE] Stats Aggregated failed: ${statsAggregatedData.reason}`);
            result.stats_aggregated_error = statsAggregatedData.reason.message;
          }

          if (profitabilityData.status === 'fulfilled') {
            result.profitability = profitabilityData.value.data;
          } else {
            console.log(`⚠️ [COMPLETE] Profitability failed: ${profitabilityData.reason}`);
            result.profitability_error = profitabilityData.reason.message;
          }

          if (trackStatusData.status === 'fulfilled') {
            result.track_status = trackStatusData.value.data;
          } else {
            console.log(`⚠️ [COMPLETE] Track Status failed: ${trackStatusData.reason}`);
            result.track_status_error = trackStatusData.reason.message;
          }

          // Ajouter les données TRPC tokens-pnl
          if (tokensPnlData.status === 'fulfilled') {
            result.tokens_pnl = {
              source: 'TRPC_DIRECT',
              data: tokensPnlData.value,
              total_tokens: tokensPnlData.value.total_tokens_traded || 0,
              total_pnl_usd: tokensPnlData.value.total_pnl_usd || 0,
              winrate: tokensPnlData.value.winrate || 0,
              tokens_count: tokensPnlData.value.tokens?.length || 0
            };
            console.log(`✅ [COMPLETE] Tokens PnL TRPC: ${tokensPnlData.value.tokens?.length || 0} tokens`);
          } else {
            console.log(`⚠️ [COMPLETE] Tokens PnL TRPC failed: ${tokensPnlData.reason}`);
            result.tokens_pnl_error = tokensPnlData.reason.message;
            
            // Fallback vers l'ancienne méthode enhanced-stats si disponible
            if (statsAggregatedData.status === 'fulfilled' && statsAggregatedData.value.data) {
              const statsData = statsAggregatedData.value.data;
              const allTokens: any[] = [];
              
              if (statsData.top_trade_tokens && Array.isArray(statsData.top_trade_tokens)) {
                allTokens.push(...statsData.top_trade_tokens.map((token: any) => ({ ...token, category: 'top' })));
              }
              
              if (statsData.worst_trade_tokens && Array.isArray(statsData.worst_trade_tokens)) {
                allTokens.push(...statsData.worst_trade_tokens.map((token: any) => ({ ...token, category: 'worst' })));
              }
              
              if (statsData.most_traded_token) {
                const mostTradedExists = allTokens.find((t: any) => t.address === statsData.most_traded_token.address);
                if (!mostTradedExists) {
                  allTokens.push({ ...statsData.most_traded_token, category: 'most_traded' });
                }
              }
              
              const uniqueTokens = allTokens.reduce((acc: any[], token: any) => {
                const existing = acc.find((t: any) => t.address === token.address);
                if (!existing) {
                  acc.push(token);
                }
                return acc;
              }, []);
              
              uniqueTokens.sort((a: any, b: any) => (b.pnl || 0) - (a.pnl || 0));
              
              result.tokens_pnl = {
                source: 'ENHANCED_STATS_FALLBACK',
                tokens: uniqueTokens.slice(0, 10),
                total_count: uniqueTokens.length,
                summary: {
                  total_pnl: statsData.total_pnl,
                  winrate: statsData.winrate,
                  total_roi_percentage: statsData.total_roi_percentage,
                  swap_count: statsData.swap_count
                }
              };
              console.log(`🔄 [COMPLETE] Tokens PnL fallback: ${uniqueTokens.length} tokens`);
            }
          }

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'track-status': {
          console.log(`🔍 [TRACK STATUS] Récupération du statut de tracking pour ${walletAddress}`);
          const data = await cieloRequest(`/wallet/${walletAddress}/track-status`);
          
          return new Response(JSON.stringify({
            success: true,
            data: data.data,
            source: 'CIELO_API',
            endpoint_used: '/wallet/track-status',
            timestamp: new Date().toISOString(),
            wallet_address: walletAddress
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'tokens-pnl': {
          console.log(`🪙 [TOKENS PNL] Récupération des tokens PnL pour ${walletAddress}`);
          
          // Récupérer les paramètres de requête (format TRPC original)
          const searchParams = new URLSearchParams(url.search);
          const page = searchParams.get('page') || '1';
          const chains = searchParams.get('chains') || '';
          const timeframe = searchParams.get('timeframe') || '';
          const sortBy = searchParams.get('sortBy') || '';
          const tokenFilter = searchParams.get('tokenFilter') || '';
          
          console.log(`🔍 [TOKENS PNL] Paramètres TRPC: page=${page}, chains="${chains}", timeframe="${timeframe}", sortBy="${sortBy}", tokenFilter="${tokenFilter}"`);
          
          // Construire la requête TRPC exacte
          const trpcInput = {
            "0": {
              "json": {
                "wallet": walletAddress,
                "chains": chains,
                "timeframe": timeframe,
                "sortBy": sortBy,
                "page": page,
                "tokenFilter": tokenFilter
              }
            }
          };
          
          const encodedInput = encodeURIComponent(JSON.stringify(trpcInput));
          const trpcUrl = `https://app.cielo.finance/api/trpc/profile.fetchTokenPnlSlow?batch=1&input=${encodedInput}`;
          
          console.log(`� [TOKENS PNL] URL TRPC: ${trpcUrl}`);
          
          try {
            const trpcResponse = await fetch(trpcUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://app.cielo.finance/',
                'Origin': 'https://app.cielo.finance'
              }
            });
            
            if (!trpcResponse.ok) {
              throw new Error(`TRPC request failed: ${trpcResponse.status} ${trpcResponse.statusText}`);
            }
            
            const trpcData = await trpcResponse.json();
            console.log(`✅ [TOKENS PNL] Réponse TRPC reçue`);
            
            // Extraire les données du format TRPC
            if (!trpcData[0] || !trpcData[0].result || !trpcData[0].result.data) {
              throw new Error('Format de réponse TRPC invalide');
            }
            
            const tokenData = trpcData[0].result.data;
            console.log(`📊 [TOKENS PNL] ${tokenData.tokens?.length || 0} tokens reçus`);
            
            // Enrichir les tokens avec Geckoterminal (limité pour éviter timeout)
            let enrichedTokens = tokenData.tokens || [];
            if (enrichedTokens.length > 0) {
              console.log(`🔄 [TOKENS PNL] Enrichissement Gecko de ${Math.min(enrichedTokens.length, 10)} tokens`);
              
              for (let i = 0; i < Math.min(enrichedTokens.length, 10); i++) {
                if (enrichedTokens[i].token_address) {
                  try {
                    // Adapter le format pour enrichTokenWithGecko
                    const tokenToEnrich = {
                      token_address: enrichedTokens[i].token_address,
                      symbol: enrichedTokens[i].symbol,
                      name: enrichedTokens[i].name,
                      ...enrichedTokens[i]
                    };
                    enrichedTokens[i] = await enrichTokenWithGecko(tokenToEnrich);
                  } catch (enrichError) {
                    console.log(`⚠️ [TOKENS PNL] Erreur enrichissement token ${i}: ${enrichError.message}`);
                    // Continuer sans enrichissement pour ce token
                  }
                }
              }
            }
            
            console.log(`✅ [TOKENS PNL] Données complètes récupérées et enrichies`);
            
            return new Response(JSON.stringify({
              success: true,
              data: {
                ...tokenData,
                tokens: enrichedTokens
              },
              source: 'CIELO_TRPC_DIRECT',
              endpoint_used: 'profile.fetchTokenPnlSlow',
              trpc_equivalent: 'profile.fetchTokenPnlSlow',
              trpc_url: trpcUrl,
              metadata: {
                wallet: walletAddress,
                parameters: { page, chains, timeframe, sortBy, tokenFilter },
                enriched_with_gecko: true,
                trpc_direct_call: true
              },
              timestamp: new Date().toISOString()
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
          } catch (error) {
            console.error(`❌ [TOKENS PNL] Erreur TRPC: ${error.message}`);
            
            // Fallback vers l'ancienne méthode enhanced-stats en cas d'erreur TRPC
            console.log(`🔄 [TOKENS PNL] Fallback vers enhanced-stats...`);
            
            const fallbackEndpoint = `/enhanced-stats/aggregated/${walletAddress}?days=max`;
            const fallbackData = await cieloRequest(fallbackEndpoint);
            
            if (fallbackData?.data) {
              const statsData = fallbackData.data;
              const allTokens: any[] = [];
              
              // Extraire les tokens depuis enhanced-stats comme avant
              if (statsData.top_trade_tokens && Array.isArray(statsData.top_trade_tokens)) {
                allTokens.push(...statsData.top_trade_tokens.map((token: any) => ({ ...token, category: 'top' })));
              }
              
              if (statsData.worst_trade_tokens && Array.isArray(statsData.worst_trade_tokens)) {
                allTokens.push(...statsData.worst_trade_tokens.map((token: any) => ({ ...token, category: 'worst' })));
              }
              
              if (statsData.most_traded_token) {
                const mostTradedExists = allTokens.find((t: any) => t.address === statsData.most_traded_token.address);
                if (!mostTradedExists) {
                  allTokens.push({ ...statsData.most_traded_token, category: 'most_traded' });
                }
              }
              
              return new Response(JSON.stringify({
                success: true,
                data: {
                  tokens: allTokens,
                  total_tokens_traded: allTokens.length,
                  total_pnl_usd: statsData.total_pnl,
                  winrate: statsData.winrate,
                  total_roi_percentage: statsData.total_roi_percentage
                },
                source: 'CIELO_API_FALLBACK',
                endpoint_used: fallbackEndpoint,
                trpc_equivalent: 'profile.fetchTokenPnlSlow',
                fallback_reason: 'TRPC call failed',
                trpc_error: error.message,
                timestamp: new Date().toISOString()
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            
            throw error;
          }
        }

        default:
          return new Response(JSON.stringify({
            error: 'Unknown action',
            available_actions: ['portfolio', 'stats', 'stats-7d', 'profitability', 'profitability-7d', 'track-status', 'tokens-pnl', 'pnl', 'pnl-complete', 'complete', 'health'],
            example: '/cielo-api/portfolio/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error(`💥 [API ERROR] ${action} failed for ${walletAddress}:`, error.message);
      
      // Fallback vers les données stables
      console.log(`🔄 [FALLBACK] Using stable data for ${walletAddress}`);
      const fallbackData = getStableWalletData(walletAddress);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        fallback_data: fallbackData,
        source: 'FALLBACK_STABLE_DATA',
        timestamp: new Date().toISOString(),
        wallet_address: walletAddress
      }), {
        status: 200, // 200 car on retourne des données de fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error(`💥 [SERVER ERROR]:`, error.message);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
