const express = require('express');
const app = express();

app.use(express.json());

// Configuration API Geckoterminal
const GECKOTERMINAL_CONFIG = {
  baseUrl: 'https://app.geckoterminal.com/api/p1',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

// Cache simple pour éviter les requêtes répétées
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Fonction utilitaire pour faire des requêtes à l'API Geckoterminal
async function geckoterminalRequest(endpoint) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${GECKOTERMINAL_CONFIG.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: GECKOTERMINAL_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur requête Geckoterminal:', error);
    throw error;
  }
}

// API 1: Récupérer les données de base d'un token
app.get('/api/token/:address', async (req, res) => {
  const { address } = req.params;
  const { network = 'solana' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Adresse token requise' });
  }

  try {
    const cacheKey = `token_${network}_${address}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération token: ${address} sur ${network}`);

    // Rechercher les pools pour ce token
    const poolsEndpoint = `/${network}/tokens/${address}/pools`;
    const poolsData = await geckoterminalRequest(poolsEndpoint);

    if (!poolsData.data || poolsData.data.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé pour ce token',
        token: address,
        network: network
      });
    }

    // Prendre le pool avec le plus de liquidité
    const bestPool = poolsData.data.reduce((best, current) => {
      const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
      const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
      return currentReserve > bestReserve ? current : best;
    });

    const tokenData = {
      address: address,
      network: network,
      pool: {
        address: bestPool.attributes.address,
        name: bestPool.attributes.name,
        price_usd: bestPool.attributes.price_in_usd,
        price_change_24h: bestPool.attributes.price_percent_changes?.last_24h,
        volume_24h_usd: bestPool.attributes.from_volume_in_usd,
        reserve_usd: bestPool.attributes.reserve_in_usd,
        swap_count_24h: bestPool.attributes.swap_count_24h,
        created_at: bestPool.attributes.pool_created_at
      },
      total_pools: poolsData.data.length,
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: tokenData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: tokenData
    });

  } catch (error) {
    console.error('Erreur récupération token:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données token',
      message: error.message,
      token: address,
      network: network
    });
  }
});

// API 2: Récupérer les données détaillées d'un token avec sécurité
app.get('/api/token/:address/details', async (req, res) => {
  const { address } = req.params;
  const { network = 'solana' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Adresse token requise' });
  }

  try {
    const cacheKey = `token_details_${network}_${address}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération détails token: ${address} sur ${network}`);

    // Rechercher les pools
    const poolsData = await geckoterminalRequest(`/${network}/tokens/${address}/pools`);

    if (!poolsData.data || poolsData.data.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé pour ce token',
        token: address,
        network: network
      });
    }

    // Prendre le meilleur pool
    const bestPool = poolsData.data.reduce((best, current) => {
      const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
      const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
      return currentReserve > bestReserve ? current : best;
    });

    // Récupérer les détails complets du pool avec sécurité
    const poolDetailEndpoint = `/${network}/pools/${bestPool.attributes.address}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`;
    const poolDetail = await geckoterminalRequest(poolDetailEndpoint);

    // Extraire les données du token et de sécurité
    const tokens = poolDetail.included?.filter(item => item.type === 'token') || [];
    const tokenInfo = tokens.find(t => t.attributes.address.toLowerCase() === address.toLowerCase());
    
    const securities = poolDetail.included?.filter(item => item.type === 'token_security_metric') || [];
    const securityData = securities.find(s => s.relationships?.token?.data?.id === tokenInfo?.id);

    const liquidities = poolDetail.included?.filter(item => item.type === 'pool_locked_liquidity') || [];

    const detailedData = {
      address: address,
      network: network,
      token: tokenInfo ? {
        name: tokenInfo.attributes.name,
        symbol: tokenInfo.attributes.symbol,
        decimals: tokenInfo.attributes.decimals,
        image_url: tokenInfo.attributes.image_url,
        market_cap_usd: tokenInfo.attributes.market_cap_in_usd,
        circulating_supply: tokenInfo.attributes.circulating_supply,
        on_coingecko: tokenInfo.attributes.on_coingecko,
        on_pump_fun: tokenInfo.attributes.on_pump_fun,
        links: tokenInfo.attributes.links
      } : null,
      pool: {
        address: poolDetail.data.attributes.address,
        name: poolDetail.data.attributes.name,
        price_usd: poolDetail.data.attributes.price_in_usd,
        price_changes: poolDetail.data.attributes.price_percent_changes,
        volume_24h_usd: poolDetail.data.attributes.from_volume_in_usd,
        reserve_usd: poolDetail.data.attributes.reserve_in_usd,
        swap_count_24h: poolDetail.data.attributes.swap_count_24h,
        gt_score: poolDetail.data.attributes.gt_score,
        gt_score_details: poolDetail.data.attributes.gt_score_details,
        security_indicators: poolDetail.data.attributes.security_indicators || [],
        created_at: poolDetail.data.attributes.pool_created_at
      },
      security: securityData ? {
        holder_count: securityData.attributes.holder_count,
        go_plus_data: securityData.attributes.go_plus_token_security_data,
        soul_scanner_data: securityData.attributes.soul_scanner_data,
        honeypot_scanner_data: securityData.attributes.honeypot_scanner_data,
        trench_radar_data: securityData.attributes.trench_radar_data
      } : null,
      liquidity_locked: liquidities.length > 0 ? liquidities.map(l => ({
        locked_percent: l.attributes.locked_percent,
        source: l.attributes.source,
        url: l.attributes.url
      })) : [],
      total_pools: poolsData.data.length,
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: detailedData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: detailedData
    });

  } catch (error) {
    console.error('Erreur récupération détails token:', error);
    res.status(500).json({ 
      error: 'Erreur récupération détails token',
      message: error.message,
      token: address,
      network: network
    });
  }
});

// API 3: Lister tous les pools d'un token
app.get('/api/token/:address/pools', async (req, res) => {
  const { address } = req.params;
  const { network = 'solana', page = 1 } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Adresse token requise' });
  }

  try {
    const cacheKey = `token_pools_${network}_${address}_${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération pools token: ${address} page ${page}`);

    const poolsData = await geckoterminalRequest(`/${network}/tokens/${address}/pools?page=${page}`);

    if (!poolsData.data) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé',
        token: address,
        network: network
      });
    }

    const poolsInfo = {
      address: address,
      network: network,
      page: parseInt(page),
      total_pools: poolsData.data.length,
      pools: poolsData.data.map(pool => ({
        address: pool.attributes.address,
        name: pool.attributes.name,
        price_usd: pool.attributes.price_in_usd,
        volume_24h_usd: pool.attributes.from_volume_in_usd,
        reserve_usd: pool.attributes.reserve_in_usd,
        swap_count_24h: pool.attributes.swap_count_24h,
        gt_score: pool.attributes.gt_score,
        security_indicators: pool.attributes.security_indicators || [],
        created_at: pool.attributes.pool_created_at
      })),
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: poolsInfo,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: poolsInfo
    });

  } catch (error) {
    console.error('Erreur récupération pools:', error);
    res.status(500).json({ 
      error: 'Erreur récupération pools',
      message: error.message,
      token: address,
      network: network
    });
  }
});

// API 4: Rechercher des tokens par nom ou symbole
app.get('/api/search', async (req, res) => {
  const { query, network = 'solana', limit = 10 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query de recherche requise' });
  }

  try {
    const cacheKey = `search_${network}_${query}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Recherche tokens: "${query}" sur ${network}`);

    // Geckoterminal n'a pas d'endpoint de recherche direct, donc on utilise les trending tokens
    const trendingData = await geckoterminalRequest(`/${network}/tokens/trending?limit=${limit}`);

    if (!trendingData.data) {
      return res.status(404).json({ 
        error: 'Aucun résultat trouvé',
        query: query,
        network: network
      });
    }

    // Filtrer les résultats par nom ou symbole
    const filteredTokens = trendingData.data.filter(token => {
      const name = token.attributes.name?.toLowerCase() || '';
      const symbol = token.attributes.symbol?.toLowerCase() || '';
      const searchQuery = query.toLowerCase();
      
      return name.includes(searchQuery) || symbol.includes(searchQuery);
    });

    const searchResults = {
      query: query,
      network: network,
      results_count: filteredTokens.length,
      tokens: filteredTokens.map(token => ({
        address: token.attributes.address,
        name: token.attributes.name,
        symbol: token.attributes.symbol,
        image_url: token.attributes.image_url,
        market_cap_usd: token.attributes.market_cap_in_usd,
        on_coingecko: token.attributes.on_coingecko
      })),
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: searchResults,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: searchResults
    });

  } catch (error) {
    console.error('Erreur recherche tokens:', error);
    res.status(500).json({ 
      error: 'Erreur recherche tokens',
      message: error.message,
      query: query,
      network: network
    });
  }
});

// API 5: Tokens trending
app.get('/api/trending', async (req, res) => {
  const { network = 'solana', limit = 20 } = req.query;

  try {
    const cacheKey = `trending_${network}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération trending tokens sur ${network}`);

    const trendingData = await geckoterminalRequest(`/${network}/tokens/trending?limit=${limit}`);

    if (!trendingData.data) {
      return res.status(404).json({ 
        error: 'Aucun token trending trouvé',
        network: network
      });
    }

    const trendingTokens = {
      network: network,
      count: trendingData.data.length,
      tokens: trendingData.data.map(token => ({
        address: token.attributes.address,
        name: token.attributes.name,
        symbol: token.attributes.symbol,
        image_url: token.attributes.image_url,
        market_cap_usd: token.attributes.market_cap_in_usd,
        price_change_24h: token.attributes.price_percent_changes?.last_24h,
        on_coingecko: token.attributes.on_coingecko,
        on_pump_fun: token.attributes.on_pump_fun
      })),
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: trendingTokens,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: trendingTokens
    });

  } catch (error) {
    console.error('Erreur trending tokens:', error);
    res.status(500).json({ 
      error: 'Erreur récupération trending tokens',
      message: error.message,
      network: network
    });
  }
});

// API 6: Vider le cache
app.delete('/api/cache', (req, res) => {
  cache.clear();
  res.json({ 
    success: true, 
    message: 'Cache vidé',
    timestamp: new Date().toISOString()
  });
});

// API 7: Informations sur l'API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Geckoterminal API Simple',
    version: '1.0.0',
    description: 'API minimaliste pour récupérer les données de tokens via Geckoterminal',
    endpoints: {
      'GET /api/token/:address': 'Données de base d\'un token (paramètre ?network=solana)',
      'GET /api/token/:address/details': 'Données détaillées avec sécurité',
      'GET /api/token/:address/pools': 'Liste des pools d\'un token (paramètre ?page=1)',
      'GET /api/search': 'Rechercher tokens (paramètre ?query=SOL&network=solana)',
      'GET /api/trending': 'Tokens trending (paramètre ?network=solana&limit=20)',
      'DELETE /api/cache': 'Vider le cache',
      'GET /api/info': 'Informations sur l\'API'
    },
    supported_networks: ['solana', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'avalanche'],
    cache: {
      duration: `${CACHE_DURATION / 1000} secondes`,
      current_entries: cache.size
    },
    examples: {
      'SOL token': '/api/token/So11111111111111111111111111111111111111112',
      'Token details': '/api/token/So11111111111111111111111111111111111111112/details',
      'Search SOL': '/api/search?query=SOL&network=solana',
      'Trending': '/api/trending?network=solana&limit=10'
    }
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.redirect('/api/info');
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

// Démarrer le serveur
const PORT = process.env.PORT || 3002;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🦎 API Geckoterminal démarrée sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📖 Documentation: http://localhost:${PORT}/api/info`);
    console.log(`💡 Exemple: http://localhost:${PORT}/api/token/So11111111111111111111111111111111111111112`);
  });
}

module.exports = app;
