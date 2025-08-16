import { MetricsCalculator, WalletPnLData } from '../lib/metrics.js';
import { TokenPrice } from '../lib/prices.js';

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;
  
  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  describe('calculateCurrentPositions', () => {
    it('should calculate positions correctly', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'test123',
        pnl_fast: {
          summary: {
            tokens: [
              {
                token_symbol: 'BONK',
                token_address: 'bonk123',
                total_buy_usd: 1000,
                total_buy_amount: 50000000,
                total_sell_usd: 600,
                total_sell_amount: 30000000,
                holding_amount: 20000000,
                num_swaps: 2
              }
            ]
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      priceData.set('bonk123', {
        price_usd: 0.000025,
        source: 'dexscreener',
        last_updated: new Date()
      });

      const positions = calculator.calculateCurrentPositions(walletData, priceData);
      
      expect(positions).toHaveLength(1);
      expect(positions[0].wallet_address).toBe('test123');
      expect(positions[0].token_symbol).toBe('BONK');
      expect(positions[0].net_position).toBe(20000000);
      expect(positions[0].avg_cost_per_unit).toBe(0.00002); // 1000 / 50000000
      expect(positions[0].holding_amount_usd).toBe(500); // 20000000 * 0.000025
      expect(positions[0].unrealized_pnl_usd).toBe(100); // 20000000 * (0.000025 - 0.00002)
      expect(positions[0].unrealized_roi_pct).toBe(25); // ((0.000025 / 0.00002) - 1) * 100
    });

    it('should skip tokens with zero position', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'test123',
        pnl_fast: {
          summary: {
            tokens: [
              {
                token_symbol: 'SOLD',
                token_address: 'sold123',
                total_buy_usd: 1000,
                total_buy_amount: 1000000,
                total_sell_usd: 1200,
                total_sell_amount: 1000000,
                holding_amount: 0,
                num_swaps: 2
              }
            ]
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      const positions = calculator.calculateCurrentPositions(walletData, priceData);
      
      expect(positions).toHaveLength(0);
    });
  });

  describe('calculateMetrics30d', () => {
    it('should calculate 30d metrics correctly', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'test123',
        pnl_fast: {
          summary: {
            tokens: [
              {
                token_symbol: 'WIN1',
                token_address: 'win1',
                total_buy_usd: 1000,
                total_buy_amount: 1000000,
                total_sell_usd: 1200,
                total_sell_amount: 1000000,
                pnl_usd: 200,
                hold_time: 1440, // 24h
                num_swaps: 1,
                last_trade: new Date().toISOString()
              },
              {
                token_symbol: 'LOSS1',
                token_address: 'loss1',
                total_buy_usd: 500,
                total_buy_amount: 500000,
                total_sell_usd: 400,
                total_sell_amount: 500000,
                pnl_usd: -100,
                hold_time: 30, // 30min scalp
                num_swaps: 1,
                last_trade: new Date().toISOString()
              },
              {
                token_symbol: 'WIN2',
                token_address: 'win2',
                total_buy_usd: 2000,
                total_buy_amount: 2000000,
                total_sell_usd: 2400,
                total_sell_amount: 2000000,
                pnl_usd: 400,
                hold_time: 720, // 12h
                num_swaps: 1,
                last_trade: new Date().toISOString()
              }
            ]
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      
      const metrics = calculator.calculateMetrics30d(walletData, priceData);
      
      expect(metrics.wallet_address).toBe('test123');
      expect(metrics.trades_30d).toBe(3);
      expect(metrics.pnl_30d).toBe(500); // 200 - 100 + 400
      expect(metrics.winrate_30d).toBe(2/3); // 2 wins out of 3
      expect(metrics.gross_profit_30d).toBe(600); // 200 + 400
      expect(metrics.gross_loss_abs_30d).toBe(100); // abs(-100)
      expect(metrics.profit_factor_30d).toBe(6); // 600 / 100
      expect(metrics.scalp_ratio_30d).toBe(100/3); // 1 trade < 30min out of 3
      expect(metrics.median_hold_min_30d).toBe(720); // Middle value: 30, 720, 1440
      
      // Expectancy = (winrate * avg_win) - ((1-winrate) * avg_loss)
      // = (2/3 * 300) - (1/3 * 100) = 200 - 33.33 = 166.67
      expect(metrics.expectancy_usd_30d).toBeCloseTo(166.67, 1);
      
      expect(metrics.copy_trading_score).toBeGreaterThan(0);
    });

    it('should return empty metrics for wallet with no recent trades', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'test123',
        pnl_fast: {
          summary: {
            tokens: []
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      const metrics = calculator.calculateMetrics30d(walletData, priceData);
      
      expect(metrics.wallet_address).toBe('test123');
      expect(metrics.trades_30d).toBe(0);
      expect(metrics.pnl_30d).toBe(0);
      expect(metrics.winrate_30d).toBe(0);
      expect(metrics.copy_trading_score).toBe(0);
    });
  });

  describe('copy trading score calculation', () => {
    it('should calculate high score for good metrics', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'good_trader',
        pnl_fast: {
          summary: {
            tokens: Array.from({ length: 10 }, (_, i) => ({
              token_symbol: `TOKEN${i}`,
              token_address: `addr${i}`,
              total_buy_usd: 1000,
              total_buy_amount: 1000000,
              total_sell_usd: 1200,
              total_sell_amount: 1000000,
              pnl_usd: 200, // All profitable
              hold_time: 1440,
              num_swaps: 1,
              last_trade: new Date().toISOString()
            }))
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      const metrics = calculator.calculateMetrics30d(walletData, priceData);
      
      // Should have high score: 100% winrate, good profit factor, positive expectancy
      expect(metrics.copy_trading_score).toBeGreaterThan(70);
      expect(metrics.winrate_30d).toBe(1.0);
      expect(metrics.profit_factor_30d).toBe(0); // No losses
      expect(metrics.expectancy_usd_30d).toBe(200); // All wins, avg 200
    });

    it('should calculate low score for poor metrics', () => {
      const walletData: WalletPnLData = {
        wallet_address: 'bad_trader',
        pnl_fast: {
          summary: {
            tokens: Array.from({ length: 10 }, (_, i) => ({
              token_symbol: `TOKEN${i}`,
              token_address: `addr${i}`,
              total_buy_usd: 1000,
              total_buy_amount: 1000000,
              total_sell_usd: 800,
              total_sell_amount: 1000000,
              pnl_usd: -200, // All losses
              hold_time: 1440,
              num_swaps: 1,
              last_trade: new Date().toISOString()
            }))
          }
        }
      };

      const priceData = new Map<string, TokenPrice>();
      const metrics = calculator.calculateMetrics30d(walletData, priceData);
      
      // Should have low score: 0% winrate, no profit factor, negative expectancy
      expect(metrics.copy_trading_score).toBeLessThan(30);
      expect(metrics.winrate_30d).toBe(0);
      expect(metrics.profit_factor_30d).toBe(0); // No profits
      expect(metrics.expectancy_usd_30d).toBe(-200); // All losses, avg -200
    });
  });
});
