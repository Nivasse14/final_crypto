// Script d'enrichissement de tokens via DexScreener API
// Usage: node dexscreener-token-enricher.js [TOKEN_NAME]

const fetch = require('node-fetch');

class DexScreenerEnricher {
  constructor() {
    this.baseUrl = 'https://api.dexscreener.com/latest/dex';
  }

  // Headers pour les requêtes DexScreener
  getHeaders() {
    return {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
  }

  // Fonction principale d'enrichissement d'un token
  async enrichToken(tokenQuery) {
    try {
      console.log(`🔍 Enrichissement du token: ${tokenQuery}`);
      
      // 1. Rechercher le token sur DexScreener
      const searchResults = await this.searchToken(tokenQuery);
      
      if (!searchResults || searchResults.length === 0) {
        console.log(`❌ Aucun résultat trouvé pour: ${tokenQuery}`);
        return null;
      }

      // 2. Trouver le premier résultat Solana
      const solanaPair = this.findSolanaPair(searchResults);
      
      if (!solanaPair) {
        console.log(`❌ Aucune paire Solana trouvée pour: ${tokenQuery}`);
        return null;
      }

      console.log(`✅ Paire Solana trouvée: ${solanaPair.pairAddress}`);

      // 3. Récupérer les détails complets de la paire
      const pairDetails = await this.getPairDetails(solanaPair.pairAddress);
      
      if (!pairDetails) {
        console.log(`❌ Impossible de récupérer les détails de la paire: ${solanaPair.pairAddress}`);
        return null;
      }

      // 4. Extraire et formater les données
      const enrichedData = this.extractTokenData(pairDetails, tokenQuery);
      
      console.log(`✅ Enrichissement réussi pour: ${tokenQuery}`);
      return enrichedData;

    } catch (error) {
      console.error(`❌ Erreur lors de l'enrichissement de ${tokenQuery}:`, error.message);
      return null;
    }
  }

  // Rechercher un token sur DexScreener
  async searchToken(query) {
    try {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      console.log(`📡 Recherche: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Résultats de recherche: ${data.pairs?.length || 0} paires trouvées`);
      
      return data.pairs || [];

    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error.message);
      return null;
    }
  }

  // Trouver la première paire Solana dans les résultats
  findSolanaPair(pairs) {
    if (!pairs || !Array.isArray(pairs)) {
      return null;
    }

    const solanaPair = pairs.find(pair => pair.chainId === 'solana');
    
    if (solanaPair) {
      console.log(`🎯 Paire Solana sélectionnée: ${solanaPair.baseToken?.symbol || 'N/A'} / ${solanaPair.quoteToken?.symbol || 'N/A'}`);
      console.log(`📍 Adresse de la paire: ${solanaPair.pairAddress}`);
    }

    return solanaPair;
  }

  // Récupérer les détails complets d'une paire
  async getPairDetails(pairAddress) {
    try {
      const detailsUrl = `${this.baseUrl}/pairs/solana/${pairAddress}`;
      console.log(`📡 Détails de la paire: ${detailsUrl}`);
      
      const response = await fetch(detailsUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Pair details API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.pair) {
        throw new Error('Aucune donnée de paire trouvée dans la réponse');
      }

      console.log(`✅ Détails récupérés pour la paire: ${data.pair.baseToken?.symbol || 'N/A'}`);
      return data.pair;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error.message);
      return null;
    }
  }

  // Extraire et formater les données du token
  extractTokenData(pairData, originalQuery) {
    try {
      const extractedData = {
        // Métadonnées de recherche
        search_query: originalQuery,
        extraction_timestamp: new Date().toISOString(),
        data_source: 'DexScreener',
        
        // Informations de base du token
        token_info: {
          symbol: pairData.baseToken?.symbol || null,
          name: pairData.baseToken?.name || null,
          address: pairData.baseToken?.address || null
        },
        
        // Informations de la paire
        pair_info: {
          pair_address: pairData.pairAddress || null,
          dex_id: pairData.dexId || null,
          url: pairData.url || null,
          chain_id: pairData.chainId || null
        },
        
        // Données financières principales
        financial_data: {
          price_usd: this.safeParseFloat(pairData.priceUsd),
          price_change_24h: this.safeParseFloat(pairData.priceChange?.h24),
          liquidity_usd: this.safeParseFloat(pairData.liquidity?.usd),
          volume_24h_usd: this.safeParseFloat(pairData.volume?.h24),
          fdv: this.safeParseFloat(pairData.fdv),
          market_cap: this.safeParseFloat(pairData.marketCap)
        },
        
        // Données étendues
        extended_data: {
          price_change_5m: this.safeParseFloat(pairData.priceChange?.m5),
          price_change_1h: this.safeParseFloat(pairData.priceChange?.h1),
          price_change_6h: this.safeParseFloat(pairData.priceChange?.h6),
          volume_5m: this.safeParseFloat(pairData.volume?.m5),
          volume_1h: this.safeParseFloat(pairData.volume?.h1),
          volume_6h: this.safeParseFloat(pairData.volume?.h6),
          transactions_24h_buys: this.safeParseInt(pairData.txns?.h24?.buys),
          transactions_24h_sells: this.safeParseInt(pairData.txns?.h24?.sells)
        },
        
        // Score de fiabilité calculé
        reliability_score: this.calculateReliabilityScore(pairData)
      };

      return extractedData;

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction des données:', error.message);
      return null;
    }
  }

  // Parser sécurisé pour les nombres flottants
  safeParseFloat(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Parser sécurisé pour les entiers
  safeParseInt(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Calculer un score de fiabilité basé sur les données DexScreener
  calculateReliabilityScore(pairData) {
    let score = 0;
    const factors = {};

    // Facteur 1: Liquidité (0-30 points)
    const liquidityUsd = this.safeParseFloat(pairData.liquidity?.usd);
    if (liquidityUsd > 1000000) { // > 1M USD
      score += 30;
      factors.liquidity = 'excellent';
    } else if (liquidityUsd > 100000) { // > 100k USD
      score += 20;
      factors.liquidity = 'good';
    } else if (liquidityUsd > 10000) { // > 10k USD
      score += 10;
      factors.liquidity = 'fair';
    } else {
      factors.liquidity = 'poor';
    }

    // Facteur 2: Volume 24h (0-25 points)
    const volume24h = this.safeParseFloat(pairData.volume?.h24);
    if (volume24h > 1000000) { // > 1M USD
      score += 25;
      factors.volume_24h = 'excellent';
    } else if (volume24h > 100000) { // > 100k USD
      score += 20;
      factors.volume_24h = 'good';
    } else if (volume24h > 10000) { // > 10k USD
      score += 15;
      factors.volume_24h = 'fair';
    } else {
      factors.volume_24h = 'poor';
    }

    // Facteur 3: Market Cap (0-25 points)
    const marketCap = this.safeParseFloat(pairData.marketCap);
    if (marketCap > 100000000) { // > 100M USD
      score += 25;
      factors.market_cap = 'excellent';
    } else if (marketCap > 10000000) { // > 10M USD
      score += 20;
      factors.market_cap = 'good';
    } else if (marketCap > 1000000) { // > 1M USD
      score += 15;
      factors.market_cap = 'fair';
    } else {
      factors.market_cap = 'poor';
    }

    // Facteur 4: Activité de trading (0-20 points)
    const buys24h = this.safeParseInt(pairData.txns?.h24?.buys);
    const sells24h = this.safeParseInt(pairData.txns?.h24?.sells);
    const totalTxns = (buys24h || 0) + (sells24h || 0);
    
    if (totalTxns > 1000) {
      score += 20;
      factors.trading_activity = 'high';
    } else if (totalTxns > 100) {
      score += 15;
      factors.trading_activity = 'medium';
    } else if (totalTxns > 10) {
      score += 10;
      factors.trading_activity = 'low';
    } else {
      factors.trading_activity = 'very_low';
    }

    return {
      total_score: Math.min(score, 100),
      factors,
      rating: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };
  }

  // Fonction utilitaire pour tester plusieurs tokens
  async enrichMultipleTokens(tokenQueries) {
    console.log(`🚀 Enrichissement de ${tokenQueries.length} tokens`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (let i = 0; i < tokenQueries.length; i++) {
      const query = tokenQueries[i];
      console.log(`\n📊 Token ${i + 1}/${tokenQueries.length}: ${query}`);
      
      const result = await this.enrichToken(query);
      results.push({
        query,
        success: !!result,
        data: result
      });
      
      // Pause entre les appels pour éviter le rate limiting
      if (i < tokenQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }
}

// Fonction principale
async function main() {
  const enricher = new DexScreenerEnricher();
  
  // Récupérer le token depuis les arguments de ligne de commande
  const tokenQuery = process.argv[2];
  
  if (!tokenQuery) {
    console.log('❌ Usage: node dexscreener-token-enricher.js <TOKEN_NAME>');
    console.log('💡 Exemple: node dexscreener-token-enricher.js bonk');
    process.exit(1);
  }
  
  console.log('🚀 DexScreener Token Enricher');
  console.log('=' .repeat(40));
  
  // Enrichir le token
  const result = await enricher.enrichToken(tokenQuery);
  
  if (result) {
    console.log('\n📋 RÉSULTAT FINAL:');
    console.log('=' .repeat(30));
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\n❌ Échec de l\'enrichissement');
    process.exit(1);
  }
}

// Test avec plusieurs tokens populaires si aucun argument n'est fourni
async function runTests() {
  const enricher = new DexScreenerEnricher();
  const testTokens = ['bonk', 'jupiter', 'solana', 'jup'];
  
  console.log('🧪 Mode test avec tokens populaires');
  const results = await enricher.enrichMultipleTokens(testTokens);
  
  console.log('\n📋 RÉSULTATS DES TESTS:');
  console.log('=' .repeat(40));
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.query}: ${result.success ? '✅ Succès' : '❌ Échec'}`);
    if (result.success && result.data) {
      console.log(`   Prix: $${result.data.financial_data.price_usd || 'N/A'}`);
      console.log(`   Market Cap: $${result.data.financial_data.market_cap?.toLocaleString() || 'N/A'}`);
      console.log(`   Liquidité: $${result.data.financial_data.liquidity_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   Score: ${result.data.reliability_score.total_score}/100 (${result.data.reliability_score.rating})`);
    }
  });
}

// Exporter la classe pour utilisation dans d'autres modules
module.exports = DexScreenerEnricher;

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
