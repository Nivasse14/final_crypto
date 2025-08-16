import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { priceManager, TokenPrice } from '../lib/prices.js';
import { 
  MetricsCalculator, 
  WalletPnLData, 
  WalletPosition, 
  WalletMetrics30d 
} from '../lib/metrics.js';

interface ETLConfig {
  databaseUrl: string;
  inputFilePath?: string;
  batchSize?: number;
  maxRetries?: number;
}

export class WalletETL {
  private db: Pool;
  private metricsCalculator: MetricsCalculator;
  private config: ETLConfig;

  constructor(config: ETLConfig) {
    this.config = {
      batchSize: 50,
      maxRetries: 3,
      ...config
    };

    this.db = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.metricsCalculator = new MetricsCalculator();
  }

  /**
   * Pipeline ETL principal
   */
  async processWalletData(inputData?: WalletPnLData[]): Promise<void> {
    console.log('🚀 Starting Wallet ETL Pipeline...');
    
    try {
      // 1. Charger les données d'entrée
      let walletDataList: WalletPnLData[];
      
      if (inputData) {
        walletDataList = inputData;
        console.log(`📥 Using provided data: ${walletDataList.length} wallets`);
      } else if (this.config.inputFilePath) {
        walletDataList = await this.loadDataFromFile(this.config.inputFilePath);
        console.log(`📁 Loaded from file: ${walletDataList.length} wallets`);
      } else {
        throw new Error('No input data provided');
      }

      // 2. Traiter par batches
      for (let i = 0; i < walletDataList.length; i += this.config.batchSize!) {
        const batch = walletDataList.slice(i, i + this.config.batchSize!);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / this.config.batchSize!) + 1}/${Math.ceil(walletDataList.length / this.config.batchSize!)} (${batch.length} wallets)`);
        
        await this.processBatch(batch);
        
        // Délai entre les batches pour éviter la surcharge
        if (i + this.config.batchSize! < walletDataList.length) {
          await this.delay(1000);
        }
      }

      console.log('✅ ETL Pipeline completed successfully');
      
    } catch (error) {
      console.error('❌ ETL Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Traiter un batch de wallets
   */
  private async processBatch(walletDataList: WalletPnLData[]): Promise<void> {
    // 1. Collecter tous les token addresses uniques du batch
    const allTokenAddresses = new Set<string>();
    
    for (const walletData of walletDataList) {
      for (const token of walletData.pnl_fast.summary.tokens) {
        const address = token.token_address || token.mint;
        if (address) {
          allTokenAddresses.add(address);
        }
      }
    }

    console.log(`🔍 Fetching prices for ${allTokenAddresses.size} unique tokens...`);

    // 2. Récupérer tous les prix en une fois
    const priceData = await priceManager.getTokenPricesBatch(Array.from(allTokenAddresses));
    
    const successfulPrices = Array.from(priceData.values()).filter(p => p.source !== 'none').length;
    console.log(`📊 Price fetch: ${successfulPrices}/${allTokenAddresses.size} successful`);

    // 3. Traiter chaque wallet du batch
    for (const walletData of walletDataList) {
      try {
        await this.processWallet(walletData, priceData);
      } catch (error) {
        console.error(`❌ Error processing wallet ${walletData.wallet_address}:`, error);
        // Continue avec les autres wallets
      }
    }
  }

  /**
   * Traiter un wallet individuel
   */
  private async processWallet(
    walletData: WalletPnLData, 
    priceData: Map<string, TokenPrice>
  ): Promise<void> {
    console.log(`🎯 Processing wallet: ${walletData.wallet_address}`);

    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Calculer les positions actuelles
      const positions = this.metricsCalculator.calculateCurrentPositions(walletData, priceData);
      console.log(`  💰 Calculated ${positions.length} active positions`);

      // 2. Calculer les métriques 30j
      const metrics30d = this.metricsCalculator.calculateMetrics30d(walletData, priceData);
      console.log(`  📊 Calculated 30d metrics: PnL ${metrics30d.pnl_30d.toFixed(2)} USD, Winrate ${(metrics30d.winrate_30d * 100).toFixed(1)}%`);

      // 3. Upsert positions
      if (positions.length > 0) {
        await this.upsertPositions(client, positions);
      }

      // 4. Upsert métriques dans wallet_registry
      await this.upsertWalletMetrics(client, metrics30d);

      // 5. Calculer et upsert métriques journalières (optionnel pour cette version)
      // await this.upsertDailyMetrics(client, walletData, priceData);

      await client.query('COMMIT');
      console.log(`  ✅ Wallet ${walletData.wallet_address} processed successfully`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Transaction failed for wallet ${walletData.wallet_address}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Upsert positions dans wallet_token_positions
   */
  private async upsertPositions(client: any, positions: WalletPosition[]): Promise<void> {
    for (const position of positions) {
      const query = `
        INSERT INTO public.wallet_token_positions (
          wallet_address, token_address, token_symbol, token_name,
          net_position, avg_cost_per_unit, price_now_usd,
          holding_amount, holding_amount_usd,
          unrealized_pnl_usd, unrealized_roi_pct,
          last_price_source, last_updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (wallet_address, token_address) 
        DO UPDATE SET
          token_symbol = EXCLUDED.token_symbol,
          token_name = EXCLUDED.token_name,
          net_position = EXCLUDED.net_position,
          avg_cost_per_unit = EXCLUDED.avg_cost_per_unit,
          price_now_usd = EXCLUDED.price_now_usd,
          holding_amount = EXCLUDED.holding_amount,
          holding_amount_usd = EXCLUDED.holding_amount_usd,
          unrealized_pnl_usd = EXCLUDED.unrealized_pnl_usd,
          unrealized_roi_pct = EXCLUDED.unrealized_roi_pct,
          last_price_source = EXCLUDED.last_price_source,
          last_updated_at = NOW()
      `;

      await client.query(query, [
        position.wallet_address,
        position.token_address,
        position.token_symbol,
        position.token_name,
        position.net_position,
        position.avg_cost_per_unit,
        position.price_now_usd,
        position.holding_amount,
        position.holding_amount_usd,
        position.unrealized_pnl_usd,
        position.unrealized_roi_pct,
        position.last_price_source
      ]);
    }
  }

  /**
   * Upsert métriques dans wallet_registry
   */
  private async upsertWalletMetrics(client: any, metrics: WalletMetrics30d): Promise<void> {
    const query = `
      INSERT INTO public.wallet_registry (
        wallet_address,
        pnl_30d, roi_pct_30d, winrate_30d, trades_30d,
        gross_profit_30d, gross_loss_abs_30d,
        profit_factor_30d, expectancy_usd_30d, drawdown_max_usd_30d,
        median_hold_min_30d, scalp_ratio_30d, liquidity_median_usd_30d,
        recency_score_30d,
        cap_exposure_nano_pct_30d, cap_exposure_micro_pct_30d,
        cap_exposure_low_pct_30d, cap_exposure_mid_pct_30d,
        cap_exposure_large_pct_30d, cap_exposure_mega_pct_30d,
        copy_trading_score,
        last_processed_at, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, NOW(), 'processed'
      )
      ON CONFLICT (wallet_address) 
      DO UPDATE SET
        pnl_30d = EXCLUDED.pnl_30d,
        roi_pct_30d = EXCLUDED.roi_pct_30d,
        winrate_30d = EXCLUDED.winrate_30d,
        trades_30d = EXCLUDED.trades_30d,
        gross_profit_30d = EXCLUDED.gross_profit_30d,
        gross_loss_abs_30d = EXCLUDED.gross_loss_abs_30d,
        profit_factor_30d = EXCLUDED.profit_factor_30d,
        expectancy_usd_30d = EXCLUDED.expectancy_usd_30d,
        drawdown_max_usd_30d = EXCLUDED.drawdown_max_usd_30d,
        median_hold_min_30d = EXCLUDED.median_hold_min_30d,
        scalp_ratio_30d = EXCLUDED.scalp_ratio_30d,
        liquidity_median_usd_30d = EXCLUDED.liquidity_median_usd_30d,
        recency_score_30d = EXCLUDED.recency_score_30d,
        cap_exposure_nano_pct_30d = EXCLUDED.cap_exposure_nano_pct_30d,
        cap_exposure_micro_pct_30d = EXCLUDED.cap_exposure_micro_pct_30d,
        cap_exposure_low_pct_30d = EXCLUDED.cap_exposure_low_pct_30d,
        cap_exposure_mid_pct_30d = EXCLUDED.cap_exposure_mid_pct_30d,
        cap_exposure_large_pct_30d = EXCLUDED.cap_exposure_large_pct_30d,
        cap_exposure_mega_pct_30d = EXCLUDED.cap_exposure_mega_pct_30d,
        copy_trading_score = EXCLUDED.copy_trading_score,
        last_processed_at = NOW(),
        status = 'processed'
    `;

    await client.query(query, [
      metrics.wallet_address,
      metrics.pnl_30d,
      metrics.roi_pct_30d,
      metrics.winrate_30d,
      metrics.trades_30d,
      metrics.gross_profit_30d,
      metrics.gross_loss_abs_30d,
      metrics.profit_factor_30d,
      metrics.expectancy_usd_30d,
      metrics.drawdown_max_usd_30d,
      metrics.median_hold_min_30d,
      metrics.scalp_ratio_30d,
      metrics.liquidity_median_usd_30d,
      metrics.recency_score_30d,
      metrics.cap_exposure_nano_pct_30d,
      metrics.cap_exposure_micro_pct_30d,
      metrics.cap_exposure_low_pct_30d,
      metrics.cap_exposure_mid_pct_30d,
      metrics.cap_exposure_large_pct_30d,
      metrics.cap_exposure_mega_pct_30d,
      metrics.copy_trading_score
    ]);
  }

  /**
   * Charger les données depuis un fichier JSON
   */
  private async loadDataFromFile(filePath: string): Promise<WalletPnLData[]> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Adapter selon le format du fichier
      if (Array.isArray(data)) {
        return data;
      } else if (data.wallet_address && data.pnl_fast) {
        return [data];
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Traitement d'un wallet depuis l'API Cielo
   */
  async processWalletFromAPI(walletAddress: string): Promise<void> {
    console.log(`🌐 Fetching wallet data from API: ${walletAddress}`);
    
    try {
      // Utiliser notre API Cielo pour récupérer les données
      const apiUrl = process.env.CIELO_API_URL || 'http://localhost:54321/functions/v1/cielo-api';
      const response = await fetch(`${apiUrl}/complete/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Adapter la structure API vers notre format WalletPnLData
      const walletData: WalletPnLData = {
        wallet_address: walletAddress,
        pnl_fast: {
          summary: {
            tokens: apiData.data?.extracted_data?.pnl_fast?.tokens || []
          }
        }
      };

      await this.processWalletData([walletData]);
      
    } catch (error) {
      console.error(`Error processing wallet from API ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Exécuter les migrations de base de données
   */
  async runMigrations(): Promise<void> {
    console.log('🔧 Running database migrations...');
    
    const migrationFiles = [
      '001_wallet_registry_metrics.sql',
      '002_wallet_token_positions.sql',
      '003_wallet_daily_metrics.sql'
    ];

    const client = await this.db.connect();
    
    try {
      for (const file of migrationFiles) {
        const filePath = path.join(__dirname, '../db/migrations', file);
        const sql = await fs.readFile(filePath, 'utf-8');
        
        console.log(`  📄 Executing ${file}...`);
        await client.query(sql);
      }
      
      console.log('✅ Migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir les statistiques de traitement
   */
  async getProcessingStats(): Promise<any> {
    const client = await this.db.connect();
    
    try {
      const queries = {
        totalWallets: 'SELECT COUNT(*) as count FROM public.wallet_registry',
        processedWallets: "SELECT COUNT(*) as count FROM public.wallet_registry WHERE status = 'processed'",
        totalPositions: 'SELECT COUNT(*) as count FROM public.wallet_token_positions',
        avgCopyScore: 'SELECT AVG(copy_trading_score) as avg_score FROM public.wallet_registry WHERE copy_trading_score IS NOT NULL',
        topWallets: `
          SELECT wallet_address, copy_trading_score, winrate_30d, profit_factor_30d 
          FROM public.wallet_registry 
          WHERE copy_trading_score IS NOT NULL 
          ORDER BY copy_trading_score DESC 
          LIMIT 10
        `
      };

      const results: any = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await client.query(query);
        results[key] = result.rows;
      }

      // Ajouter les stats du price manager
      results.priceManagerStats = priceManager.getStats();

      return results;
      
    } finally {
      client.release();
    }
  }

  /**
   * Utilitaires
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.db.end();
  }
}

// Export pour utilisation CLI
export { WalletETL };
