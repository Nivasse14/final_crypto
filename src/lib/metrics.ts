import { TokenPrice } from './prices.js';

// Types pour les données d'entrée (structure JSON réelle)
export interface TokenTradeData {
  token_symbol: string;
  token_address?: string;
  mint?: string;
  total_buy_usd: number;
  total_buy_amount: number;
  total_sell_usd: number;
  total_sell_amount: number;
  holding_amount?: number;
  hold_time?: number; // en minutes
  num_swaps: number;
  first_trade?: string;
  last_trade?: string;
  is_honeypot?: boolean;
  pnl_usd?: number;
  pnl_percentage?: number;
}

export interface WalletPnLData {
  wallet_address: string;
  pnl_fast: {
    summary: {
      tokens: TokenTradeData[];
    };
  };
}

// Types pour les métriques calculées
export interface WalletPosition {
  wallet_address: string;
  token_address: string;
  token_symbol: string;
  token_name?: string;
  net_position: number;
  avg_cost_per_unit: number;
  price_now_usd: number;
  holding_amount: number;
  holding_amount_usd: number;
  unrealized_pnl_usd: number;
  unrealized_roi_pct: number;
  last_price_source: string;
}

export interface WalletMetrics30d {
  wallet_address: string;
  pnl_30d: number;
  roi_pct_30d: number;
  winrate_30d: number;
  trades_30d: number;
  gross_profit_30d: number;
  gross_loss_abs_30d: number;
  profit_factor_30d: number;
  expectancy_usd_30d: number;
  drawdown_max_usd_30d: number;
  median_hold_min_30d: number;
  scalp_ratio_30d: number;
  liquidity_median_usd_30d: number;
  recency_score_30d: number;
  // Cap exposure percentages
  cap_exposure_nano_pct_30d: number;
  cap_exposure_micro_pct_30d: number;
  cap_exposure_low_pct_30d: number;
  cap_exposure_mid_pct_30d: number;
  cap_exposure_large_pct_30d: number;
  cap_exposure_mega_pct_30d: number;
  copy_trading_score: number;
}

export interface DailyMetrics {
  wallet_address: string;
  day: string;
  trades: number;
  pnl_usd: number;
  roi_pct: number;
  wins: number;
  losses: number;
  avg_hold_min: number;
  median_hold_min: number;
  gross_profit_usd: number;
  gross_loss_abs_usd: number;
  profit_factor: number;
  expectancy_usd: number;
  drawdown_usd: number;
  liquidity_median_usd: number;
  cap_bucket_breakdown: {
    nano: number;
    micro: number;
    low: number;
    mid: number;
    large: number;
    mega: number;
  };
}

export class MetricsCalculator {
  
  /**
   * Calculer les positions actuelles à partir des données de trading
   */
  calculateCurrentPositions(
    walletData: WalletPnLData,
    priceData: Map<string, TokenPrice>
  ): WalletPosition[] {
    const positions: WalletPosition[] = [];
    
    for (const token of walletData.pnl_fast.summary.tokens) {
      // Déterminer l'adresse du token
      const tokenAddress = token.token_address || token.mint;
      if (!tokenAddress) {
        console.warn(`No token address found for ${token.token_symbol}`);
        continue;
      }

      // Calculer la position nette
      const netPosition = token.holding_amount || 
        (token.total_buy_amount - token.total_sell_amount);

      // Skip si position fermée
      if (netPosition <= 0) continue;

      // Calculer le coût moyen par unité
      const avgCostPerUnit = token.total_buy_amount > 0 ? 
        token.total_buy_usd / token.total_buy_amount : 0;

      // Obtenir le prix actuel
      const priceInfo = priceData.get(tokenAddress);
      const priceNowUsd = priceInfo?.price_usd || 0;

      // Calculer les valeurs
      const holdingAmountUsd = netPosition * priceNowUsd;
      const unrealizedPnlUsd = netPosition * (priceNowUsd - avgCostPerUnit);
      const unrealizedRoiPct = avgCostPerUnit > 0 ? 
        ((priceNowUsd / avgCostPerUnit) - 1) * 100 : 0;

      const position: WalletPosition = {
        wallet_address: walletData.wallet_address,
        token_address: tokenAddress,
        token_symbol: token.token_symbol,
        token_name: token.token_symbol, // Placeholder
        net_position: netPosition,
        avg_cost_per_unit: avgCostPerUnit,
        price_now_usd: priceNowUsd,
        holding_amount: netPosition,
        holding_amount_usd: holdingAmountUsd,
        unrealized_pnl_usd: unrealizedPnlUsd,
        unrealized_roi_pct: unrealizedRoiPct,
        last_price_source: priceInfo?.source || 'none'
      };

      positions.push(position);
    }

    return positions;
  }

  /**
   * Calculer les métriques 30 jours
   */
  calculateMetrics30d(
    walletData: WalletPnLData,
    priceData: Map<string, TokenPrice>
  ): WalletMetrics30d {
    const tokens = walletData.pnl_fast.summary.tokens;
    
    // Filtrer les trades des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTokens = tokens.filter(token => {
      if (!token.last_trade) return true; // Inclure si pas de date
      const lastTradeDate = new Date(token.last_trade);
      return lastTradeDate >= thirtyDaysAgo;
    });

    if (recentTokens.length === 0) {
      return this.getEmptyMetrics30d(walletData.wallet_address);
    }

    // Métriques de base
    const trades30d = recentTokens.length;
    const pnlValues = recentTokens.map(t => t.pnl_usd || 0);
    const pnl30d = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
    
    // Win/Loss analysis
    const winningTrades = pnlValues.filter(pnl => pnl > 0);
    const losingTrades = pnlValues.filter(pnl => pnl < 0);
    const winrate30d = trades30d > 0 ? winningTrades.length / trades30d : 0;
    
    // Gross P&L
    const grossProfit30d = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
    const grossLossAbs30d = Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0));
    
    // Profit Factor
    const profitFactor30d = grossLossAbs30d > 0 ? grossProfit30d / grossLossAbs30d : 0;
    
    // Expectancy
    const avgWin = winningTrades.length > 0 ? 
      grossProfit30d / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      grossLossAbs30d / losingTrades.length : 0;
    const expectancyUsd30d = (winrate30d * avgWin) - ((1 - winrate30d) * avgLoss);
    
    // Hold times
    const holdTimes = recentTokens
      .map(t => t.hold_time || 0)
      .filter(time => time > 0)
      .sort((a, b) => a - b);
    
    const medianHoldMin30d = holdTimes.length > 0 ? 
      holdTimes[Math.floor(holdTimes.length / 2)] : 0;
    
    // Scalp ratio (trades < 30 min)
    const scalpTrades = holdTimes.filter(time => time < 30).length;
    const scalpRatio30d = holdTimes.length > 0 ? 
      (scalpTrades / holdTimes.length) * 100 : 0;

    // Drawdown calculation (simplified)
    let maxDrawdown = 0;
    let runningPnl = 0;
    let peak = 0;
    
    for (const pnl of pnlValues) {
      runningPnl += pnl;
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Cap exposure (utilise les données de prix pour market cap)
    const capExposure = this.calculateCapExposure(recentTokens, priceData);
    
    // Liquidité médiane
    const liquidityValues = recentTokens
      .map(token => {
        const tokenAddress = token.token_address || token.mint;
        return tokenAddress ? priceData.get(tokenAddress)?.liquidity_usd || 0 : 0;
      })
      .filter(liq => liq > 0)
      .sort((a, b) => a - b);
    
    const liquidityMedianUsd30d = liquidityValues.length > 0 ?
      liquidityValues[Math.floor(liquidityValues.length / 2)] : 0;

    // Recency score (EMA des PnL journaliers - simplifié)
    const recencyScore30d = this.calculateRecencyScore(recentTokens);

    // ROI calculation
    const totalInvested = recentTokens.reduce((sum, t) => sum + t.total_buy_usd, 0);
    const roiPct30d = totalInvested > 0 ? (pnl30d / totalInvested) * 100 : 0;

    // Copy trading score
    const copyTradingScore = this.calculateCopyTradingScore({
      profitFactor30d,
      expectancyUsd30d,
      winrate30d,
      drawdownMaxUsd30d: maxDrawdown,
      recencyScore30d
    });

    return {
      wallet_address: walletData.wallet_address,
      pnl_30d: pnl30d,
      roi_pct_30d: roiPct30d,
      winrate_30d: winrate30d,
      trades_30d: trades30d,
      gross_profit_30d: grossProfit30d,
      gross_loss_abs_30d: grossLossAbs30d,
      profit_factor_30d: profitFactor30d,
      expectancy_usd_30d: expectancyUsd30d,
      drawdown_max_usd_30d: maxDrawdown,
      median_hold_min_30d: Math.round(medianHoldMin30d),
      scalp_ratio_30d: scalpRatio30d,
      liquidity_median_usd_30d: liquidityMedianUsd30d,
      recency_score_30d: recencyScore30d,
      ...capExposure,
      copy_trading_score: copyTradingScore
    };
  }

  /**
   * Calculer l'exposition par market cap
   */
  private calculateCapExposure(
    tokens: TokenTradeData[],
    priceData: Map<string, TokenPrice>
  ) {
    const buckets = {
      nano: 0,    // < 1M
      micro: 0,   // 1M - 10M
      low: 0,     // 10M - 100M
      mid: 0,     // 100M - 1B
      large: 0,   // 1B - 10B
      mega: 0     // > 10B
    };

    let totalTrades = 0;

    for (const token of tokens) {
      const tokenAddress = token.token_address || token.mint;
      if (!tokenAddress) continue;

      const priceInfo = priceData.get(tokenAddress);
      const marketCap = priceInfo?.market_cap || priceInfo?.fdv || 0;

      totalTrades++;

      if (marketCap === 0) {
        buckets.nano++; // Default si pas de market cap
      } else if (marketCap < 1_000_000) {
        buckets.nano++;
      } else if (marketCap < 10_000_000) {
        buckets.micro++;
      } else if (marketCap < 100_000_000) {
        buckets.low++;
      } else if (marketCap < 1_000_000_000) {
        buckets.mid++;
      } else if (marketCap < 10_000_000_000) {
        buckets.large++;
      } else {
        buckets.mega++;
      }
    }

    // Convertir en pourcentages
    const total = totalTrades || 1;
    return {
      cap_exposure_nano_pct_30d: (buckets.nano / total) * 100,
      cap_exposure_micro_pct_30d: (buckets.micro / total) * 100,
      cap_exposure_low_pct_30d: (buckets.low / total) * 100,
      cap_exposure_mid_pct_30d: (buckets.mid / total) * 100,
      cap_exposure_large_pct_30d: (buckets.large / total) * 100,
      cap_exposure_mega_pct_30d: (buckets.mega / total) * 100
    };
  }

  /**
   * Calculer le score de récence (EMA des PnL)
   */
  private calculateRecencyScore(tokens: TokenTradeData[]): number {
    if (tokens.length === 0) return 0;

    // Trier par date de dernier trade
    const sortedTokens = tokens
      .filter(t => t.last_trade)
      .sort((a, b) => new Date(a.last_trade!).getTime() - new Date(b.last_trade!).getTime());

    if (sortedTokens.length === 0) return 0;

    // Calcul EMA simplifié (alpha = 0.1)
    const alpha = 0.1;
    let ema = sortedTokens[0].pnl_usd || 0;

    for (let i = 1; i < sortedTokens.length; i++) {
      const pnl = sortedTokens[i].pnl_usd || 0;
      ema = alpha * pnl + (1 - alpha) * ema;
    }

    // Normaliser le score entre 0 et 1
    return Math.max(0, Math.min(1, (ema + 1000) / 2000)); // Adjustable
  }

  /**
   * Calculer le score de copy trading composite (0-100)
   */
  private calculateCopyTradingScore(params: {
    profitFactor30d: number;
    expectancyUsd30d: number;
    winrate30d: number;
    drawdownMaxUsd30d: number;
    recencyScore30d: number;
  }): number {
    const { profitFactor30d, expectancyUsd30d, winrate30d, drawdownMaxUsd30d, recencyScore30d } = params;

    // Composants du score (0-1 chacun)
    
    // 30% - Profit Factor (clamp 0-3)
    const pfScore = Math.max(0, Math.min(1, profitFactor30d / 3));
    
    // 25% - Expectancy (winsorisé entre -500 et +500)
    const expectancyNorm = Math.max(-500, Math.min(500, expectancyUsd30d));
    const expectancyScore = (expectancyNorm + 500) / 1000;
    
    // 20% - Winrate (clamp 40-90%)
    const winrateNorm = Math.max(0.4, Math.min(0.9, winrate30d));
    const winrateScore = (winrateNorm - 0.4) / 0.5;
    
    // 10% - Drawdown (inverse, pénalise les gros drawdowns)
    const drawdownScore = Math.max(0, 1 - (drawdownMaxUsd30d / 5000)); // 5000 USD = score 0
    
    // 10% - Recency (déjà normalisé 0-1)
    const recencyScore = recencyScore30d;
    
    // 5% - Bonus/malus (placeholder pour honeypot rate)
    const bonusScore = 1; // Peut être ajusté plus tard

    // Score final
    const finalScore = (
      pfScore * 0.30 +
      expectancyScore * 0.25 +
      winrateScore * 0.20 +
      drawdownScore * 0.10 +
      recencyScore * 0.10 +
      bonusScore * 0.05
    ) * 100;

    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  /**
   * Métriques vides par défaut
   */
  private getEmptyMetrics30d(walletAddress: string): WalletMetrics30d {
    return {
      wallet_address: walletAddress,
      pnl_30d: 0,
      roi_pct_30d: 0,
      winrate_30d: 0,
      trades_30d: 0,
      gross_profit_30d: 0,
      gross_loss_abs_30d: 0,
      profit_factor_30d: 0,
      expectancy_usd_30d: 0,
      drawdown_max_usd_30d: 0,
      median_hold_min_30d: 0,
      scalp_ratio_30d: 0,
      liquidity_median_usd_30d: 0,
      recency_score_30d: 0,
      cap_exposure_nano_pct_30d: 0,
      cap_exposure_micro_pct_30d: 0,
      cap_exposure_low_pct_30d: 0,
      cap_exposure_mid_pct_30d: 0,
      cap_exposure_large_pct_30d: 0,
      cap_exposure_mega_pct_30d: 0,
      copy_trading_score: 0
    };
  }
}
