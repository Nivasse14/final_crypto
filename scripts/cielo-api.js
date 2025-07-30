const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

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

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Fonction utilitaire pour faire des requêtes à l'API Cielo
async function cieloRequest(endpoint) {
  const fullUrl = `${CIELO_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`🌐 [CIELO REQUEST] ${fullUrl}`);
    console.log(`📤 [CIELO HEADERS]`, JSON.stringify(CIELO_CONFIG.headers, null, 2));
    
    const fetch = (await import('node-fetch')).default;
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

// Fonction utilitaire pour faire des requêtes à l'API Geckoterminal
async function geckoterminalRequest(endpoint) {
  const fullUrl = `${GECKOTERMINAL_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`🦎 [GECKO REQUEST] ${fullUrl}`);
    console.log(`📤 [GECKO HEADERS]`, JSON.stringify(GECKOTERMINAL_CONFIG.headers, null, 2));
    
    const fetch = (await import('node-fetch')).default;
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
    
    // Log de la structure pour le debug
    if (data.data) {
      console.log(`📊 [GECKO DATA TYPE]:`, data.data.type);
      if (data.data.attributes) {
        console.log(`🏷️ [GECKO ATTRIBUTES]:`, Object.keys(data.data.attributes).length, 'propriétés');
      }
      if (data.data.relationships) {
        console.log(`🔗 [GECKO RELATIONSHIPS]:`, Object.keys(data.data.relationships).length, 'relations');
      }
    }
    
    if (data.included && Array.isArray(data.included)) {
      console.log(`📦 [GECKO INCLUDED] ${data.included.length} éléments`);
      const includedTypes = data.included.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});
      console.log(`🏷️ [GECKO INCLUDED TYPES]:`, includedTypes);
    }
    
    if (data.links) {
      console.log(`🔗 [GECKO LINKS]:`, Object.keys(data.links));
      if (data.links.top_pool) {
        console.log(`🔄 [GECKO REDIRECT] Redirection disponible vers: ${data.links.top_pool}`);
      }
    }
    
    return data;
  } catch (error) {
    // Ne pas logger les erreurs 404 comme des erreurs
    if (!error.message.includes('404')) {
      console.error(`💥 [GECKO ERROR] ${fullUrl}:`, error.message);
    }
    throw error;
  }
}

// Fonction utilitaire pour calculer le market cap
function calculateMarketCap(priceUsd, circulatingSupply) {
  if (!priceUsd || !circulatingSupply || priceUsd === 0 || circulatingSupply === 0) {
    return null;
  }
  
  // Convertir les strings en nombres si nécessaire
  const price = typeof priceUsd === 'string' ? parseFloat(priceUsd) : priceUsd;
  const supply = typeof circulatingSupply === 'string' ? parseFloat(circulatingSupply) : circulatingSupply;
  
  if (isNaN(price) || isNaN(supply) || price <= 0 || supply <= 0) {
    return null;
  }
  
  return price * supply;
}

// Fonction utilitaire pour enrichir un token avec les données Geckoterminal complètes
async function enrichTokenWithGeckoterminalComplete(tokenAddress, network = 'solana') {
  try {
    // Validation de l'adresse du token
    if (!tokenAddress || tokenAddress === 'undefined' || tokenAddress === 'null' || tokenAddress.trim() === '') {
      return null;
    }

    // Vérifier que l'adresse semble valide (format Solana)
    if (tokenAddress.length !== 44 && tokenAddress.length !== 43) {
      return null;
    }

    // Gestion spéciale pour les tokens natifs/spéciaux
    const nativeTokens = {
      'So11111111111111111111111111111111111111112': {
        name: 'Wrapped SOL',
        symbol: 'SOL',
        address: 'So11111111111111111111111111111111111111112',
        decimals: 9,
        market_cap_usd: calculateMarketCap(200, 400000000) || 80000000000, // Prix approximatif * supply
        calculated_market_cap_usd: calculateMarketCap(200, 400000000),
        original_market_cap_usd: null,
        circulating_supply: 400000000,
        on_coingecko: true,
        security_data: {
          holder_count: 1000000,
          go_plus_data: {},
          soul_scanner_data: { mintable: "0", freezeable: "0" }
        },
        pool_data: {
          price_usd: 200,
          volume_24h_usd: 1000000000,
          gt_score: 95
        },
        reliability_score: { total_score: 95, factors: { security_score: 40, pool_score: 30, fundamentals_score: 25 } }
      }
    };

    // Si c'est un token natif/spécial, retourner les données pré-définies
    if (nativeTokens[tokenAddress]) {
      return nativeTokens[tokenAddress];
    }

    console.log(`🔍 Tentative d'enrichissement pour token: ${tokenAddress}`);

    // APPROCHE 1: Essayer directement avec l'adresse du token comme pool (avec redirection)
    try {
      console.log(`🎯 Approche 1: Test direct /pools/${tokenAddress}`);
      const directPoolEndpoint = `/${network}/pools/${tokenAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
      let poolDetail = await geckoterminalRequest(directPoolEndpoint);

      // Vérifier si on a une redirection
      const hasEmptyData = (!poolDetail.data?.attributes || Object.keys(poolDetail.data.attributes).length === 0) &&
                          (!poolDetail.data?.relationships || Object.keys(poolDetail.data.relationships).length === 0);

      if (hasEmptyData && poolDetail.links?.top_pool) {
        console.log(`🔄 Redirection détectée vers: ${poolDetail.links.top_pool}`);
        const topPoolUrl = poolDetail.links.top_pool;
        const topPoolMatch = topPoolUrl.match(/\/pools\/([^?]+)/);
        
        if (topPoolMatch && topPoolMatch[1]) {
          const topPoolAddress = topPoolMatch[1];
          console.log(`🎯 Redirection vers pool: ${topPoolAddress}`);
          const newEndpoint = `/${network}/pools/${topPoolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
          poolDetail = await geckoterminalRequest(newEndpoint);
        }
      }

      // Si on a des données valides, traiter directement
      if (poolDetail.data?.attributes && Object.keys(poolDetail.data.attributes).length > 0 && poolDetail.included) {
        console.log(`✅ Approche 1 réussie - Données récupérées`);
        
        const pool = poolDetail.data.attributes;
        const included = poolDetail.included || [];
        
        // Trouver les tokens et leurs métriques de sécurité
        const tokens = included.filter(item => item.type === 'token');
        const securityMetrics = included.filter(item => item.type === 'token_security_metric');
        const lockedLiquidities = included.filter(item => item.type === 'pool_locked_liquidity');
        
        // Trouver le token qui correspond à notre adresse
        const targetToken = tokens.find(token => 
          token.attributes.address.toLowerCase() === tokenAddress.toLowerCase()
        );

        const targetSecurityMetric = securityMetrics.find(metric => 
          targetToken && metric.relationships.token.data.id === targetToken.id
        );

        if (targetToken && pool) {
          console.log(`🎊 Token trouvé via approche directe: ${targetToken.attributes.symbol}`);
          
          // Calculer le market cap à partir du prix et de la supply
          const calculatedMarketCap = calculateMarketCap(
            pool.price_in_usd, 
            targetToken.attributes.circulating_supply
          );
          
          // Utiliser le market cap calculé en priorité, sinon celui de l'API
          const finalMarketCap = calculatedMarketCap || targetToken.attributes.market_cap_in_usd;
          
          console.log(`💰 Market Cap calculé pour ${targetToken.attributes.symbol}: ${calculatedMarketCap ? '$' + calculatedMarketCap.toLocaleString() : 'N/A'}`);
          
          // Calculer le score de fiabilité
          const reliabilityScore = calculateTokenReliabilityScore({
            pool: pool,
            token: targetToken.attributes,
            securityMetric: targetSecurityMetric?.attributes,
            lockedLiquidities: lockedLiquidities
          });

          return {
            address: targetToken.attributes.address,
            name: targetToken.attributes.name,
            symbol: targetToken.attributes.symbol,
            decimals: targetToken.attributes.decimals,
            image_url: targetToken.attributes.image_url,
            market_cap_usd: finalMarketCap,
            calculated_market_cap_usd: calculatedMarketCap,
            original_market_cap_usd: targetToken.attributes.market_cap_in_usd,
            circulating_supply: targetToken.attributes.circulating_supply,
            total_supply: targetToken.attributes.total_supply,
            links: targetToken.attributes.links,
            on_coingecko: targetToken.attributes.on_coingecko,
            on_pump_fun: targetToken.attributes.on_pump_fun,
            
            // Données de sécurité complètes
            security_data: targetSecurityMetric ? {
              holder_count: targetSecurityMetric.attributes.holder_count,
              go_plus_data: targetSecurityMetric.attributes.go_plus_token_security_data,
              soul_scanner_data: targetSecurityMetric.attributes.soul_scanner_data,
              honeypot_scanner_data: targetSecurityMetric.attributes.honeypot_scanner_data,
              trench_radar_data: targetSecurityMetric.attributes.trench_radar_data,
              defi_scanner_data: targetSecurityMetric.attributes.defi_scanner_data
            } : null,
            
            // Données du pool
            pool_data: {
              pool_address: pool.address,
              pool_name: pool.name,
              price_usd: pool.price_in_usd,
              price_change_24h: pool.price_percent_changes?.last_24h,
              price_change_1h: pool.price_percent_changes?.last_1h,
              price_change_5m: pool.price_percent_changes?.last_5m,
              volume_24h_usd: pool.from_volume_in_usd,
              volume_1h_usd: pool.volume_in_usd_1h,
              reserve_usd: pool.reserve_in_usd,
              fully_diluted_valuation: pool.fully_diluted_valuation,
              market_cap_usd: pool.market_cap_in_usd,
              gt_score: pool.gt_score,
              gt_score_details: pool.gt_score_details,
              swap_count_24h: pool.swap_count_24h,
              created_at: pool.pool_created_at,
              security_indicators: pool.security_indicators || [],
              sentiment_votes: pool.sentiment_votes
            },
            
            // Liquidité verrouillée
            liquidity_locked: lockedLiquidities.length > 0 ? {
              locked_percent: lockedLiquidities[0].attributes.locked_percent,
              source: lockedLiquidities[0].attributes.source,
              url: lockedLiquidities[0].attributes.url
            } : null,
            
            // Score de fiabilité calculé
            reliability_score: reliabilityScore
          };
        }
      }
    } catch (directError) {
      console.log(`⚠️ Approche 1 échouée: ${directError.message}`);
    }

    // APPROCHE 2: Fallback - Rechercher les pools pour ce token (approche classique)
    console.log(`🔍 Approche 2: Recherche via /tokens/${tokenAddress}/pools`);
    const poolsEndpoint = `/${network}/tokens/${tokenAddress}/pools`;
    const poolsData = await geckoterminalRequest(poolsEndpoint);

    // Gérer le cas où le token n'existe pas sur Geckoterminal
    if (!poolsData || poolsData.error === 'not_found' || !poolsData.data || poolsData.data.length === 0) {
      console.log(`🔍 Aucun pool trouvé pour le token ${tokenAddress} sur Geckoterminal (via les deux approches)`);
      return null;
    }

    console.log(`🏊 Trouvé ${poolsData.data.length} pool(s) pour le token ${tokenAddress}`);

    // Prendre le pool avec le plus de liquidité
    const bestPool = poolsData.data.reduce((best, current) => {
      const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
      const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
      return currentReserve > bestReserve ? current : best;
    });

    const bestPoolAddress = bestPool.attributes.address;
    console.log(`🎯 Meilleur pool sélectionné: ${bestPoolAddress}`);

    // Récupérer les données complètes du pool avec gestion de redirection
    const endpoint = `/${network}/pools/${bestPoolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
    let poolDetail = await geckoterminalRequest(endpoint);

    // Vérifier si attributes et relationships sont vides et rediriger si nécessaire
    const hasEmptyData = (!poolDetail.data?.attributes || Object.keys(poolDetail.data.attributes).length === 0) &&
                        (!poolDetail.data?.relationships || Object.keys(poolDetail.data.relationships).length === 0);

    console.log(`📊 Pool detail - Attributes vides: ${!poolDetail.data?.attributes || Object.keys(poolDetail.data.attributes).length === 0}, Relationships vides: ${!poolDetail.data?.relationships || Object.keys(poolDetail.data.relationships).length === 0}`);
    
    if (hasEmptyData && poolDetail.links?.top_pool) {
      console.log(`🔄 Redirection détectée vers: ${poolDetail.links.top_pool}`);
      try {
        const topPoolUrl = poolDetail.links.top_pool;
        const topPoolMatch = topPoolUrl.match(/\/pools\/([^?]+)/);
        
        if (topPoolMatch && topPoolMatch[1]) {
          const topPoolAddress = topPoolMatch[1];
          console.log(`🎯 Nouveau pool address: ${topPoolAddress}`);
          const newEndpoint = `/${network}/pools/${topPoolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
          poolDetail = await geckoterminalRequest(newEndpoint);
          console.log(`✅ Redirection réussie - Attributes: ${Object.keys(poolDetail.data?.attributes || {}).length}, Included: ${poolDetail.included?.length || 0}`);
        }
      } catch (redirectError) {
        console.error('❌ Erreur redirection Geckoterminal:', redirectError);
      }
    }

    const pool = poolDetail.data?.attributes;
    const included = poolDetail.included || [];
    
    // Trouver les tokens et leurs métriques de sécurité
    const tokens = included.filter(item => item.type === 'token');
    const securityMetrics = included.filter(item => item.type === 'token_security_metric');
    const lockedLiquidities = included.filter(item => item.type === 'pool_locked_liquidité');
    
    // Trouver le token qui correspond à notre adresse
    const targetToken = tokens.find(token => 
      token.attributes.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    const targetSecurityMetric = securityMetrics.find(metric => 
      targetToken && metric.relationships.token.data.id === targetToken.id
    );

    if (!targetToken || !pool) {
      return null;
    }

    // Calculer le market cap à partir du prix et de la supply
    const calculatedMarketCap = calculateMarketCap(
      pool.price_in_usd, 
      targetToken.attributes.circulating_supply
    );
    
    // Utiliser le market cap calculé en priorité, sinon celui de l'API
    const finalMarketCap = calculatedMarketCap || targetToken.attributes.market_cap_in_usd;
    
    console.log(`💰 Market Cap calculé pour ${targetToken.attributes.symbol}: ${calculatedMarketCap ? '$' + calculatedMarketCap.toLocaleString() : 'N/A'}`);

    // Calculer le score de fiabilité
    const reliabilityScore = calculateTokenReliabilityScore({
      pool: pool,
      token: targetToken.attributes,
      securityMetric: targetSecurityMetric?.attributes,
      lockedLiquidities: lockedLiquidities
    });

    return {
      address: targetToken.attributes.address,
      name: targetToken.attributes.name,
      symbol: targetToken.attributes.symbol,
      decimals: targetToken.attributes.decimals,
      image_url: targetToken.attributes.image_url,
      market_cap_usd: finalMarketCap,
      calculated_market_cap_usd: calculatedMarketCap,
      original_market_cap_usd: targetToken.attributes.market_cap_in_usd,
      circulating_supply: targetToken.attributes.circulating_supply,
      total_supply: targetToken.attributes.total_supply,
      links: targetToken.attributes.links,
      on_coingecko: targetToken.attributes.on_coingecko,
      on_pump_fun: targetToken.attributes.on_pump_fun,
      
      // Données de sécurité complètes
      security_data: targetSecurityMetric ? {
        holder_count: targetSecurityMetric.attributes.holder_count,
        go_plus_data: targetSecurityMetric.attributes.go_plus_token_security_data,
        soul_scanner_data: targetSecurityMetric.attributes.soul_scanner_data,
        honeypot_scanner_data: targetSecurityMetric.attributes.honeypot_scanner_data,
        trench_radar_data: targetSecurityMetric.attributes.trench_radar_data,
        defi_scanner_data: targetSecurityMetric.attributes.defi_scanner_data
      } : null,
      
      // Données du pool
      pool_data: {
        pool_address: pool.address,
        pool_name: pool.name,
        price_usd: pool.price_in_usd,
        price_change_24h: pool.price_percent_changes?.last_24h,
        price_change_1h: pool.price_percent_changes?.last_1h,
        price_change_5m: pool.price_percent_changes?.last_5m,
        volume_24h_usd: pool.from_volume_in_usd,
        volume_1h_usd: pool.volume_in_usd_1h,
        reserve_usd: pool.reserve_in_usd,
        fully_diluted_valuation: pool.fully_diluted_valuation,
        market_cap_usd: pool.market_cap_in_usd,
        gt_score: pool.gt_score,
        gt_score_details: pool.gt_score_details,
        swap_count_24h: pool.swap_count_24h,
        created_at: pool.pool_created_at,
        security_indicators: pool.security_indicators || [],
        sentiment_votes: pool.sentiment_votes
      },
      
      // Liquidité verrouillée
      liquidity_locked: lockedLiquidities.length > 0 ? {
        locked_percent: lockedLiquidities[0].attributes.locked_percent,
        source: lockedLiquidities[0].attributes.source,
        url: lockedLiquidities[0].attributes.url
      } : null,
      
      // Score de fiabilité calculé
      reliability_score: reliabilityScore
    };

  } catch (error) {
    // Ne pas logger les erreurs pour les tokens non trouvés (404)
    if (error.message && error.message.includes('404')) {
      return null;
    }
    console.error(`Erreur enrichissement Geckoterminal complet pour ${tokenAddress}:`, error);
    return null;
  }
}

// Fonction pour enrichir le portfolio avec Geckoterminal (version complète)
async function enrichPortfolioWithGeckoterminalComplete(portfolioData, network = 'solana') {
  if (!portfolioData?.data?.portfolio) {
    return portfolioData;
  }

  const tokens = portfolioData.data.portfolio;
  const enrichedTokens = [];

  console.log(`🔍 Enrichissement complet de ${tokens.length} tokens du portfolio...`);

  // Traiter les tokens par batch de 2 pour éviter surcharge (mais sans limite de nombre)
  const batchSize = 2;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (token) => {
      // Vérifier que l'adresse du token est valide avant d'essayer de l'enrichir
      // Pour les tokens portfolio, utiliser mint en priorité
      const tokenAddress = token.mint || token.token_address || token.address;
      if (!tokenAddress || tokenAddress === 'undefined' || tokenAddress === 'null' || tokenAddress.trim() === '') {
        console.log(`⚠️ Token portfolio ${i + batch.indexOf(token) + 1}/${tokens.length}: Adresse manquante - ${token.symbol || token.token_symbol || 'N/A'}`);
        return {
          ...token,
          geckoterminal_enriched: false,
          geckoterminal_complete_data: null,
          geckoterminal_error: 'Token address missing'
        };
      }

      console.log(`📊 Enrichissement token ${i + batch.indexOf(token) + 1}/${tokens.length}: ${token.symbol || token.token_symbol || 'N/A'} (${tokenAddress})`);
      const geckoData = await enrichTokenWithGeckoterminalComplete(tokenAddress, network);
      
      return {
        ...token,
        geckoterminal_enriched: !!geckoData,
        geckoterminal_complete_data: geckoData || null
      };
    });

    const batchResults = await Promise.all(batchPromises);
    enrichedTokens.push(...batchResults);

    // Pause entre les batches pour éviter rate limiting
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    ...portfolioData,
    data: {
      ...portfolioData.data,
      portfolio: enrichedTokens,
      geckoterminal_enrichment_stats: {
        total_tokens: tokens.length,
        enriched_tokens: enrichedTokens.filter(t => t.geckoterminal_enriched).length,
        enrichment_completion: 'COMPLETE',
        tokens_with_market_cap: enrichedTokens.filter(t => t.geckoterminal_complete_data?.market_cap_usd).length,
        tokens_with_security_data: enrichedTokens.filter(t => t.geckoterminal_complete_data?.security_data).length,
        average_reliability_score: enrichedTokens
          .filter(t => t.geckoterminal_complete_data?.reliability_score)
          .reduce((sum, t, _, arr) => sum + t.geckoterminal_complete_data.reliability_score.total_score / arr.length, 0) || 0
      }
    }
  };
}

// Fonction pour enrichir les tokens PnL avec Geckoterminal (version complète)
async function enrichPnLWithGeckoterminalComplete(pnlData, network = 'solana') {
  if (!pnlData?.data?.tokens) {
    return pnlData;
  }

  const tokens = pnlData.data.tokens; // TOUS les tokens, sans limite
  const enrichedTokens = [];

  console.log(`🔍 Enrichissement complet de ${tokens.length} tokens PnL...`);

  // Traiter les tokens par batch de 2 pour éviter surcharge
  const batchSize = 2;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (token) => {
      // Vérifier que l'adresse du token est valide avant d'essayer de l'enrichir
      // Pour les tokens PnL, utiliser token_address en priorité
      const tokenAddress = token.token_address || token.mint || token.address;
      if (!tokenAddress || tokenAddress === 'undefined' || tokenAddress === 'null' || tokenAddress.trim() === '') {
        console.log(`⚠️ Token PnL ${i + batch.indexOf(token) + 1}/${tokens.length}: Adresse manquante - ${token.token_symbol || 'N/A'}`);
        return {
          ...token,
          geckoterminal_enriched: false,
          geckoterminal_complete_data: null,
          geckoterminal_error: 'Token address missing'
        };
      }

      console.log(`📊 Enrichissement token PnL ${i + batch.indexOf(token) + 1}/${tokens.length}: ${token.token_symbol || 'N/A'} (${tokenAddress})`);
      
      try {
        const geckoData = await enrichTokenWithGeckoterminalComplete(tokenAddress, network);
        
        if (geckoData) {
          console.log(`✅ Token enrichi: ${token.token_symbol} - Market cap: ${geckoData.market_cap_usd || 'N/A'}`);
        } else {
          console.log(`❌ Enrichissement échoué pour: ${token.token_symbol} (${tokenAddress})`);
        }
        
        return {
          ...token,
          geckoterminal_enriched: !!geckoData,
          geckoterminal_complete_data: geckoData || null
        };
      } catch (error) {
        console.log(`💥 Erreur enrichissement: ${token.token_symbol} (${tokenAddress}) - ${error.message}`);
        return {
          ...token,
          geckoterminal_enriched: false,
          geckoterminal_complete_data: null,
          geckoterminal_error: error.message
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    enrichedTokens.push(...batchResults);

    // Pause entre les batches pour éviter rate limiting
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    ...pnlData,
    data: {
      ...pnlData.data,
      tokens: enrichedTokens,
      geckoterminal_enrichment_stats: {
        total_tokens: tokens.length,
        enriched_tokens: enrichedTokens.filter(t => t.geckoterminal_enriched).length,
        enrichment_completion: 'COMPLETE',
        tokens_with_market_cap: enrichedTokens.filter(t => t.geckoterminal_complete_data?.market_cap_usd).length,
        tokens_with_security_data: enrichedTokens.filter(t => t.geckoterminal_complete_data?.security_data).length,
        average_reliability_score: enrichedTokens
          .filter(t => t.geckoterminal_complete_data?.reliability_score)
          .reduce((sum, t, _, arr) => sum + t.geckoterminal_complete_data.reliability_score.total_score / arr.length, 0) || 0
      }
    }
  };
}

// Fonction pour enrichir les tokens PnL avec Geckoterminal (version limitée)
async function enrichPnLWithGeckoterminal(pnlData, network = 'solana', maxTokens = 10) {
  if (!pnlData?.data?.tokens) {
    return pnlData;
  }

  const tokens = pnlData.data.tokens.slice(0, maxTokens); // Limiter le nombre de tokens
  const enrichedTokens = [];

  console.log(`🔍 Enrichissement limité de ${tokens.length} tokens PnL (max: ${maxTokens})...`);

  // Traiter les tokens par batch de 2 pour éviter surcharge
  const batchSize = 2;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (token) => {
      // Vérifier que l'adresse du token est valide avant d'essayer de l'enrichir
      // Pour les tokens PnL, utiliser token_address en priorité
      const tokenAddress = token.token_address || token.mint || token.address;
      if (!tokenAddress || tokenAddress === 'undefined' || tokenAddress === 'null' || tokenAddress.trim() === '') {
        console.log(`⚠️ Token PnL ${i + batch.indexOf(token) + 1}/${tokens.length}: Adresse manquante - ${token.token_symbol || 'N/A'}`);
        return {
          ...token,
          geckoterminal_enriched: false,
          geckoterminal_complete_data: null,
          geckoterminal_error: 'Token address missing'
        };
      }

      console.log(`📊 Enrichissement token PnL ${i + batch.indexOf(token) + 1}/${tokens.length}: ${token.token_symbol || 'N/A'} (${tokenAddress})`);
      
      try {
        const geckoData = await enrichTokenWithGeckoterminalComplete(tokenAddress, network);
        
        if (geckoData) {
          console.log(`✅ Token enrichi: ${token.token_symbol} - Market cap: ${geckoData.market_cap_usd || 'N/A'}`);
        } else {
          console.log(`❌ Enrichissement échoué pour: ${token.token_symbol} (${tokenAddress})`);
        }
        
        return {
          ...token,
          geckoterminal_enriched: !!geckoData,
          geckoterminal_complete_data: geckoData || null
        };
      } catch (error) {
        console.log(`💥 Erreur enrichissement: ${token.token_symbol} (${tokenAddress}) - ${error.message}`);
        return {
          ...token,
          geckoterminal_enriched: false,
          geckoterminal_complete_data: null,
          geckoterminal_error: error.message
        };
      }
      
      return {
        ...token,
        geckoterminal_enriched: !!geckoData,
        geckoterminal_complete_data: geckoData || null
      };
    });

    const batchResults = await Promise.all(batchPromises);
    enrichedTokens.push(...batchResults);

    // Pause entre les batches pour éviter rate limiting
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Ajouter les tokens non traités (sans enrichissement)
  const remainingTokens = pnlData.data.tokens.slice(maxTokens);
  const remainingTokensWithFlag = remainingTokens.map(token => ({
    ...token,
    geckoterminal_enriched: false,
    geckoterminal_complete_data: null,
    geckoterminal_error: 'Not processed due to limit'
  }));

  const allTokens = [...enrichedTokens, ...remainingTokensWithFlag];

  return {
    ...pnlData,
    data: {
      ...pnlData.data,
      tokens: allTokens,
      geckoterminal_enrichment_stats: {
        total_tokens: pnlData.data.tokens.length,
        processed_tokens: tokens.length,
        enriched_tokens: enrichedTokens.filter(t => t.geckoterminal_enriched).length,
        enrichment_completion: maxTokens >= pnlData.data.tokens.length ? 'COMPLETE' : 'LIMITED',
        tokens_with_market_cap: enrichedTokens.filter(t => t.geckoterminal_complete_data?.market_cap_usd).length,
        tokens_with_security_data: enrichedTokens.filter(t => t.geckoterminal_complete_data?.security_data).length,
        average_reliability_score: enrichedTokens
          .filter(t => t.geckoterminal_complete_data?.reliability_score)
          .reduce((sum, t, _, arr) => sum + t.geckoterminal_complete_data.reliability_score.total_score / arr.length, 0) || 0
      }
    }
  };
}

function loadWallets() {
  try {
    const walletsPath = path.join(__dirname, 'dune_wallets.json');
    const walletsData = fs.readFileSync(walletsPath, 'utf8');
    return JSON.parse(walletsData);
  } catch (error) {
    console.error('Erreur chargement wallets:', error);
    return [];
  }
}

// Fonction pour sauvegarder les données
function saveData(data, filename) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(__dirname, `${filename}_${timestamp}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Données sauvegardées: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    return null;
  }
}

// Fonction pour extraire les métriques importantes d'un token
function extractTokenMetrics(tokenData, poolData, securityData) {
  const token = tokenData.attributes;
  const pool = poolData ? poolData.attributes : null;
  const security = securityData ? securityData.attributes : null;

  return {
    // Informations de base du token
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    image_url: token.image_url,
    market_cap_in_usd: token.market_cap_in_usd,
    circulating_supply: token.circulating_supply,
    
    // Liens sociaux et verification
    links: token.links,
    on_coingecko: token.on_coingecko,
    on_pump_fun: token.on_pump_fun,
    
    // Métriques de sécurité
    security_metrics: security ? {
      holder_count: security.holder_count,
      soul_scanner: security.soul_scanner_data,
      go_plus: security.go_plus_token_security_data,
      honeypot_scanner: security.honeypot_scanner_data,
      defi_scanner: security.defi_scanner_data,
      trench_radar: security.trench_radar_data,
      deployer: security.soul_scanner_data?.deployer,
      mintable: security.soul_scanner_data?.mintable,
      freezeable: security.soul_scanner_data?.freezeable,
      bundled_buy_percentage: security.soul_scanner_data?.bundled_buy_percentage
    } : null,
    
    // Métriques de pool (si disponible)
    pool_metrics: pool ? {
      pool_address: pool.address,
      reserve_in_usd: pool.reserve_in_usd,
      price_in_usd: pool.price_in_usd,
      fully_diluted_valuation: pool.fully_diluted_valuation,
      volume_24h_usd: pool.from_volume_in_usd,
      swap_count_24h: pool.swap_count_24h,
      price_percent_changes: pool.price_percent_changes,
      gt_score: pool.gt_score,
      gt_score_details: pool.gt_score_details,
      security_indicators: pool.security_indicators,
      sentiment_votes: pool.sentiment_votes,
      pool_created_at: pool.pool_created_at,
      reserve_threshold_met: pool.reserve_threshold_met
    } : null,
    
    // Score de fiabilité calculé
    reliability_score: calculateReliabilityScore(security, pool, token)
  };
}

// Fonction pour calculer un score de fiabilité
function calculateReliabilityScore(security, pool, token) {
  let score = 0;
  let maxScore = 100;
  
  // Vérifications de sécurité (40 points max)
  if (security) {
    // Nombre de holders (15 points)
    const holders = security.holder_count || 0;
    if (holders > 10000) score += 15;
    else if (holders > 5000) score += 12;
    else if (holders > 1000) score += 8;
    else if (holders > 100) score += 4;
    
    // Soul scanner checks (10 points)
    if (security.soul_scanner_data) {
      const soul = security.soul_scanner_data;
      if (soul.mintable === "0") score += 3;
      if (soul.freezeable === "0") score += 3;
      if (soul.bundled_buy_percentage && soul.bundled_buy_percentage < 10) score += 4;
    }
    
    // Honeypot et autres scanners (15 points)
    if (security.honeypot_scanner_data && Object.keys(security.honeypot_scanner_data).length === 0) score += 5;
    if (security.go_plus_token_security_data && Object.keys(security.go_plus_token_security_data).length === 0) score += 5;
    if (security.defi_scanner_data && Object.keys(security.defi_scanner_data).length === 0) score += 5;
  }
  
  // Métriques de pool (30 points max)
  if (pool) {
    // GT Score (15 points)
    if (pool.gt_score) {
      score += Math.min(15, (pool.gt_score / 100) * 15);
    }
    
    // Volume et activité (10 points)
    const volume24h = parseFloat(pool.from_volume_in_usd) || 0;
    if (volume24h > 1000000) score += 10;
    else if (volume24h > 100000) score += 8;
    else if (volume24h > 10000) score += 6;
    else if (volume24h > 1000) score += 3;
    
    // Réserves (5 points)
    if (pool.reserve_threshold_met) score += 5;
  }
  
  // Vérifications générales (30 points max)
  // Présence sur CoinGecko (10 points)
  if (token.on_coingecko) score += 10;
  
  // Liens sociaux (10 points)
  if (token.links) {
    let socialScore = 0;
    if (token.links.twitter_handle) socialScore += 3;
    if (token.links.websites && token.links.websites.length > 0) socialScore += 3;
    if (token.links.telegram_handle) socialScore += 2;
    if (token.links.discord_url) socialScore += 2;
    score += Math.min(10, socialScore);
  }
  
  // Market cap et supply (10 points)
  if (token.market_cap_in_usd && token.market_cap_in_usd > 0) score += 5;
  if (token.circulating_supply && token.circulating_supply > 0) score += 5;
  
  return Math.round((score / maxScore) * 100);
}

// Fonction pour calculer le score de fiabilité d'un token (version améliorée)
function calculateTokenReliabilityScore({ pool, token, securityMetric, lockedLiquidities }) {
  let score = 0;
  let maxScore = 100;
  
  // Vérifications de sécurité (40 points max)
  if (securityMetric) {
    // Nombre de holders (15 points)
    const holders = securityMetric.holder_count || 0;
    if (holders > 10000) score += 15;
    else if (holders > 5000) score += 12;
    else if (holders > 1000) score += 8;
    else if (holders > 100) score += 4;
    
    // Soul scanner checks (10 points)
    if (securityMetric.soul_scanner_data) {
      const soul = securityMetric.soul_scanner_data;
      if (soul.mintable === "0") score += 3;
      if (soul.freezeable === "0") score += 3;
      if (soul.bundled_buy_percentage && soul.bundled_buy_percentage < 10) score += 4;
    }
    
    // Honeypot et autres scanners (15 points)
    if (securityMetric.honeypot_scanner_data && Object.keys(securityMetric.honeypot_scanner_data).length === 0) score += 5;
    if (securityMetric.go_plus_token_security_data && Object.keys(securityMetric.go_plus_token_security_data).length === 0) score += 5;
    if (securityMetric.defi_scanner_data && Object.keys(securityMetric.defi_scanner_data).length === 0) score += 5;
  }
  
  // Métriques de pool (30 points max)
  if (pool) {
    // GT Score (15 points)
    if (pool.gt_score) {
      score += Math.min(15, (pool.gt_score / 100) * 15);
    }
    
    // Volume et activité (10 points)
    const volume24h = parseFloat(pool.from_volume_in_usd) || 0;
    if (volume24h > 1000000) score += 10;
    else if (volume24h > 100000) score += 8;
    else if (volume24h > 10000) score += 6;
    else if (volume24h > 1000) score += 3;
    
    // Réserves (5 points)
    if (pool.reserve_threshold_met) score += 5;
  }
  
  // Vérifications générales (30 points max)
  // Présence sur CoinGecko (10 points)
  if (token.on_coingecko) score += 10;
  
  // Liens sociaux (10 points)
  if (token.links) {
    let socialScore = 0;
    if (token.links.twitter_handle) socialScore += 3;
    if (token.links.websites && token.links.websites.length > 0) socialScore += 3;
    if (token.links.telegram_handle) socialScore += 2;
    if (token.links.discord_url) socialScore += 2;
    score += Math.min(10, socialScore);
  }
  
  // Market cap et supply (10 points)
  if (token.market_cap_in_usd && token.market_cap_in_usd > 0) score += 5;
  if (token.circulating_supply && token.circulating_supply > 0) score += 5;

  return {
    total_score: Math.max(0, Math.min(100, score)),
    factors: {
      security_score: securityMetric ? Math.min(40, score * 0.4) : 0,
      pool_score: pool ? Math.min(30, score * 0.3) : 0,
      fundamentals_score: Math.min(30, score * 0.3)
    }
  };
}

// API 1: Récupérer les statistiques de trading pour une période donnée
app.get('/api/cielo/stats/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { days = 'max' } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `stats_${wallet}_${days}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    const endpoint = `/enhanced-stats/aggregated/${wallet}?days=${days}`;
    const data = await cieloRequest(endpoint);

    // Mettre en cache
    cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: data
    });

  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ 
      error: 'Erreur récupération statistiques',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 2: Récupérer le portfolio actuel d'un wallet
app.get('/api/cielo/portfolio/:wallet', async (req, res) => {
  const { wallet } = req.params;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `portfolio_${wallet}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    const endpoint = `/${wallet}/portfolio`;
    const rawData = await cieloRequest(endpoint);

    // Enrichir avec Geckoterminal
    console.log(`Enrichissement portfolio Geckoterminal pour: ${wallet}`);
    const enrichedData = await enrichPortfolioWithGeckoterminalComplete(rawData);

    // Mettre en cache
    cache.set(cacheKey, {
      data: enrichedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: enrichedData
    });

  } catch (error) {
    console.error('Erreur portfolio:', error);
    res.status(500).json({ 
      error: 'Erreur récupération portfolio',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 3: Récupérer les PnL des tokens tradés
app.get('/api/cielo/pnl/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { page = 1, skip_unrealized_pnl = false } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `pnl_${wallet}_${page}_${skip_unrealized_pnl}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    const endpoint = `/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=${skip_unrealized_pnl}&page=${page}`;
    const rawData = await cieloRequest(endpoint);

    // Enrichir avec Geckoterminal (limité à 10 tokens pour une page)
    console.log(`Enrichissement PnL Geckoterminal pour: ${wallet} (page ${page})`);
    const enrichedData = await enrichPnLWithGeckoterminal(rawData, 'solana', 10);

    // Mettre en cache
    cache.set(cacheKey, {
      data: enrichedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: enrichedData
    });

  } catch (error) {
    console.error('Erreur PnL:', error);
    res.status(500).json({ 
      error: 'Erreur récupération PnL',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 4: Récupérer toutes les pages de PnL pour un wallet
app.get('/api/cielo/pnl-complete/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { skip_unrealized_pnl = false } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `pnl_complete_${wallet}_${skip_unrealized_pnl}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Récupérer la première page pour connaître le nombre total de pages
    const firstPageEndpoint = `/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=${skip_unrealized_pnl}&page=1`;
    const firstPageData = await cieloRequest(firstPageEndpoint);

    const totalPages = firstPageData.paging?.total_pages || 1;
    const allTokens = [...firstPageData.data.tokens];

    // Récupérer les pages suivantes
    for (let page = 2; page <= totalPages; page++) {
      const pageEndpoint = `/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=${skip_unrealized_pnl}&page=${page}`;
      const pageData = await cieloRequest(pageEndpoint);
      allTokens.push(...pageData.data.tokens);
    }

    const rawCompleteData = {
      ...firstPageData,
      data: {
        ...firstPageData.data,
        tokens: allTokens
      },
      total_tokens_retrieved: allTokens.length
    };

    // Enrichir avec Geckoterminal (limité à 20 tokens pour éviter timeout)
    console.log(`Enrichissement PnL complet Geckoterminal pour: ${wallet}`);
    const enrichedCompleteData = await enrichPnLWithGeckoterminal(rawCompleteData, 'solana', 20);

    // Mettre en cache
    cache.set(cacheKey, {
      data: enrichedCompleteData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: enrichedCompleteData
    });

  } catch (error) {
    console.error('Erreur PnL complet:', error);
    res.status(500).json({ 
      error: 'Erreur récupération PnL complet',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 5: Données consolidées pour un wallet
app.get('/api/cielo/complete/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { days_stats = 'max' } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `complete_${wallet}_${days_stats}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération données complètes pour: ${wallet}`);

    // Récupérer toutes les données Cielo en parallèle
    const [statsData, portfolioDataRaw, pnlCompleteDataRaw] = await Promise.all([
      cieloRequest(`/enhanced-stats/aggregated/${wallet}?days=${days_stats}`),
      cieloRequest(`/${wallet}/portfolio`),
      (async () => {
        const firstPage = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=1`);
        const totalPages = firstPage.paging?.total_pages || 1;
        const allTokens = [...firstPage.data.tokens];

        for (let page = 2; page <= totalPages; page++) {
          const pageData = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=${page}`);
          allTokens.push(...pageData.data.tokens);
        }

        return {
          ...firstPage,
          data: {
            ...firstPage.data,
            tokens: allTokens
          }
        };
      })()
    ]);

    // Enrichir les données avec Geckoterminal (COMPLET, sans limites)
    console.log(`Enrichissement Geckoterminal complet pour: ${wallet}`);
    const [enrichedPortfolioData, enrichedPnLData] = await Promise.all([
      enrichPortfolioWithGeckoterminalComplete(portfolioDataRaw),
      enrichPnLWithGeckoterminalComplete(pnlCompleteDataRaw, 'solana') // SANS LIMITE
    ]);

    // Calculer les statistiques enrichies
    const portfolioStats = enrichedPortfolioData.data.geckoterminal_enrichment_stats;
    const pnlStats = enrichedPnLData.data.geckoterminal_enrichment_stats;

    const consolidatedData = {
      wallet: wallet,
      timestamp: new Date().toISOString(),
      stats: statsData,
      portfolio: enrichedPortfolioData,
      pnl: enrichedPnLData,
      summary: {
        // Métriques Cielo originales
        total_tokens_traded: pnlCompleteDataRaw.data.total_tokens_traded,
        total_pnl_usd: pnlCompleteDataRaw.data.total_pnl_usd,
        winrate: pnlCompleteDataRaw.data.winrate,
        current_portfolio_value: portfolioDataRaw.data.total_usd,
        current_holdings_count: portfolioDataRaw.data.portfolio.length,
        trading_stats_period: days_stats,
        
        // Métriques Geckoterminal enrichies (COMPLET)
        geckoterminal_enrichment: {
          portfolio_enriched_tokens: portfolioStats?.enriched_tokens || 0,
          portfolio_tokens_with_market_cap: portfolioStats?.tokens_with_market_cap || 0,
          portfolio_tokens_with_security_data: portfolioStats?.tokens_with_security_data || 0,
          portfolio_avg_reliability: Math.round(portfolioStats?.average_reliability_score || 0),
          pnl_enriched_tokens: pnlStats?.enriched_tokens || 0,
          pnl_tokens_with_market_cap: pnlStats?.tokens_with_market_cap || 0,
          pnl_tokens_with_security_data: pnlStats?.tokens_with_security_data || 0,
          pnl_avg_reliability: Math.round(pnlStats?.average_reliability_score || 0),
          total_enriched_tokens: (portfolioStats?.enriched_tokens || 0) + (pnlStats?.enriched_tokens || 0),
          total_tokens_processed: (portfolioStats?.total_tokens || 0) + (pnlStats?.total_tokens || 0),
          enrichment_completion_status: 'COMPLETE - Aucune limite appliquée'
        }
      }
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: consolidatedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: consolidatedData
    });

  } catch (error) {
    console.error('Erreur données complètes:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données complètes',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 6: Traitement en lot de tous les wallets du fichier dune_wallets.json
app.post('/api/cielo/batch-process', async (req, res) => {
  const { days_stats = 'max', save_to_file = true } = req.body;

  try {
    const wallets = loadWallets();
    
    if (!wallets || wallets.length === 0) {
      return res.status(400).json({ error: 'Aucun wallet trouvé dans dune_wallets.json' });
    }

    console.log(`Traitement en lot de ${wallets.length} wallets`);

    const results = [];
    const errors = [];

    // Traiter les wallets par batch de 5 pour éviter la surcharge
    const batchSize = 5;
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (walletItem) => {
        const wallet = walletItem.wallet || walletItem.address || walletItem;
        
        try {
          console.log(`Traitement wallet ${i + batch.indexOf(walletItem) + 1}/${wallets.length}: ${wallet}`);
          
          const [statsData, portfolioData, pnlCompleteData] = await Promise.all([
            cieloRequest(`/enhanced-stats/aggregated/${wallet}?days=${days_stats}`),
            cieloRequest(`/${wallet}/portfolio`),
            (async () => {
              const firstPage = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=1`);
              const totalPages = firstPage.paging?.total_pages || 1;
              const allTokens = [...firstPage.data.tokens];

              for (let page = 2; page <= totalPages; page++) {
                const pageData = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=${page}`);
                allTokens.push(...pageData.data.tokens);
              }

              return {
                ...firstPage,
                data: {
                  ...firstPage.data,
                  tokens: allTokens
                }
              };
            })()
          ]);

          return {
            wallet: wallet,
            stats: statsData,
            portfolio: portfolioData,
            pnl: pnlCompleteData,
            summary: {
              total_tokens_traded: pnlCompleteData.data.total_tokens_traded,
              total_pnl_usd: pnlCompleteData.data.total_pnl_usd,
              winrate: pnlCompleteData.data.winrate,
              current_portfolio_value: portfolioData.data.total_usd,
              current_holdings_count: portfolioData.data.portfolio.length
            }
          };

        } catch (error) {
          console.error(`Erreur wallet ${wallet}:`, error.message);
          errors.push({
            wallet: wallet,
            error: error.message
          });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));

      // Pause entre les batches
      if (i + batchSize < wallets.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const finalData = {
      timestamp: new Date().toISOString(),
      total_wallets_processed: wallets.length,
      successful_wallets: results.length,
      failed_wallets: errors.length,
      wallets_data: results,
      errors: errors
    };

    // Sauvegarder si demandé
    let savedFile = null;
    if (save_to_file) {
      savedFile = saveData(finalData, 'cielo_batch_results');
    }

    res.json({
      success: true,
      data: finalData,
      saved_file: savedFile
    });

  } catch (error) {
    console.error('Erreur traitement en lot:', error);
    res.status(500).json({ 
      error: 'Erreur traitement en lot',
      message: error.message
    });
  }
});

// API 7: Vider le cache
app.delete('/api/cielo/cache', (req, res) => {
  cache.clear();
  res.json({ 
    success: true, 
    message: 'Cache vidé',
    timestamp: new Date().toISOString()
  });
});

// API 8: Informations sur l'API
app.get('/api/cielo/info', (req, res) => {
  res.json({
    name: 'Cielo Finance API Wrapper with Geckoterminal Integration',
    version: '2.0.0',
    endpoints: {
      'GET /api/cielo/stats/:wallet': 'Statistiques de trading (paramètre ?days=max|7|30)',
      'GET /api/cielo/portfolio/:wallet': 'Portfolio actuel du wallet (ENRICHI avec Geckoterminal)',
      'GET /api/cielo/pnl/:wallet': 'PnL des tokens (ENRICHI avec Geckoterminal) (paramètres ?page=1&skip_unrealized_pnl=false)',
      'GET /api/cielo/pnl-complete/:wallet': 'PnL complet de tous les tokens (ENRICHI avec Geckoterminal)',
      'GET /api/cielo/complete/:wallet': 'Toutes les données consolidées (ENRICHI COMPLET avec Geckoterminal - SANS LIMITES)',
      'POST /api/cielo/batch-process': 'Traitement en lot des wallets de dune_wallets.json',
      'GET /api/gecko/token/:address': 'Informations détaillées d\'un token via Geckoterminal',
      'GET /api/gecko/pool/:poolAddress': 'Données brutes complètes d\'un pool (avec redirection auto)',
      'GET /api/gecko/enrich-portfolio/:wallet': 'Enrichir un portfolio avec données Geckoterminal',
      'GET /api/complete-enriched/:wallet': 'Données complètes enrichies (Cielo + Geckoterminal)',
      'GET /api/gecko/token/:tokenAddress/best-pool': 'Meilleur pool d\'un token (avec redirection auto)',
      'DELETE /api/cielo/cache': 'Vider le cache',
      'GET /api/cielo/info': 'Informations sur l\'API'
    },
    complete_endpoint_new_features: {
      'enrichment_mode': 'COMPLETE - Enrichit TOUS les tokens sans limite',
      'market_cap_data': 'market_cap_usd, circulating_supply, total_supply pour chaque token',
      'security_complete': 'holder_count, go_plus_data, soul_scanner_data, honeypot_scanner_data',
      'pool_complete': 'price_usd, volume_24h_usd, gt_score, price_changes, reserve_usd',
      'reliability_scoring': 'Score de fiabilité détaillé avec facteurs de calcul',
      'data_structure': 'Chaque token contient geckoterminal_complete_data avec toutes les métriques'
    },
    automatic_enrichment: {
      'portfolio_endpoint': 'Tous les tokens du portfolio sont automatiquement enrichis avec Geckoterminal',
      'pnl_endpoint': 'Les tokens PnL sont enrichis (limité à 10 par page)',
      'pnl_complete_endpoint': 'Les tokens PnL complets sont enrichis (limité à 20 tokens)',
      'complete_endpoint': 'Portfolio et PnL enrichis automatiquement',
      'batch_processing': 'Chaque token contient les données Geckoterminal dans sa structure'
    },
    enrichment_data_structure: {
      'geckoterminal_enriched': 'Boolean - indique si le token a été enrichi',
      'geckoterminal_data': 'Object - données complètes du pool, token, sécurité',
      'geckoterminal_token_info': 'Object - infos de base du token (nom, symbole, verified)',
      'geckoterminal_stats': 'Object - statistiques d\'enrichissement au niveau portfolio'
    },
    gecko_features: {
      'auto_redirect': 'Redirection automatique vers top_pool si attributes/relationships vides',
      'native_tokens_support': 'Gestion spéciale des tokens natifs (SOL, USDC)',
      'reliability_scoring': 'Calcul automatique des scores de fiabilité',
      'batch_enrichment': 'Enrichissement en lot des portfolios',
      'performance_limits': 'Limitations intelligentes pour éviter timeouts'
    },
    cache: {
      duration: `${CACHE_DURATION / 1000} secondes`,
      current_entries: cache.size
    },
    cielo_config: {
      base_url: CIELO_CONFIG.baseUrl,
      headers_configured: !!CIELO_CONFIG.headers['Api-Key']
    },
    geckoterminal_config: {
      base_url: GECKOTERMINAL_CONFIG.baseUrl,
      auto_redirect_enabled: true
    }
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.redirect('/api/cielo/info');
});

// Middleware de gestion d'erreur
app.use((error, req, res, next) => {
  console.error('Erreur non gérée:', error);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: error.message 
  });
});

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}, CACHE_DURATION);

// Fonction pour tester une adresse
async function testWallet(wallet) {
  try {
    console.log(`\n🧪 Test du wallet: ${wallet}`);
    
    const [stats, portfolio, pnl] = await Promise.all([
      cieloRequest(`/enhanced-stats/aggregated/${wallet}?days=max`),
      cieloRequest(`/${wallet}/portfolio`),
      cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=1`)
    ]);

    console.log('✅ Stats:', stats.status);
    console.log('✅ Portfolio:', portfolio.status, `- ${portfolio.data?.portfolio?.length || 0} tokens`);
    console.log('✅ PnL:', pnl.status, `- ${pnl.data?.total_tokens_traded || 0} tokens tradés`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    return false;
  }
}

// Démarrer le serveur
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') && args[1]) {
    // Mode test d'un wallet spécifique
    const wallet = args[1];
    testWallet(wallet).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Mode serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur API Cielo démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}/api/cielo/info`);
      console.log(`💡 Exemple: http://localhost:${PORT}/api/cielo/complete/CwN8wCtN2E2erJ3qJUr3KLq4yGRaEu3X5jxuKFAy3Gba`);
    });
  }
}

module.exports = app;

// API 9: Récupérer les informations détaillées d'un token via Geckoterminal
app.get('/api/gecko/token/:address', async (req, res) => {
  const { address } = req.params;
  const { network = 'solana' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Adresse token requise' });
  }

  try {
    const cacheKey = `gecko_token_${network}_${address}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération infos Geckoterminal pour token: ${address}`);

    // Rechercher les pools pour ce token
    const poolsEndpoint = `/${network}/tokens/${address}/pools`;
    const poolsData = await geckoterminalRequest(poolsEndpoint);

    if (!poolsData.data || poolsData.data.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé pour ce token',
        token: address 
      });
    }

    // Prendre le pool avec le plus de liquidité
    const bestPool = poolsData.data.reduce((best, current) => {
      const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
      const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
      return currentReserve > bestReserve ? current : best;
    });

    // Récupérer les détails complets du pool
    const poolDetailEndpoint = `/${network}/pools/${bestPool.attributes.address}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
    const poolDetail = await geckoterminalRequest(poolDetailEndpoint);

    // Extraire les données du token et de sécurité
    const tokens = poolDetail.included?.filter(item => item.type === 'token') || [];
    const tokenData = tokens.find(t => t.attributes.address === address);
    
    const securities = poolDetail.included?.filter(item => item.type === 'token_security_metric') || [];
    const securityData = securities.find(s => s.relationships?.token?.data?.id === tokenData?.id);

    const liquidities = poolDetail.included?.filter(item => item.type === 'pool_locked_liquidité') || [];

    if (!tokenData) {
      return res.status(404).json({ 
        error: 'Données token non trouvées',
        token: address 
      });
    }

    const enrichedData = {
      token: extractTokenMetrics(tokenData, poolDetail.data, securityData),
      pool_details: poolDetail.data.attributes,
      locked_liquidities: liquidities.map(l => l.attributes),
      raw_data: {
        pool: poolDetail.data,
        security: securityData,
        all_pools: poolsData.data.length
      }
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: enrichedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: enrichedData
    });

  } catch (error) {
    console.error('Erreur récupération token Geckoterminal:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données token',
      message: error.message,
      token: address
    });
  }
});

// API 10: Enrichir tous les tokens d'un portfolio avec les données Geckoterminal
app.get('/api/gecko/enrich-portfolio/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { network = 'solana' } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `gecko_portfolio_${network}_${wallet}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Enrichissement portfolio Geckoterminal pour wallet: ${wallet}`);

    // Récupérer le portfolio depuis Cielo
    const portfolioEndpoint = `/${wallet}/portfolio`;
    const portfolioData = await cieloRequest(portfolioEndpoint);

    if (!portfolioData.data?.portfolio) {
      return res.status(404).json({ 
        error: 'Portfolio non trouvé',
        wallet: wallet 
      });
    }

    const tokens = portfolioData.data.portfolio;
    const enrichedTokens = [];
    const errors = [];

    // Traiter les tokens par batch de 3 pour éviter la surcharge
    const batchSize = 3;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (token) => {
        try {
          console.log(`Enrichissement token ${i + batch.indexOf(token) + 1}/${tokens.length}: ${token.mint}`);
          
          // Rechercher les pools pour ce token
          const poolsData = await geckoterminalRequest(`/${network}/tokens/${token.mint}/pools`);
          
          if (!poolsData.data || poolsData.data.length === 0) {
            return {
              ...token,
              gecko_data: null,
              gecko_error: 'Aucun pool trouvé'
            };
          }

          // Prendre le pool avec le plus de liquidité
          const bestPool = poolsData.data.reduce((best, current) => {
            const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
            const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
            return currentReserve > bestReserve ? current : best;
          });

          // Récupérer les détails complets du pool
          const poolDetail = await geckoterminalRequest(`/${network}/pools/${bestPool.attributes.address}?include=tokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities`);
          
          const poolTokens = poolDetail.included?.filter(item => item.type === 'token') || [];
          const tokenData = poolTokens.find(t => t.attributes.address === token.mint);
          
          const securities = poolDetail.included?.filter(item => item.type === 'token_security_metric') || [];
          const securityData = securities.find(s => s.relationships?.token?.data?.id === tokenData?.id);

          return {
            ...token,
            gecko_data: tokenData ? extractTokenMetrics(tokenData, poolDetail.data, securityData) : null
          };

        } catch (error) {
          console.error(`Erreur enrichissement token ${token.mint}:`, error.message);
          
          // Gestion spéciale pour les tokens natifs qui peuvent causer des 404
          if (error.message.includes('404') && token.mint === 'So11111111111111111111111111111111111111112') {
            return {
              ...token,
              gecko_data: {
                address: token.mint,
                name: 'Wrapped SOL',
                symbol: 'SOL',
                on_coingecko: true,
                reliability_score: 95,
                pool_metrics: {
                  gt_score: 95,
                  volume_24h_usd: 1000000000
                },
                security_metrics: {
                  holder_count: 1000000
                }
              },
              gecko_error: null
            };
          }
          
          errors.push({
            token: token.mint,
            error: error.message
          });
          return {
            ...token,
            gecko_data: null,
            gecko_error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      enrichedTokens.push(...batchResults);

      // Pause entre les batches
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculer des statistiques globales
    const validTokens = enrichedTokens.filter(t => t.gecko_data);
    const totalReliabilityScore = validTokens.reduce((sum, t) => sum + (t.gecko_data.reliability_score || 0), 0);
    const avgReliabilityScore = validTokens.length > 0 ? totalReliabilityScore / validTokens.length : 0;

    const portfolioStats = {
      total_tokens: tokens.length,
      enriched_tokens: validTokens.length,
      failed_tokens: errors.length,
      average_reliability_score: Math.round(avgReliabilityScore),
      high_reliability_tokens: validTokens.filter(t => t.gecko_data.reliability_score >= 70).length,
      verified_tokens: validTokens.filter(t => t.gecko_data.on_coingecko).length,
      tokens_with_social_links: validTokens.filter(t => t.gecko_data.links?.twitter_handle).length
    };

    const finalData = {
      wallet: wallet,
      portfolio_value_usd: portfolioData.data.total_usd,
      enriched_portfolio: enrichedTokens,
      portfolio_stats: portfolioStats,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: finalData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: finalData
    });

  } catch (error) {
    console.error('Erreur enrichissement portfolio:', error);
    res.status(500).json({ 
      error: 'Erreur enrichissement portfolio',
      message: error.message,
      wallet: wallet
    });
  }
});

// API 11: Données complètes enrichies pour un wallet (Cielo + Geckoterminal)
app.get('/api/complete-enriched/:wallet', async (req, res) => {
  const { wallet } = req.params;
  const { days_stats = 'max', network = 'solana' } = req.query;

  if (!wallet) {
    return res.status(400).json({ error: 'Adresse wallet requise' });
  }

  try {
    const cacheKey = `complete_enriched_${wallet}_${days_stats}_${network}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération données complètes enrichies pour: ${wallet}`);

    // Récupérer les données Cielo et Geckoterminal en parallèle
    const [statsData, portfolioData, pnlCompleteData, enrichedPortfolioData] = await Promise.all([
      cieloRequest(`/enhanced-stats/aggregated/${wallet}?days=${days_stats}`),
      cieloRequest(`/${wallet}/portfolio`),
      (async () => {
        const firstPage = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=1`);
        const totalPages = firstPage.paging?.total_pages || 1;
        const allTokens = [...firstPage.data.tokens];

        for (let page = 2; page <= totalPages; page++) {
          const pageData = await cieloRequest(`/pnl/tokens?wallet=${wallet}&skip_unrealized_pnl=false&page=${page}`);
          allTokens.push(...pageData.data.tokens);
        }

        return {
          ...firstPage,
          data: {
            ...firstPage.data,
            tokens: allTokens
          }
        };
      })(),
      (async () => {
        // Enrichir le portfolio avec Geckoterminal
        const portfolio = await cieloRequest(`/${wallet}/portfolio`);
        if (!portfolio.data?.portfolio) return null;

        const tokens = portfolio.data.portfolio;
        const enrichedTokens = [];

        for (let i = 0; i < Math.min(tokens.length, 10); i++) { // Limiter à 10 tokens pour éviter timeout
          const token = tokens[i];
          try {
            // Utiliser la fonction enrichTokenWithGeckoterminal qui gère les tokens natifs
            const enrichedToken = await enrichTokenWithGeckoterminal(token.mint);
            
            if (enrichedToken.enriched) {
              enrichedTokens.push({
                ...token,
                gecko_data: enrichedToken.geckoterminal_data
              });
            } else {
              enrichedTokens.push({
                ...token, 
                gecko_data: null,
                gecko_error: enrichedToken.error
              });
            }
          } catch (error) {
            enrichedTokens.push({
              ...token, 
              gecko_data: null, 
              gecko_error: error.message
            });
          }
        }

        return {
          ...portfolio,
          data: {
            ...portfolio.data,
            enriched_portfolio: enrichedTokens
          }
        };
      })()
    ]);

    const consolidatedData = {
      wallet: wallet,
      timestamp: new Date().toISOString(),
      
      // Données Cielo
      cielo_stats: statsData,
      cielo_portfolio: portfolioData,
      cielo_pnl: pnlCompleteData,
      
      // Données enrichies Geckoterminal
      enriched_portfolio: enrichedPortfolioData,
      
      // Résumé consolidé avec métriques de fiabilité
      summary: {
        // Métriques Cielo
        total_tokens_traded: pnlCompleteData.data.total_tokens_traded,
        total_pnl_usd: pnlCompleteData.data.total_pnl_usd,
        winrate: pnlCompleteData.data.winrate,
        current_portfolio_value: portfolioData.data.total_usd,
        current_holdings_count: portfolioData.data.portfolio.length,
        trading_stats_period: days_stats,
        
        // Métriques de fiabilité Geckoterminal
        enriched_tokens_count: enrichedPortfolioData?.data?.enriched_portfolio?.filter(t => t.gecko_data).length || 0,
        average_reliability_score: enrichedPortfolioData?.data?.enriched_portfolio?.filter(t => t.gecko_data)
          .reduce((sum, t, _, arr) => sum + (t.gecko_data.reliability_score || 0) / arr.length, 0) || 0,
        high_reliability_tokens: enrichedPortfolioData?.data?.enriched_portfolio?.filter(t => t.gecko_data?.reliability_score >= 70).length || 0,
        verified_tokens: enrichedPortfolioData?.data?.enriched_portfolio?.filter(t => t.gecko_data?.on_coingecko).length || 0,
        
        // Score de fiabilité global du wallet
        wallet_reliability_score: calculateWalletReliabilityScore(pnlCompleteData.data, enrichedPortfolioData?.data?.enriched_portfolio || [])
      }
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: consolidatedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: consolidatedData
    });

  } catch (error) {
    console.error('Erreur données complètes enrichies:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données complètes enrichies',
      message: error.message,
      wallet: wallet
    });
  }
});

// Fonction pour calculer le score de fiabilité global d'un wallet (version unifiée)
function calculateWalletReliabilityScore(input1, input2) {
  let score = 0;
  
  // Si c'est l'ancien format (pnlData, enrichedTokens)
  if (input2 && Array.isArray(input2)) {
    const pnlData = input1;
    const enrichedTokens = input2;
    
    // Performance de trading (40% du score)
    const winrate = pnlData?.winrate || 0;
    score += Math.min(25, (winrate / 100) * 25);
    
    const totalPnl = parseFloat(pnlData?.total_pnl_usd) || 0;
    if (totalPnl > 10000) score += 15;
    else if (totalPnl > 1000) score += 10;
    else if (totalPnl > 100) score += 5;
    else if (totalPnl > 0) score += 2;
    
    // Qualité des tokens en portefeuille (60% du score)
    const validTokens = enrichedTokens.filter(t => t.gecko_data || t.geckoterminal_data);
    if (validTokens.length > 0) {
      const avgTokenReliability = validTokens.reduce((sum, t) => {
        const reliability = t.gecko_data?.reliability_score || t.geckoterminal_data?.reliability_score?.total_score || 0;
        return sum + reliability;
      }, 0) / validTokens.length;
      score += Math.min(40, (avgTokenReliability / 100) * 40);
      
      // Bonus pour diversité de tokens fiables
      const highReliabilityCount = validTokens.filter(t => {
        const reliability = t.gecko_data?.reliability_score || t.geckoterminal_data?.reliability_score?.total_score || 0;
        return reliability >= 70;
      }).length;
      const diversityBonus = Math.min(20, (highReliabilityCount / validTokens.length) * 20);
      score += diversityBonus;
    }
    
    return Math.round(score);
  }
  
  // Si c'est le nouveau format ({ stats, portfolio, pnl })
  const { stats, portfolio, pnl } = input1;
  const factors = {};

  // Performance trading (30% du score total)
  if (stats && stats.data?.winrate !== undefined) {
    const winrateScore = stats.data.winrate / 100;
    score += winrateScore * 30;
    factors.winrate = { value: stats.data.winrate, weight: 30, contribution: winrateScore * 30 };
  }

  // PnL positif (25% du score total)
  if (stats && stats.data?.total_pnl_usd !== undefined) {
    const pnlUsd = parseFloat(stats.data.total_pnl_usd);
    let pnlScore = 0;
    if (pnlUsd > 100000) pnlScore = 1; // > 100k USD
    else if (pnlUsd > 10000) pnlScore = 0.8; // > 10k USD
    else if (pnlUsd > 1000) pnlScore = 0.6; // > 1k USD
    else if (pnlUsd > 0) pnlScore = 0.4; // Positif
    else pnlScore = 0; // Négatif
    
    score += pnlScore * 25;
    factors.realized_pnl = { value: pnlUsd, weight: 25, contribution: pnlScore * 25 };
  }

  // Qualité du portfolio actuel (25% du score total)
  if (portfolio && portfolio.positions) {
    const enrichedTokens = portfolio.positions.filter(pos => pos.enriched && pos.geckoterminal_data?.reliability_score);
    
    if (enrichedTokens.length > 0) {
      const avgTokenReliability = enrichedTokens.reduce((sum, token) => 
        sum + token.geckoterminal_data.reliability_score.total_score, 0) / enrichedTokens.length;
      
      const portfolioScore = avgTokenReliability / 100;
      score += portfolioScore * 25;
      factors.portfolio_quality = { value: avgTokenReliability, weight: 25, contribution: portfolioScore * 25 };
    }
  }

  // Volume d'activité (10% du score total)
  if (stats && stats.data?.volume_traded !== undefined) {
    const volume = parseFloat(stats.data.volume_traded);
    let volumeScore = 0;
    if (volume > 1000000) volumeScore = 1; // > 1M USD
    else if (volume > 100000) volumeScore = 0.8; // > 100k USD
    else if (volume > 10000) volumeScore = 0.6; // > 10k USD
    else if (volume > 1000) volumeScore = 0.4; // > 1k USD
    else volumeScore = 0.2;
    
    score += volumeScore * 10;
    factors.trading_volume = { value: volume, weight: 10, contribution: volumeScore * 10 };
  }

  // Nombre de transactions (10% du score total)
  if (stats && stats.data?.total_transactions !== undefined) {
    const txCount = stats.data.total_transactions;
    let txScore = 0;
    if (txCount > 1000) txScore = 1;
    else if (txCount > 500) txScore = 0.8;
    else if (txCount > 100) txScore = 0.6;
    else if (txCount > 50) txScore = 0.4;
    else txScore = 0.2;
    
    score += txScore * 10;
    factors.transaction_count = { value: txCount, weight: 10, contribution: txScore * 10 };
  }

  return {
    total_score: Math.max(0, Math.min(100, score)),
    factors: factors,
    reliability_level: score >= 80 ? 'TRADER_EXPERT' : 
                      score >= 65 ? 'TRADER_FIABLE' : 
                      score >= 50 ? 'TRADER_MOYEN' : 
                      score >= 30 ? 'TRADER_RISQUE' : 'TRADER_DEBUTANT',
    recommendation: score >= 70 ? 'COPIER' : 
                   score >= 50 ? 'SURVEILLER' : 'EVITER'
  };
}

// API 12: Récupérer les données complètes d'un pool Geckoterminal
app.get('/api/gecko/pool/:poolAddress', async (req, res) => {
  const { poolAddress } = req.params;
  const { network = 'solana' } = req.query;

  if (!poolAddress) {
    return res.status(400).json({ error: 'Adresse pool requise' });
  }

  try {
    const cacheKey = `gecko_pool_${network}_${poolAddress}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération données pool Geckoterminal: ${poolAddress}`);

    // Récupérer les données complètes du pool avec gestion de redirection
    const endpoint = `/${network}/pools/${poolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
    let poolDetail = await geckoterminalRequest(endpoint);

    // Vérifier si attributes et relationships sont vides et rediriger si nécessaire
    const hasEmptyData = (!poolDetail.data?.attributes || Object.keys(poolDetail.data.attributes).length === 0) &&
                        (!poolDetail.data?.relationships || Object.keys(poolDetail.data.relationships).length === 0);

    if (hasEmptyData && poolDetail.links?.top_pool) {
      try {
        const topPoolUrl = poolDetail.links.top_pool;
        const topPoolMatch = topPoolUrl.match(/\/pools\/([^?]+)/);
        
        if (topPoolMatch && topPoolMatch[1]) {
          const topPoolAddress = topPoolMatch[1];
          console.log(`🎯 Nouveau pool address: ${topPoolAddress}`);
          const newEndpoint = `/${network}/pools/${topPoolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
          poolDetail = await geckoterminalRequest(newEndpoint);
          console.log(`✅ Redirection réussie - Attributes: ${Object.keys(poolDetail.data?.attributes || {}).length}, Included: ${poolDetail.included?.length || 0}`);
        }
      } catch (redirectError) {
        console.error('❌ Erreur redirection Geckoterminal:', redirectError);
      }
    }

    const pool = poolDetail.data?.attributes;
    const included = poolDetail.included || [];
    
    // Extraire tous les tokens du pool
    const tokens = included.filter(item => item.type === 'token');
    const securityMetrics = included.filter(item => item.type === 'token_security_metric');
    const lockedLiquidities = included.filter(item => item.type === 'pool_locked_liquidité');
    
    // Enrichir chaque token avec ses données complètes
    const enrichedTokens = tokens.map(token => {
      const tokenSecurity = securityMetrics.find(metric => 
        metric.relationships.token.data.id === token.id
      );

      const reliabilityScore = calculateTokenReliabilityScore({
        pool: pool,
        token: token.attributes,
        securityMetric: tokenSecurity?.attributes,
        lockedLiquidities: lockedLiquidities
      });

      return {
        address: token.attributes.address,
        name: token.attributes.name,
        symbol: token.attributes.symbol,
        decimals: token.attributes.decimals,
        image_url: token.attributes.image_url,
        market_cap_usd: token.attributes.market_cap_in_usd,
        circulating_supply: token.attributes.circulating_supply,
        total_supply: token.attributes.total_supply,
        links: token.attributes.links,
        on_coingecko: token.attributes.on_coingecko,
        on_pump_fun: token.attributes.on_pump_fun,
        
        // Données de sécurité complètes
        security_data: tokenSecurity ? {
          holder_count: tokenSecurity.attributes.holder_count,
          go_plus_data: tokenSecurity.attributes.go_plus_token_security_data,
          soul_scanner_data: tokenSecurity.attributes.soul_scanner_data,
          honeypot_scanner_data: tokenSecurity.attributes.honeypot_scanner_data,
          trench_radar_data: tokenSecurity.attributes.trench_radar_data,
          defi_scanner_data: tokenSecurity.attributes.defi_scanner_data
        } : null,
        
        // Données du pool
        pool_data: {
          pool_address: pool.address,
          pool_name: pool.name,
          price_usd: pool.price_in_usd,
          price_change_24h: pool.price_percent_changes?.last_24h,
          price_change_1h: pool.price_percent_changes?.last_1h,
          price_change_5m: pool.price_percent_changes?.last_5m,
          volume_24h_usd: pool.from_volume_in_usd,
          volume_1h_usd: pool.volume_in_usd_1h,
          reserve_usd: pool.reserve_in_usd,
          fully_diluted_valuation: pool.fully_diluted_valuation,
          market_cap_usd: pool.market_cap_in_usd,
          gt_score: pool.gt_score,
          gt_score_details: pool.gt_score_details,
          swap_count_24h: pool.swap_count_24h,
          created_at: pool.pool_created_at,
          security_indicators: pool.security_indicators || [],
          sentiment_votes: pool.sentiment_votes
        },
        
        // Liquidité verrouillée
        liquidity_locked: lockedLiquidities.length > 0 ? {
          locked_percent: lockedLiquidities[0].attributes.locked_percent,
          source: lockedLiquidities[0].attributes.source,
          url: lockedLiquidities[0].attributes.url
        } : null,
        
        // Score de fiabilité calculé
        reliability_score: reliabilityScore
      };
    });

    const finalData = {
      pool_address: poolAddress,
      pool_details: pool,
      tokens: enrichedTokens,
      raw_data: poolDetail
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: finalData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: finalData
    });

  } catch (error) {
    console.error('Erreur récupération pool Geckoterminal:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données pool',
      message: error.message,
      pool: poolAddress
    });
  }
});

// API 13: Rechercher les pools d'un token et récupérer les données complètes du meilleur pool
app.get('/api/gecko/token/:tokenAddress/best-pool', async (req, res) => {
  const { tokenAddress } = req.params;
  const { 
    network = 'solana',
    include = 'dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities',
    base_token = '0'
  } = req.query;

  if (!tokenAddress) {
    return res.status(400).json({ error: 'Adresse du token requise' });
  }

  try {
    const cacheKey = `gecko_token_best_pool_${network}_${tokenAddress}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Recherche du meilleur pool pour token: ${tokenAddress}`);

    // Rechercher tous les pools pour ce token
    const poolsEndpoint = `/${network}/tokens/${tokenAddress}/pools`;
    const poolsData = await geckoterminalRequest(poolsEndpoint);

    if (!poolsData.data || poolsData.data.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé pour ce token',
        token_address: tokenAddress 
      });
    }

    // Trouver le meilleur pool (le plus de liquidité)
    const bestPool = poolsData.data.reduce((best, current) => {
      const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
      const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
      return currentReserve > bestReserve ? current : best;
    });

    const bestPoolAddress = bestPool.attributes.address;

    // Récupérer les données complètes du meilleur pool
    const poolDetailEndpoint = `/${network}/pools/${bestPoolAddress}?include=${include}&base_token=${base_token}`;
    let poolDetail = await geckoterminalRequest(poolDetailEndpoint);

    // Vérifier si attributes et relationships sont vides pour le pool détaillé
    const hasEmptyPoolData = (!poolDetail.data?.attributes || Object.keys(poolDetail.data.attributes).length === 0) &&
                            (!poolDetail.data?.relationships || Object.keys(poolDetail.data.relationships).length === 0);

    let finalBestPoolAddress = bestPoolAddress;
    let poolRedirected = false;

    // Si les données du pool sont vides et qu'il y a un top_pool, utiliser cette adresse
    if (hasEmptyPoolData && poolDetail.links?.top_pool) {
      try {
        // Extraire l'adresse du pool depuis l'URL top_pool
        const topPoolUrl = poolDetail.links.top_pool;
        const topPoolMatch = topPoolUrl.match(/\/pools\/([^?]+)/);
        
        if (topPoolMatch && topPoolMatch[1]) {
          const topPoolAddress = topPoolMatch[1];
          console.log(`Redirection vers le pool principal pour token ${tokenAddress}: ${topPoolAddress}`);
          
          // Refaire l'appel avec la vraie adresse du pool
          const newPoolDetailEndpoint = `/${network}/pools/${topPoolAddress}?include=${include}&base_token=${base_token}`;
          poolDetail = await geckoterminalRequest(newPoolDetailEndpoint);
          finalBestPoolAddress = topPoolAddress;
          poolRedirected = true;
        }
      } catch (redirectError) {
        console.error('Erreur lors de la redirection vers top_pool pour le meilleur pool:', redirectError);
        // Continuer avec les données originales même en cas d'erreur
      }
    }

    const finalData = {
      token_address: tokenAddress,
      best_pool_address: finalBestPoolAddress,
      original_best_pool_address: poolRedirected ? bestPoolAddress : null,
      pool_redirected: poolRedirected,
      total_pools_found: poolsData.data.length,
      all_pools_summary: poolsData.data.map(pool => ({
        address: pool.attributes.address,
        name: pool.attributes.name,
        reserve_usd: pool.attributes.reserve_in_usd,
        volume_24h_usd: pool.attributes.volume_usd_24h,
        price_usd: pool.attributes.price_in_usd
      })),
      best_pool_full_data: poolDetail,
      request_url: `${GECKOTERMINAL_CONFIG.baseUrl}${poolRedirected ? `/${network}/pools/${finalBestPoolAddress}?include=${include}&base_token=${base_token}` : poolDetailEndpoint}`,
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: finalData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: finalData
    });

  } catch (error) {
    console.error('Erreur recherche meilleur pool:', error);
    res.status(500).json({ 
      error: 'Erreur recherche meilleur pool',
      message: error.message,
      token_address: tokenAddress,
      network: network
    });
  }
});
