const express = require('express');
const app = express();

// Configuration
app.use(express.json());

// Configuration API CoinGecko Terminal
const COINGECKO_TERMINAL_CONFIG = {
  baseUrl: 'https://api.geckoterminal.com/api/v2',
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

// Fonction utilitaire pour faire des requêtes à CoinGecko Terminal
async function coingeckoRequest(endpoint) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${COINGECKO_TERMINAL_CONFIG.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: COINGECKO_TERMINAL_CONFIG.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur requête CoinGecko Terminal:', error);
    throw error;
  }
}

// Fonction pour extraire les métriques essentielles d'un token
function extractTokenData(tokenData, poolData = null, securityData = null) {
  const token = tokenData.attributes;
  
  return {
    // Informations de base
    address: token.address,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    image_url: token.image_url,
    
    // Données financières
    market_cap_usd: token.market_cap_usd,
    price_usd: token.price_usd,
    fdv_usd: token.fdv_usd,
    total_supply: token.total_supply,
    circulating_supply: token.circulating_supply,
    
    // Liens et vérifications
    links: token.links || {},
    coingecko_coin_id: token.coingecko_coin_id,
    
    // Données du pool principal (si disponible)
    pool_data: poolData ? {
      pool_address: poolData.attributes.address,
      base_token_price_usd: poolData.attributes.base_token_price_usd,
      quote_token_price_usd: poolData.attributes.quote_token_price_usd,
      volume_usd_24h: poolData.attributes.volume_usd.h24,
      price_change_percentage: poolData.attributes.price_change_percentage,
      transactions_24h: poolData.attributes.transactions.h24,
      reserve_in_usd: poolData.attributes.reserve_in_usd
    } : null,
    
    // Données de sécurité (si disponibles)
    security_data: securityData ? {
      trust_score: securityData.attributes.trust_score,
      holders: securityData.attributes.holders,
      is_verified: securityData.attributes.is_verified
    } : null,
    
    timestamp: new Date().toISOString()
  };
}

// API 1: Informations de base d'un token
app.get('/api/token/:network/:address', async (req, res) => {
  const { network, address } = req.params;

  if (!address || !network) {
    return res.status(400).json({ error: 'Network et adresse token requis' });
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

    console.log(`Récupération token: ${network}/${address}`);

    const endpoint = `/networks/${network}/tokens/${address}`;
    const data = await coingeckoRequest(endpoint);

    if (!data.data) {
      return res.status(404).json({ 
        error: 'Token non trouvé',
        network: network,
        address: address
      });
    }

    const tokenInfo = extractTokenData(data.data);

    // Mettre en cache
    cache.set(cacheKey, {
      data: tokenInfo,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: tokenInfo
    });

  } catch (error) {
    console.error('Erreur récupération token:', error);
    res.status(500).json({ 
      error: 'Erreur récupération données token',
      message: error.message,
      network: network,
      address: address
    });
  }
});

// API 2: Informations détaillées d'un token avec son pool principal
app.get('/api/token/:network/:address/details', async (req, res) => {
  const { network, address } = req.params;

  if (!address || !network) {
    return res.status(400).json({ error: 'Network et adresse token requis' });
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

    console.log(`Récupération détails token: ${network}/${address}`);

    // Récupérer les informations du token et ses pools
    const [tokenData, poolsData] = await Promise.all([
      coingeckoRequest(`/networks/${network}/tokens/${address}`),
      coingeckoRequest(`/networks/${network}/tokens/${address}/pools?page=1`)
    ]);

    if (!tokenData.data) {
      return res.status(404).json({ 
        error: 'Token non trouvé',
        network: network,
        address: address
      });
    }

    // Trouver le pool principal (plus grande liquidité)
    let mainPool = null;
    if (poolsData.data && poolsData.data.length > 0) {
      mainPool = poolsData.data.reduce((best, current) => {
        const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
        const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
        return currentReserve > bestReserve ? current : best;
      });
    }

    const detailedInfo = {
      ...extractTokenData(tokenData.data, mainPool),
      pools_count: poolsData.data ? poolsData.data.length : 0,
      all_pools: poolsData.data ? poolsData.data.map(pool => ({
        address: pool.attributes.address,
        name: pool.attributes.name,
        reserve_usd: pool.attributes.reserve_in_usd,
        volume_24h: pool.attributes.volume_usd.h24,
        dex: pool.relationships?.dex?.data?.id
      })) : []
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: detailedInfo,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: detailedInfo
    });

  } catch (error) {
    console.error('Erreur récupération détails token:', error);
    res.status(500).json({ 
      error: 'Erreur récupération détails token',
      message: error.message,
      network: network,
      address: address
    });
  }
});

// API 3: Tous les pools d'un token
app.get('/api/token/:network/:address/pools', async (req, res) => {
  const { network, address } = req.params;
  const { page = 1 } = req.query;

  if (!address || !network) {
    return res.status(400).json({ error: 'Network et adresse token requis' });
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

    console.log(`Récupération pools token: ${network}/${address}`);

    const endpoint = `/networks/${network}/tokens/${address}/pools?page=${page}`;
    const data = await coingeckoRequest(endpoint);

    if (!data.data) {
      return res.status(404).json({ 
        error: 'Aucun pool trouvé',
        network: network,
        address: address
      });
    }

    const poolsInfo = {
      token_address: address,
      network: network,
      total_pools: data.data.length,
      pools: data.data.map(pool => ({
        address: pool.attributes.address,
        name: pool.attributes.name,
        dex: pool.relationships?.dex?.data?.id,
        base_token: pool.attributes.base_token_price_native_currency,
        quote_token: pool.attributes.quote_token_price_native_currency,
        price_usd: pool.attributes.base_token_price_usd,
        volume_24h: pool.attributes.volume_usd.h24,
        volume_change_24h: pool.attributes.volume_usd_change_percentage.h24,
        price_change_24h: pool.attributes.price_change_percentage.h24,
        reserve_usd: pool.attributes.reserve_in_usd,
        transactions_24h: pool.attributes.transactions.h24,
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
    console.error('Erreur récupération pools token:', error);
    res.status(500).json({ 
      error: 'Erreur récupération pools token',
      message: error.message,
      network: network,
      address: address
    });
  }
});

// API 4: Recherche de tokens
app.get('/api/search', async (req, res) => {
  const { query, network = null } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Paramètre de recherche requis' });
  }

  try {
    const cacheKey = `search_${query}_${network}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Recherche tokens: ${query}`);

    let endpoint = `/search/pools?query=${encodeURIComponent(query)}`;
    if (network) {
      endpoint += `&network=${network}`;
    }

    const data = await coingeckoRequest(endpoint);

    if (!data.data) {
      return res.json({
        success: true,
        cached: false,
        data: {
          query: query,
          results: [],
          total_results: 0
        }
      });
    }

    const searchResults = {
      query: query,
      network_filter: network,
      total_results: data.data.length,
      results: data.data.map(pool => ({
        pool_address: pool.attributes.address,
        name: pool.attributes.name,
        network: pool.relationships?.network?.data?.id,
        dex: pool.relationships?.dex?.data?.id,
        base_token: pool.relationships?.base_token?.data ? {
          address: pool.relationships.base_token.data.id,
          symbol: pool.attributes.base_token_symbol
        } : null,
        quote_token: pool.relationships?.quote_token?.data ? {
          address: pool.relationships.quote_token.data.id,
          symbol: pool.attributes.quote_token_symbol
        } : null,
        price_usd: pool.attributes.base_token_price_usd,
        volume_24h: pool.attributes.volume_usd.h24,
        reserve_usd: pool.attributes.reserve_in_usd
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
      query: query
    });
  }
});

// API 5: Tokens trending
app.get('/api/trending/:network', async (req, res) => {
  const { network } = req.params;
  const { page = 1 } = req.query;

  try {
    const cacheKey = `trending_${network}_${page}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log(`Récupération trending: ${network}`);

    const endpoint = `/networks/${network}/trending_pools?page=${page}`;
    const data = await coingeckoRequest(endpoint);

    if (!data.data) {
      return res.status(404).json({ 
        error: 'Aucun pool trending trouvé',
        network: network
      });
    }

    const trendingData = {
      network: network,
      page: parseInt(page),
      total_pools: data.data.length,
      trending_pools: data.data.map(pool => ({
        pool_address: pool.attributes.address,
        name: pool.attributes.name,
        dex: pool.relationships?.dex?.data?.id,
        base_token_symbol: pool.attributes.base_token_symbol,
        quote_token_symbol: pool.attributes.quote_token_symbol,
        price_usd: pool.attributes.base_token_price_usd,
        price_change_24h: pool.attributes.price_change_percentage.h24,
        volume_24h: pool.attributes.volume_usd.h24,
        volume_change_24h: pool.attributes.volume_usd_change_percentage.h24,
        reserve_usd: pool.attributes.reserve_in_usd,
        transactions_24h: pool.attributes.transactions.h24,
        created_at: pool.attributes.pool_created_at
      })),
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    cache.set(cacheKey, {
      data: trendingData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: trendingData
    });

  } catch (error) {
    console.error('Erreur récupération trending:', error);
    res.status(500).json({ 
      error: 'Erreur récupération trending pools',
      message: error.message,
      network: network
    });
  }
});

// API 6: Informations sur les réseaux disponibles
app.get('/api/networks', async (req, res) => {
  try {
    const cacheKey = 'networks_list';
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION * 2) { // Cache plus long pour les réseaux
      return res.json({
        success: true,
        cached: true,
        data: cached.data,
        cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    console.log('Récupération liste des réseaux');

    const endpoint = '/networks?page=1';
    const data = await coingeckoRequest(endpoint);

    if (!data.data) {
      return res.status(404).json({ error: 'Aucun réseau trouvé' });
    }

    const networksData = {
      total_networks: data.data.length,
      networks: data.data.map(network => ({
        id: network.id,
        name: network.attributes.name,
        chain_identifier: network.attributes.chain_identifier,
        coingecko_asset_platform_id: network.attributes.coingecko_asset_platform_id
      })),
      timestamp: new Date().toISOString()
    };

    // Mettre en cache plus longtemps
    cache.set(cacheKey, {
      data: networksData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      cached: false,
      data: networksData
    });

  } catch (error) {
    console.error('Erreur récupération réseaux:', error);
    res.status(500).json({ 
      error: 'Erreur récupération réseaux',
      message: error.message
    });
  }
});

// API 7: Vider le cache
app.delete('/api/cache', (req, res) => {
  cache.clear();
  res.json({ 
    success: true, 
    message: 'Cache vidé',
    timestamp: new Date().toISOString()
  });
});

// API 8: Informations sur le cache
app.get('/api/cache', (req, res) => {
  const cacheEntries = [];
  for (const [key, value] of cache.entries()) {
    cacheEntries.push({
      key: key,
      age_seconds: Math.floor((Date.now() - value.timestamp) / 1000),
      expires_in_seconds: Math.max(0, Math.floor((CACHE_DURATION - (Date.now() - value.timestamp)) / 1000))
    });
  }

  res.json({
    cache_info: {
      total_entries: cache.size,
      cache_duration_seconds: CACHE_DURATION / 1000,
      entries: cacheEntries
    },
    timestamp: new Date().toISOString()
  });
});

// API 9: Informations sur l'API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'CoinGecko Terminal API',
    version: '1.0.0',
    description: 'API dédiée pour récupérer les données de tokens via CoinGecko Terminal',
    endpoints: {
      'GET /api/token/:network/:address': 'Informations de base d\'un token',
      'GET /api/token/:network/:address/details': 'Informations détaillées d\'un token avec pools',
      'GET /api/token/:network/:address/pools': 'Tous les pools d\'un token',
      'GET /api/search?query=:query&network=:network': 'Recherche de tokens/pools',
      'GET /api/trending/:network': 'Pools trending sur un réseau',
      'GET /api/networks': 'Liste des réseaux disponibles',
      'GET /api/cache': 'Informations sur le cache',
      'DELETE /api/cache': 'Vider le cache',
      'GET /api/info': 'Informations sur l\'API'
    },
    examples: {
      solana_token: '/api/token/solana/So11111111111111111111111111111111111111112',
      ethereum_token: '/api/token/eth/0xA0b86a33E6441b81D5ac5A59A6f9caA7c9F8E7aa',
      search: '/api/search?query=PEPE&network=solana',
      trending: '/api/trending/solana'
    },
    supported_networks: [
      'solana', 'eth', 'bsc', 'polygon', 'avalanche', 'arbitrum', 'optimism', 'base'
    ],
    cache: {
      duration_seconds: CACHE_DURATION / 1000,
      current_entries: cache.size
    },
    coingecko_terminal: {
      base_url: COINGECKO_TERMINAL_CONFIG.baseUrl,
      rate_limits: 'Respecter les limites de l\'API CoinGecko Terminal'
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

// Fonction de test
async function testToken(network, address) {
  try {
    console.log(`\n🧪 Test du token: ${network}/${address}`);
    
    const tokenInfo = await coingeckoRequest(`/networks/${network}/tokens/${address}`);
    console.log('✅ Token trouvé:', tokenInfo.data.attributes.name, tokenInfo.data.attributes.symbol);
    
    const poolsInfo = await coingeckoRequest(`/networks/${network}/tokens/${address}/pools?page=1`);
    console.log('✅ Pools trouvés:', poolsInfo.data ? poolsInfo.data.length : 0);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
    return false;
  }
}

// Démarrer le serveur
const PORT = process.env.PORT || 3002;

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') && args[1] && args[2]) {
    // Mode test d'un token spécifique: node coingecko-terminal-api.js --test solana So11111111111111111111111111111111111111112
    const network = args[1];
    const address = args[2];
    testToken(network, address).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    // Mode serveur
    app.listen(PORT, () => {
      console.log(`🚀 API CoinGecko Terminal démarrée sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`📖 Documentation: http://localhost:${PORT}/api/info`);
      console.log(`💡 Exemples:`);
      console.log(`   Token SOL: http://localhost:${PORT}/api/token/solana/So11111111111111111111111111111111111111112`);
      console.log(`   Recherche: http://localhost:${PORT}/api/search?query=PEPE&network=solana`);
      console.log(`   Trending: http://localhost:${PORT}/api/trending/solana`);
    });
  }
}

module.exports = app;
