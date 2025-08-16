import fetch from 'node-fetch';

// Types
interface DexScreenerPair {
  pairAddress: string;
  dexId: string;
  url: string;
  chainId: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  liquidity: {
    usd: number;
  };
  volume: {
    h24: number;
  };
  marketCap?: number;
  fdv?: number;
}

interface TokenPrice {
  price_usd: number;
  source: 'dexscreener' | 'jupiter' | 'none';
  liquidity_usd?: number;
  market_cap?: number;
  fdv?: number;
  last_updated: Date;
}

class PriceManager {
  private cache = new Map<string, { price: TokenPrice; expiry: number }>();
  private readonly CACHE_TTL = 60 * 1000; // 60 secondes
  private readonly BATCH_SIZE = 20;
  private readonly REQUEST_DELAY = 100; // ms entre requêtes

  // Circuit breaker pour éviter trop d'erreurs
  private circuitBreaker = {
    dexscreener: { failures: 0, lastFailure: 0, isOpen: false },
    jupiter: { failures: 0, lastFailure: 0, isOpen: false }
  };

  /**
   * Obtenir le prix d'un token avec cache et fallbacks
   */
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    // Vérifier le cache
    const cached = this.getCachedPrice(tokenAddress);
    if (cached) {
      return cached;
    }

    // Essayer DexScreener en premier
    let price = await this.fetchFromDexScreener(tokenAddress);
    
    // Fallback Jupiter si DexScreener échoue
    if (!price || price.source === 'none') {
      price = await this.fetchFromJupiter(tokenAddress);
    }

    // Mettre en cache si succès
    if (price && price.source !== 'none') {
      this.setCachedPrice(tokenAddress, price);
    }

    return price || {
      price_usd: 0,
      source: 'none',
      last_updated: new Date()
    };
  }

  /**
   * Obtenir les prix par batch avec gestion des erreurs
   */
  async getTokenPricesBatch(tokenAddresses: string[]): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();
    
    // Traiter par batches
    for (let i = 0; i < tokenAddresses.length; i += this.BATCH_SIZE) {
      const batch = tokenAddresses.slice(i, i + this.BATCH_SIZE);
      
      // Traitement parallèle du batch
      const batchPromises = batch.map(async (address) => {
        try {
          const price = await this.getTokenPrice(address);
          return { address, price };
        } catch (error) {
          console.error(`Error fetching price for ${address}:`, error);
          return {
            address,
            price: { price_usd: 0, source: 'none' as const, last_updated: new Date() }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Ajouter aux résultats
      batchResults.forEach(({ address, price }) => {
        results.set(address, price);
      });

      // Délai entre les batches
      if (i + this.BATCH_SIZE < tokenAddresses.length) {
        await this.delay(this.REQUEST_DELAY);
      }
    }

    return results;
  }

  /**
   * Recherche via DexScreener (méthode principale)
   */
  private async fetchFromDexScreener(tokenAddress: string): Promise<TokenPrice | null> {
    if (this.isCircuitOpen('dexscreener')) {
      return null;
    }

    try {
      // Méthode 1: recherche par token address
      let url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Copy-Trading-ETL/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json() as { pairs?: DexScreenerPair[] };
      
      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      // Filtrer les paires Solana et trouver la plus liquide
      const solanaPairs = data.pairs.filter(pair => pair.chainId === 'solana');
      
      if (solanaPairs.length === 0) {
        return null;
      }

      // Trier par liquidité (DESC) et prendre la meilleure
      const bestPair = solanaPairs.sort((a, b) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

      const price: TokenPrice = {
        price_usd: parseFloat(bestPair.priceUsd || '0'),
        source: 'dexscreener',
        liquidity_usd: bestPair.liquidity?.usd || 0,
        market_cap: bestPair.marketCap,
        fdv: bestPair.fdv,
        last_updated: new Date()
      };

      // Reset circuit breaker on success
      this.resetCircuitBreaker('dexscreener');
      
      return price;

    } catch (error) {
      console.error(`DexScreener error for ${tokenAddress}:`, error);
      this.recordFailure('dexscreener');
      return null;
    }
  }

  /**
   * Fallback via Jupiter Price API
   */
  private async fetchFromJupiter(tokenAddress: string): Promise<TokenPrice | null> {
    if (this.isCircuitOpen('jupiter')) {
      return null;
    }

    try {
      const url = `https://price.jup.ag/v4/price?ids=${tokenAddress}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Copy-Trading-ETL/1.0'
        },
        timeout: 8000
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const data = await response.json() as { 
        data?: { [key: string]: { price: number } } 
      };

      const tokenPrice = data.data?.[tokenAddress]?.price;
      
      if (!tokenPrice) {
        return null;
      }

      const price: TokenPrice = {
        price_usd: tokenPrice,
        source: 'jupiter',
        last_updated: new Date()
      };

      // Reset circuit breaker on success
      this.resetCircuitBreaker('jupiter');
      
      return price;

    } catch (error) {
      console.error(`Jupiter error for ${tokenAddress}:`, error);
      this.recordFailure('jupiter');
      return null;
    }
  }

  /**
   * Gestion du cache
   */
  private getCachedPrice(tokenAddress: string): TokenPrice | null {
    const cached = this.cache.get(tokenAddress);
    if (cached && Date.now() < cached.expiry) {
      return cached.price;
    }
    
    // Nettoyer le cache expiré
    if (cached) {
      this.cache.delete(tokenAddress);
    }
    
    return null;
  }

  private setCachedPrice(tokenAddress: string, price: TokenPrice): void {
    this.cache.set(tokenAddress, {
      price,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * Circuit breaker management
   */
  private isCircuitOpen(service: 'dexscreener' | 'jupiter'): boolean {
    const circuit = this.circuitBreaker[service];
    
    // Si trop d'échecs récents, ouvrir le circuit
    if (circuit.failures >= 5 && Date.now() - circuit.lastFailure < 30000) {
      circuit.isOpen = true;
      return true;
    }
    
    // Réinitialiser après 30s
    if (circuit.isOpen && Date.now() - circuit.lastFailure > 30000) {
      circuit.isOpen = false;
      circuit.failures = 0;
    }
    
    return circuit.isOpen;
  }

  private recordFailure(service: 'dexscreener' | 'jupiter'): void {
    const circuit = this.circuitBreaker[service];
    circuit.failures++;
    circuit.lastFailure = Date.now();
  }

  private resetCircuitBreaker(service: 'dexscreener' | 'jupiter'): void {
    const circuit = this.circuitBreaker[service];
    circuit.failures = 0;
    circuit.isOpen = false;
  }

  /**
   * Utilitaires
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Statistiques pour monitoring
   */
  getStats() {
    return {
      cache_size: this.cache.size,
      dexscreener_failures: this.circuitBreaker.dexscreener.failures,
      jupiter_failures: this.circuitBreaker.jupiter.failures,
      dexscreener_circuit_open: this.circuitBreaker.dexscreener.isOpen,
      jupiter_circuit_open: this.circuitBreaker.jupiter.isOpen
    };
  }

  /**
   * Nettoyer le cache (pour tests ou maintenance)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton
export const priceManager = new PriceManager();

// Export des types
export type { TokenPrice, DexScreenerPair };
