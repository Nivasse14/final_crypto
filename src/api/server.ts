import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import { WalletETL } from '../etl/index.js';

interface QueryFilters {
  min_winrate?: number;
  min_pf?: number;
  min_expectancy?: number;
  max_drawdown?: number;
  min_trades?: number;
  min_recency?: number;
  min_portfolio_value?: number;
  cap_focus?: string[];
  min_unrealized_value?: number;
  limit?: number;
  offset?: number;
}

export class WalletAPIServer {
  private app: express.Application;
  private db: Pool;
  private etl: WalletETL;

  constructor(databaseUrl: string) {
    this.app = express();
    this.db = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    this.etl = new WalletETL({ databaseUrl });
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // GET /wallets/top - Liste des meilleurs wallets
    this.app.get('/wallets/top', async (req, res) => {
      try {
        const filters = this.parseQueryFilters(req.query);
        const wallets = await this.getTopWallets(filters);
        
        res.json({
          success: true,
          count: wallets.length,
          filters: filters,
          data: wallets
        });
      } catch (error) {
        console.error('Error in /wallets/top:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // GET /wallets/:address/positions - Positions actuelles d'un wallet
    this.app.get('/wallets/:address/positions', async (req, res) => {
      try {
        const { address } = req.params;
        const positions = await this.getWalletPositions(address);
        
        res.json({
          success: true,
          wallet_address: address,
          count: positions.length,
          data: positions
        });
      } catch (error) {
        console.error(`Error in /wallets/${req.params.address}/positions:`, error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // GET /wallets/:address/metrics - Métriques d'un wallet
    this.app.get('/wallets/:address/metrics', async (req, res) => {
      try {
        const { address } = req.params;
        const { window = '30d' } = req.query;
        
        const metrics = await this.getWalletMetrics(address, window as string);
        
        if (!metrics) {
          return res.status(404).json({
            success: false,
            error: 'Wallet not found'
          });
        }
        
        res.json({
          success: true,
          wallet_address: address,
          window: window,
          data: metrics
        });
      } catch (error) {
        console.error(`Error in /wallets/${req.params.address}/metrics:`, error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // POST /wallets/process - Traiter un wallet via l'API Cielo
    this.app.post('/wallets/process', async (req, res) => {
      try {
        const { wallet_address } = req.body;
        
        if (!wallet_address) {
          return res.status(400).json({
            success: false,
            error: 'wallet_address is required'
          });
        }

        // Lancer le traitement en arrière-plan
        this.etl.processWalletFromAPI(wallet_address).catch(error => {
          console.error(`Background processing failed for ${wallet_address}:`, error);
        });

        res.json({
          success: true,
          message: 'Wallet processing started',
          wallet_address: wallet_address
        });
      } catch (error) {
        console.error('Error in /wallets/process:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // POST /wallets/update - Mettre à jour un wallet avec les nouvelles métriques
    this.app.post('/wallets/update', async (req, res) => {
      try {
        const { wallet_address, metrics } = req.body;
        
        if (!wallet_address) {
          return res.status(400).json({
            success: false,
            error: 'wallet_address is required'
          });
        }

        if (!metrics) {
          return res.status(400).json({
            success: false,
            error: 'metrics are required'
          });
        }

        // Préparer les données à insérer/mettre à jour
        const query = `
          INSERT INTO public.wallet_registry (
            wallet_address,
            enriched_total_pnl_usd,
            enriched_winrate,
            enriched_total_trades,
            average_holding_time,
            total_pnl,
            winrate,
            total_roi_percentage,
            swap_count,
            first_swap_timestamp,
            last_swap_timestamp,
            unique_trading_days,
            consecutive_trading_days,
            average_trades_per_token,
            status,
            processing_version,
            updated_at,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (wallet_address) DO UPDATE SET
            enriched_total_pnl_usd = EXCLUDED.enriched_total_pnl_usd,
            enriched_winrate = EXCLUDED.enriched_winrate,
            enriched_total_trades = EXCLUDED.enriched_total_trades,
            average_holding_time = EXCLUDED.average_holding_time,
            total_pnl = EXCLUDED.total_pnl,
            winrate = EXCLUDED.winrate,
            total_roi_percentage = EXCLUDED.total_roi_percentage,
            swap_count = EXCLUDED.swap_count,
            first_swap_timestamp = EXCLUDED.first_swap_timestamp,
            last_swap_timestamp = EXCLUDED.last_swap_timestamp,
            unique_trading_days = EXCLUDED.unique_trading_days,
            consecutive_trading_days = EXCLUDED.consecutive_trading_days,
            average_trades_per_token = EXCLUDED.average_trades_per_token,
            status = EXCLUDED.status,
            processing_version = EXCLUDED.processing_version,
            updated_at = EXCLUDED.updated_at
          RETURNING *;
        `;

        const queryParams = [
          wallet_address,
          metrics.enriched_total_pnl_usd || null,
          metrics.enriched_winrate || null,
          metrics.enriched_total_trades || null,
          metrics.average_holding_time || null,
          metrics.total_pnl || null,
          metrics.winrate || null,
          metrics.total_roi_percentage || null,
          metrics.swap_count || null,
          metrics.first_swap_timestamp || null,
          metrics.last_swap_timestamp || null,
          metrics.unique_trading_days || null,
          metrics.consecutive_trading_days || null,
          metrics.average_trades_per_token || null,
          metrics.status || 'enriched',
          metrics.processing_version || 'v4_cielo_metrics',
          new Date().toISOString(),
          new Date().toISOString()
        ];

        const result = await this.db.query(query, queryParams);
        const data = result.rows[0];

        res.json({
          success: true,
          message: 'Wallet updated successfully',
          wallet_address: wallet_address,
          data: data
        });
      } catch (error) {
        console.error('Error in /wallets/update:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    });

    // GET /health - État du système
    this.app.get('/health', async (req, res) => {
      try {
        const stats = await this.etl.getProcessingStats();
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          database: 'connected',
          api_version: '1.0.0',
          stats: stats
        });
      } catch (error) {
        console.error('Error in /health:', error);
        res.status(500).json({
          success: false,
          error: 'Health check failed',
          message: error.message
        });
      }
    });

    // GET / - Documentation
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Solana Copy Trading API',
        version: '1.0.0',
        description: 'API pour l\'analyse et le classement des wallets Solana pour copy trading',
        endpoints: {
          'GET /wallets/top': {
            description: 'Liste des meilleurs wallets triés par copy_trading_score',
            parameters: {
              min_winrate: 'Winrate minimum (ex: 0.7)',
              min_pf: 'Profit factor minimum (ex: 1.8)',
              min_expectancy: 'Expectancy minimum en USD (ex: 100)',
              max_drawdown: 'Drawdown maximum en USD (ex: 500)',
              min_trades: 'Nombre minimum de trades (ex: 30)',
              min_recency: 'Score de récence minimum (ex: 0.5)',
              min_portfolio_value: 'Valeur minimum du portfolio en USD (ex: 1000)',
              cap_focus: 'Focus sur market cap (micro,low,mid,large,mega)',
              min_unrealized_value: 'Valeur minimum des positions non réalisées (ex: 1000)',
              limit: 'Nombre maximum de résultats (défaut: 50)',
              offset: 'Offset pour pagination (défaut: 0)'
            }
          },
          'GET /wallets/:address/positions': 'Positions actuelles d\'un wallet',
          'GET /wallets/:address/metrics?window=30d': {
            description: 'Métriques d\'un wallet',
            returned_fields: {
              performance_metrics: 'pnl_30d, roi_pct_30d, winrate_30d, profit_factor_30d',
              risk_metrics: 'drawdown_max_usd_30d, expectancy_usd_30d',
              behavioral_metrics: 'median_hold_min_30d, scalp_ratio_30d',
              cielo_api_metrics: 'average_holding_time, total_pnl, winrate, total_roi_percentage, swap_count, first_swap_timestamp, last_swap_timestamp, unique_trading_days, consecutive_trading_days, average_trades_per_token',
              market_cap_exposure: 'cap_exposure_*_pct_30d (nano, micro, low, mid, large, mega)',
              composite_score: 'copy_trading_score (0-100)'
            }
          },
          'POST /wallets/process': 'Traiter un wallet via API Cielo',
          'POST /wallets/update': 'Mettre à jour un wallet avec les nouvelles métriques',
          'GET /health': 'État du système et statistiques'
        },
        example: '/wallets/top?min_winrate=0.7&min_pf=1.8&min_trades=30&max_drawdown=500&min_unrealized_value=1000&cap_focus=mid,large',
        new_metrics_added: {
          description: 'Nouvelles métriques de l\'API Cielo ajoutées',
          fields: {
            average_holding_time: 'Temps de détention moyen en heures',
            total_pnl: 'PnL total en USD',
            winrate: 'Taux de réussite (0-1)',
            total_roi_percentage: 'ROI total en pourcentage',
            swap_count: 'Nombre total de swaps',
            first_swap_timestamp: 'Timestamp du premier swap',
            last_swap_timestamp: 'Timestamp du dernier swap',
            unique_trading_days: 'Nombre de jours de trading uniques',
            consecutive_trading_days: 'Jours de trading consécutifs',
            average_trades_per_token: 'Nombre moyen de trades par token'
          }
        }
      });
    });
  }

  /**
   * Parser les filtres de requête
   */
  private parseQueryFilters(query: any): QueryFilters {
    const filters: QueryFilters = {};

    if (query.min_winrate) filters.min_winrate = parseFloat(query.min_winrate);
    if (query.min_pf) filters.min_pf = parseFloat(query.min_pf);
    if (query.min_expectancy) filters.min_expectancy = parseFloat(query.min_expectancy);
    if (query.max_drawdown) filters.max_drawdown = parseFloat(query.max_drawdown);
    if (query.min_trades) filters.min_trades = parseInt(query.min_trades);
    if (query.min_recency) filters.min_recency = parseFloat(query.min_recency);
    if (query.min_portfolio_value) filters.min_portfolio_value = parseFloat(query.min_portfolio_value);
    if (query.min_unrealized_value) filters.min_unrealized_value = parseFloat(query.min_unrealized_value);
    if (query.limit) filters.limit = parseInt(query.limit);
    if (query.offset) filters.offset = parseInt(query.offset);

    if (query.cap_focus) {
      filters.cap_focus = Array.isArray(query.cap_focus) 
        ? query.cap_focus 
        : query.cap_focus.split(',').map((s: string) => s.trim());
    }

    return filters;
  }

  /**
   * Récupérer les top wallets avec filtres
   */
  private async getTopWallets(filters: QueryFilters): Promise<any[]> {
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Construire les conditions WHERE
    if (filters.min_winrate) {
      whereConditions.push(`winrate_30d >= $${paramIndex++}`);
      queryParams.push(filters.min_winrate);
    }
    
    if (filters.min_pf) {
      whereConditions.push(`profit_factor_30d >= $${paramIndex++}`);
      queryParams.push(filters.min_pf);
    }
    
    if (filters.min_expectancy) {
      whereConditions.push(`expectancy_usd_30d >= $${paramIndex++}`);
      queryParams.push(filters.min_expectancy);
    }
    
    if (filters.max_drawdown) {
      whereConditions.push(`drawdown_max_usd_30d <= $${paramIndex++}`);
      queryParams.push(filters.max_drawdown);
    }
    
    if (filters.min_trades) {
      whereConditions.push(`trades_30d >= $${paramIndex++}`);
      queryParams.push(filters.min_trades);
    }
    
    if (filters.min_recency) {
      whereConditions.push(`recency_score_30d >= $${paramIndex++}`);
      queryParams.push(filters.min_recency);
    }

    // Filtre par cap focus (doit avoir exposition significative dans les caps demandées)
    if (filters.cap_focus && filters.cap_focus.length > 0) {
      const capConditions: string[] = [];
      
      for (const cap of filters.cap_focus) {
        switch (cap.toLowerCase()) {
          case 'nano':
            capConditions.push(`cap_exposure_nano_pct_30d >= 10`);
            break;
          case 'micro':
            capConditions.push(`cap_exposure_micro_pct_30d >= 10`);
            break;
          case 'low':
            capConditions.push(`cap_exposure_low_pct_30d >= 10`);
            break;
          case 'mid':
            capConditions.push(`cap_exposure_mid_pct_30d >= 10`);
            break;
          case 'large':
            capConditions.push(`cap_exposure_large_pct_30d >= 10`);
            break;
          case 'mega':
            capConditions.push(`cap_exposure_mega_pct_30d >= 10`);
            break;
        }
      }
      
      if (capConditions.length > 0) {
        whereConditions.push(`(${capConditions.join(' OR ')})`);
      }
    }

    // Jointure avec positions pour portfolio value et unrealized value
    let joinClause = '';
    if (filters.min_portfolio_value || filters.min_unrealized_value) {
      joinClause = `
        LEFT JOIN (
          SELECT 
            wallet_address,
            SUM(holding_amount_usd) as total_portfolio_value,
            SUM(CASE WHEN unrealized_pnl_usd > 0 THEN unrealized_pnl_usd ELSE 0 END) as total_unrealized_value
          FROM public.wallet_token_positions 
          GROUP BY wallet_address
        ) pos ON wr.wallet_address = pos.wallet_address
      `;
      
      if (filters.min_portfolio_value) {
        whereConditions.push(`pos.total_portfolio_value >= $${paramIndex++}`);
        queryParams.push(filters.min_portfolio_value);
      }
      
      if (filters.min_unrealized_value) {
        whereConditions.push(`pos.total_unrealized_value >= $${paramIndex++}`);
        queryParams.push(filters.min_unrealized_value);
      }
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT 
        wr.wallet_address,
        wr.copy_trading_score,
        wr.winrate_30d,
        wr.profit_factor_30d,
        wr.expectancy_usd_30d,
        wr.pnl_30d,
        wr.roi_pct_30d,
        wr.trades_30d,
        wr.drawdown_max_usd_30d,
        wr.median_hold_min_30d,
        wr.scalp_ratio_30d,
        wr.liquidity_median_usd_30d,
        wr.recency_score_30d,
        wr.cap_exposure_nano_pct_30d,
        wr.cap_exposure_micro_pct_30d,
        wr.cap_exposure_low_pct_30d,
        wr.cap_exposure_mid_pct_30d,
        wr.cap_exposure_large_pct_30d,
        wr.cap_exposure_mega_pct_30d,
        wr.last_processed_at
        ${joinClause ? ', pos.total_portfolio_value, pos.total_unrealized_value' : ''}
      FROM public.wallet_registry wr
      ${joinClause}
      ${whereClause}
      ORDER BY wr.copy_trading_score DESC NULLS LAST
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(limit, offset);

    const result = await this.db.query(query, queryParams);
    return result.rows;
  }

  /**
   * Récupérer les positions d'un wallet
   */
  private async getWalletPositions(walletAddress: string): Promise<any[]> {
    const query = `
      SELECT 
        token_address,
        token_symbol,
        token_name,
        net_position,
        avg_cost_per_unit,
        price_now_usd,
        holding_amount,
        holding_amount_usd,
        unrealized_pnl_usd,
        unrealized_roi_pct,
        last_price_source,
        last_updated_at
      FROM public.wallet_token_positions
      WHERE wallet_address = $1
      ORDER BY holding_amount_usd DESC NULLS LAST
    `;

    const result = await this.db.query(query, [walletAddress]);
    return result.rows;
  }

  /**
   * Récupérer les métriques d'un wallet
   */
  private async getWalletMetrics(walletAddress: string, window: string): Promise<any | null> {
    // Pour l'instant, seulement 30d supporté
    if (window !== '30d') {
      throw new Error('Only 30d window is currently supported');
    }

    const query = `
      SELECT 
        wallet_address,
        pnl_30d,
        roi_pct_30d,
        winrate_30d,
        trades_30d,
        gross_profit_30d,
        gross_loss_abs_30d,
        profit_factor_30d,
        expectancy_usd_30d,
        drawdown_max_usd_30d,
        median_hold_min_30d,
        scalp_ratio_30d,
        liquidity_median_usd_30d,
        recency_score_30d,
        cap_exposure_nano_pct_30d,
        cap_exposure_micro_pct_30d,
        cap_exposure_low_pct_30d,
        cap_exposure_mid_pct_30d,
        cap_exposure_large_pct_30d,
        cap_exposure_mega_pct_30d,
        copy_trading_score,
        -- Nouvelles métriques API Cielo
        average_holding_time,
        total_pnl,
        winrate,
        total_roi_percentage,
        swap_count,
        first_swap_timestamp,
        last_swap_timestamp,
        unique_trading_days,
        consecutive_trading_days,
        average_trades_per_token,
        last_processed_at
      FROM public.wallet_registry
      WHERE wallet_address = $1
    `;

    const result = await this.db.query(query, [walletAddress]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Démarrer le serveur
   */
  start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`🚀 Wallet API Server started on port ${port}`);
      console.log(`📖 Documentation: http://localhost:${port}`);
      console.log(`🔍 Top wallets: http://localhost:${port}/wallets/top`);
      console.log(`❤️  Health check: http://localhost:${port}/health`);
    });
  }

  /**
   * Fermer les connexions
   */
  async close(): Promise<void> {
    await this.db.end();
    await this.etl.close();
  }
}
