// api-gmgn.js
// Service API pour récupérer et traiter les données complètes avec mapping correct vers le schéma extended

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration avec timeout étendu
const config = {
    api: {
        baseUrl: 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api',
        timeout: 300000, // 5 minutes pour les requêtes complexes
        retries: 3
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
    },
    processing: {
        batchSize: 50,
        maxConcurrent: 5
    }
};

class GMGNApiService {
    constructor() {
        this.supabase = createClient(config.supabase.url, config.supabase.key);
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            errors: []
        };
    }

    // Fonction pour traiter les valeurs numériques de manière sécurisée
    safeNumber(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        // Convertir en string pour traiter
        let str = String(value);
        
        // Nettoyer les caractères non numériques sauf point et virgule
        str = str.replace(/[^0-9.-]/g, '');
        
        // Si la chaîne contient plusieurs points (concaténation), prendre la première partie
        const parts = str.split('.');
        if (parts.length > 2) {
            // Cas de concaténation comme "10000000004122.909079464710.61011149570.0"
            // Prendre seulement la première partie décimale
            str = parts[0] + '.' + parts[1];
        }
        
        const parsed = parseFloat(str);
        
        // Vérifier si le résultat est un nombre valide
        if (isNaN(parsed) || !isFinite(parsed)) {
            return null;
        }
        
        return parsed;
    }

    // Fonction spécifique pour les timestamps (BIGINT)
    safeTimestamp(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        // Convertir en string et nettoyer
        let str = String(value).replace(/[^0-9.-]/g, '');
        
        // Gérer les concaténations
        const parts = str.split('.');
        if (parts.length > 2) {
            str = parts[0] + '.' + parts[1];
        }
        
        const parsed = parseFloat(str);
        
        if (isNaN(parsed) || !isFinite(parsed)) {
            return null;
        }
        
        // Arrondir pour avoir un entier (timestamp en millisecondes)
        return Math.round(parsed);
    }

    async fetchCompleteWalletData(walletAddress) {
        console.log(`🔍 Récupération complète pour ${walletAddress}...`);
        
        for (let attempt = 1; attempt <= config.api.retries; attempt++) {
            try {
                const startTime = Date.now();
                
                // Déterminer si on utilise Supabase Edge Functions ou l'API locale
                const isSupabase = config.api.baseUrl.includes('supabase.co');
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                };
                
                // Ajouter l'autorisation si c'est Supabase
                if (isSupabase) {
                    headers['Authorization'] = `Bearer ${config.supabase.key}`;
                }
                
                const response = await axios.get(
                    `${config.api.baseUrl}/complete/${walletAddress}`,
                    {
                        timeout: config.api.timeout,
                        headers
                    }
                );

                const duration = Date.now() - startTime;
                console.log(`✅ Données récupérées en ${duration}ms (tentative ${attempt}) via ${isSupabase ? 'Supabase' : 'Local'}`);

                if (!response.data || !response.data.data) {
                    throw new Error('Structure de données API invalide');
                }

                return response.data.data;
                
            } catch (error) {
                console.log(`❌ Tentative ${attempt}/${config.api.retries} échouée: ${error.message}`);
                
                if (attempt === config.api.retries) {
                    throw error;
                }
                
                // Attendre avant de réessayer
                await this.delay(attempt * 2000);
            }
        }
    }

    async processWalletComplete(walletAddress) {
        console.log(`\n🚀 TRAITEMENT COMPLET: ${walletAddress}`);
        const startTime = Date.now();
        
        try {
            // Marquer comme en cours de traitement
            await this.updateWalletRegistry(walletAddress, null, 'processing');
            
            // 1. Récupérer les données via l'API
            const apiData = await this.fetchCompleteWalletData(walletAddress);
            
            // 2. Extraire et mapper les données wallet
            const walletData = this.extractWalletMetrics(apiData, walletAddress);
            
            // 3. Extraire et mapper les données tokens
            const tokensData = this.extractTokensData(apiData, walletAddress);
            
            // 4. Sauvegarder dans la base de données
            await this.saveToDatabase(walletData, tokensData, apiData);
            
            // 5. Mettre à jour la registry avec les résultats
            await this.updateWalletRegistry(walletAddress, walletData, 'completed');
            
            const duration = Date.now() - startTime;
            console.log(`✅ SUCCÈS en ${duration}ms`);
            console.log(`   💰 Valeur: $${walletData.total_value_usd?.toLocaleString() || '0'}`);
            console.log(`   🪙 Tokens: ${tokensData.length}`);
            console.log(`   📊 Score: ${walletData.performance_score?.toFixed(1) || '0'}`);
            
            this.stats.successful++;
            return { success: true, walletData, tokensCount: tokensData.length };
            
        } catch (error) {
            // Marquer comme échoué dans la registry
            await this.updateWalletRegistry(walletAddress, null, 'failed', error.message);
            
            console.log(`❌ ÉCHEC: ${error.message}`);
            this.stats.failed++;
            this.stats.errors.push({ wallet: walletAddress, error: error.message });
            return { success: false, error: error.message };
        } finally {
            this.stats.processed++;
        }
    }

    extractWalletMetrics(apiData, walletAddress) {
        console.log('📊 Extraction des métriques wallet...');
        
        const portfolio = apiData.portfolio?.data?.portfolio || [];
        const pnlData = apiData.pnl?.data || [];
        const summary = apiData.summary || {};
        const stats = apiData.stats?.data || {};
        const enrichment = summary.geckoterminal_enrichment || {};
        
        // === CALCULS DE BASE ===
        const totalValue = portfolio.reduce((sum, token) => sum + this.safeNumber(token.total_usd_value), 0);
        const tokenCount = portfolio.length;
        const activeTokens = portfolio.filter(t => this.safeNumber(t.total_usd_value) > 0.01);
        
        // === MÉTRIQUES PNL ===
        const pnlArray = Array.isArray(pnlData) ? pnlData : (pnlData?.data || []);
        const totalPnl = pnlArray.reduce((sum, trade) => sum + this.safeNumber(trade.pnl), 0);
        const winningTrades = pnlArray.filter(t => this.safeNumber(t.pnl) > 0);
        const losingTrades = pnlArray.filter(t => this.safeNumber(t.pnl) <= 0);
        const winRate = pnlArray.length > 0 ? (winningTrades.length / pnlArray.length) * 100 : 0;
        
        // === MÉTRIQUES DE VALEUR ===
        const tokenValues = portfolio.map(t => this.safeNumber(t.total_usd_value)).sort((a, b) => b - a);
        const nonZeroValues = tokenValues.filter(v => v > 0);
        const avgTokenValue = nonZeroValues.length > 0 ? nonZeroValues.reduce((sum, val) => sum + val, 0) / nonZeroValues.length : 0;
        const maxTokenValue = Math.max(...tokenValues, 0);
        const minTokenValue = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
        const medianTokenValue = this.calculateMedian(nonZeroValues);
        
        // === MÉTRIQUES DE CONCENTRATION ===
        const top5Value = tokenValues.slice(0, 5).reduce((sum, val) => sum + val, 0);
        const top10Value = tokenValues.slice(0, 10).reduce((sum, val) => sum + val, 0);
        const top5Concentration = totalValue > 0 ? (top5Value / totalValue) * 100 : 0;
        const top10Concentration = totalValue > 0 ? (top10Value / totalValue) * 100 : 0;
        const largestPosition = totalValue > 0 ? (maxTokenValue / totalValue) * 100 : 0;
        const diversificationScore = Math.max(0, 100 - top5Concentration);
        
        // === MÉTRIQUES DE QUALITÉ/ENRICHISSEMENT ===
        const enrichedTokens = portfolio.filter(t => t.geckoterminal_complete_data);
        const tokensWithMarketCap = portfolio.filter(t => t.geckoterminal_complete_data?.market_cap_usd);
        const tokensWithSecurity = portfolio.filter(t => t.geckoterminal_complete_data?.security_data);
        const tokensOnCoingecko = portfolio.filter(t => t.geckoterminal_complete_data?.on_coingecko);
        
        // === SCORES DE FIABILITÉ ===
        const reliabilityScores = portfolio
            .filter(t => t.geckoterminal_complete_data?.reliability_score?.total_score)
            .map(t => t.geckoterminal_complete_data.reliability_score.total_score);
        const avgReliability = reliabilityScores.length > 0 ? 
            reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length : 0;
        const medianReliability = this.calculateMedian(reliabilityScores);
        
        // === MÉTRIQUES MARKET CAP ===
        const marketCaps = portfolio
            .filter(t => t.geckoterminal_complete_data?.market_cap_usd)
            .map(t => t.geckoterminal_complete_data.market_cap_usd);
        const avgMarketCap = marketCaps.length > 0 ? 
            marketCaps.reduce((sum, cap) => sum + cap, 0) / marketCaps.length : 0;
        const medianMarketCap = this.calculateMedian(marketCaps);
        
        // === MÉTRIQUES VOLUME ===
        const volumes = portfolio
            .filter(t => t.geckoterminal_complete_data?.pool_data?.volume_24h_usd)
            .map(t => t.geckoterminal_complete_data.pool_data.volume_24h_usd);
        const avgVolume = volumes.length > 0 ? 
            volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length : 0;
        const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
        
        // === CALCULS DE SCORES ===
        const performanceScore = this.calculatePerformanceScore({
            totalValue,
            totalPnl,
            winRate,
            diversificationScore,
            avgReliability,
            tokenCount
        });
        
        const riskScore = this.calculateRiskScore({
            concentration: top5Concentration,
            avgReliability,
            tokensWithSecurity: tokensWithSecurity.length,
            totalTokens: tokenCount
        });
        
        const volatilityScore = this.calculateVolatilityScore(portfolio);
        const liquidityScore = this.calculateLiquidityScore(volumes);
        
        // === CLASSIFICATION IA ===
        const classification = this.classifyWallet({
            totalValue,
            tokenCount,
            concentration: top5Concentration,
            avgReliability,
            winRate,
            totalPnl
        });
        
        // === MAPPING VERS SCHÉMA EXTENDED ===
        const walletData = {
            wallet_address: walletAddress,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            
            // Scores
            analysis_score: performanceScore,
            performance_score: performanceScore,
            
            // Financières
            total_value_usd: totalValue,
            total_pnl: totalPnl,
            total_pnl_percentage: totalValue > 0 ? (totalPnl / totalValue) * 100 : 0,
            
            // Trading - Stats de base
            win_rate: winRate,
            total_trades: pnlArray.length,
            winning_trades: winningTrades.length,
            losing_trades: losingTrades.length,
            avg_trade_size: pnlArray.length > 0 ? totalPnl / pnlArray.length : 0,
            largest_win: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0,
            largest_loss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0,
            
            // Trading - Stats avancées depuis l'API
            api_total_tokens_traded: this.safeNumber(summary.total_tokens_traded),
            api_total_pnl_usd: this.safeNumber(summary.total_pnl_usd),
            api_winrate: this.safeNumber(summary.winrate),
            api_current_portfolio_value: this.safeNumber(summary.current_portfolio_value),
            api_current_holdings_count: this.safeNumber(summary.current_holdings_count),
            api_trading_stats_period: summary.trading_stats_period,
            
            // Stats détaillées
            average_holding_time: this.safeNumber(stats.average_holding_time),
            api_stats_total_pnl: this.safeNumber(stats.total_pnl),
            api_stats_winrate: this.safeNumber(stats.winrate),
            total_roi_percentage: this.safeNumber(stats.total_roi_percentage),
            swap_count: this.safeNumber(stats.swap_count),
            first_swap_timestamp: this.safeTimestamp(stats.first_swap_timestamp),
            last_swap_timestamp: this.safeTimestamp(stats.last_swap_timestamp),
            unique_trading_days: this.safeNumber(stats.unique_trading_days),
            consecutive_trading_days: this.safeNumber(stats.consecutive_trading_days),
            average_trades_per_token: this.safeNumber(stats.average_trades_per_token),
            
            // Métriques d'achat/vente
            average_buy_amount_usd: this.safeNumber(stats.average_buy_amount_usd),
            minimum_buy_amount_usd: this.safeNumber(stats.minimum_buy_amount_usd),
            maximum_buy_amount_usd: this.safeNumber(stats.maximum_buy_amount_usd),
            total_buy_amount_usd: this.safeNumber(stats.total_buy_amount_usd),
            total_buy_count: this.safeNumber(stats.total_buy_count),
            average_sell_amount_usd: this.safeNumber(stats.average_sell_amount_usd),
            minimum_sell_amount_usd: this.safeNumber(stats.minimum_sell_amount_usd),
            maximum_sell_amount_usd: this.safeNumber(stats.maximum_sell_amount_usd),
            total_sell_amount_usd: this.safeNumber(stats.total_sell_amount_usd),
            total_sell_count: this.safeNumber(stats.total_sell_count),
            
            // Portfolio
            token_count: tokenCount,
            active_token_count: activeTokens.length,
            avg_token_value: avgTokenValue,
            max_token_value: maxTokenValue,
            min_token_value: minTokenValue,
            median_token_value: medianTokenValue,
            
            // Concentration
            top_5_tokens_concentration_pct: top5Concentration,
            top_10_tokens_concentration_pct: top10Concentration,
            largest_position_pct: largestPosition,
            
            // Scores de risque
            diversification_score: diversificationScore,
            risk_score: riskScore,
            volatility_score: volatilityScore,
            liquidity_score: liquidityScore,
            
            // Enrichissement - Portfolio
            portfolio_enriched_tokens: this.safeNumber(enrichment.portfolio_enriched_tokens),
            portfolio_tokens_with_market_cap: this.safeNumber(enrichment.portfolio_tokens_with_market_cap),
            portfolio_tokens_with_security_data: this.safeNumber(enrichment.portfolio_tokens_with_security_data),
            portfolio_avg_reliability: this.safeNumber(enrichment.portfolio_avg_reliability),
            
            // Enrichissement - PNL
            pnl_enriched_tokens: this.safeNumber(enrichment.pnl_enriched_tokens),
            pnl_tokens_with_market_cap: this.safeNumber(enrichment.pnl_tokens_with_market_cap),
            pnl_tokens_with_security_data: this.safeNumber(enrichment.pnl_tokens_with_security_data),
            pnl_avg_reliability: this.safeNumber(enrichment.pnl_avg_reliability),
            
            // Enrichissement - Global
            total_enriched_tokens: this.safeNumber(enrichment.total_enriched_tokens),
            total_tokens_processed: this.safeNumber(enrichment.total_tokens_processed),
            enrichment_completion_status: enrichment.enrichment_completion_status,
            enriched_tokens_count: enrichedTokens.length,
            enriched_tokens_percentage: tokenCount > 0 ? (enrichedTokens.length / tokenCount) * 100 : 0,
            avg_reliability_score: avgReliability,
            median_reliability_score: medianReliability,
            tokens_with_market_cap: tokensWithMarketCap.length,
            tokens_with_security_data: tokensWithSecurity.length,
            tokens_on_coingecko_count: tokensOnCoingecko.length,
            
            // Market cap et volume
            avg_token_market_cap: avgMarketCap,
            median_token_market_cap: medianMarketCap,
            avg_token_volume_24h: avgVolume,
            total_portfolio_volume_24h: totalVolume,
            
            // Distribution ROI
            roi_above_500: this.safeNumber(stats.roi_distribution?.roi_above_500),
            roi_200_to_500: this.safeNumber(stats.roi_distribution?.roi_200_to_500),
            roi_0_to_200: this.safeNumber(stats.roi_distribution?.roi_0_to_200),
            roi_neg50_to_0: this.safeNumber(stats.roi_distribution?.roi_neg50_to_0),
            roi_below_neg50: this.safeNumber(stats.roi_distribution?.roi_below_neg50),
            
            // Classification IA
            ai_category: classification.category,
            ai_confidence: classification.confidence,
            ai_risk_level: classification.riskLevel,
            ai_experience_level: classification.experienceLevel,
            
            // Métadonnées
            data_completeness_score: this.calculateCompletenessScore(apiData),
            enrichment_status: enrichedTokens.length === tokenCount ? 'complete' : 
                             enrichedTokens.length > 0 ? 'partial' : 'pending',
            
            // Composition (pour les colonnes existantes mais pas utilisées dans ce mapping)
            wallet_age_days: stats.unique_trading_days || null,
            transaction_count: stats.swap_count || 0,
            unique_tokens_traded: summary.total_tokens_traded || tokenCount,
            top_token_symbol: portfolio.length > 0 ? portfolio[0].token_symbol : null,
            top_token_percentage: largestPosition,
            stablecoin_percentage: 0, // À calculer si nécessaire
            defi_token_percentage: 0, // À calculer si nécessaire
            meme_token_percentage: 0, // À calculer si nécessaire
            
            // Données brutes complètes
            raw_portfolio_data: apiData.portfolio,
            raw_pnl_data: apiData.pnl,
            raw_summary_data: apiData.summary,
            raw_stats_data: apiData.stats,
            raw_complete_api_response: apiData,
            
            // Top trades (JSON fields)
            top_trade_tokens: stats.top_trade_tokens || [],
            worst_trade_tokens: stats.worst_trade_tokens || [],
            most_traded_token: stats.most_traded_token || null,
            dexes_stats: stats.dexes_stats || null,
            daily_activity_heatmap: stats.daily_activity_heatmap || null,
            peak_trading_hours: stats.peak_trading_hours || []
        };
        
        console.log(`✅ Métriques extraites: $${totalValue.toLocaleString()}, ${tokenCount} tokens, score: ${performanceScore.toFixed(1)}`);
        return walletData;
    }

    extractTokensData(apiData, walletAddress) {
        console.log('🪙 Extraction des données tokens...');
        
        const portfolio = apiData.portfolio?.data?.portfolio || [];
        const pnlRawData = apiData.pnl?.data || apiData.pnl || [];
        const pnlData = Array.isArray(pnlRawData) ? pnlRawData : [];
        const tokens = [];
        
        // Créer un map des données PNL par token address pour enrichir les tokens
        const pnlByToken = {};
        pnlData.forEach(pnl => {
            const tokenAddr = pnl.token_address || pnl.address || pnl.mint;
            if (tokenAddr) {
                if (!pnlByToken[tokenAddr]) {
                    pnlByToken[tokenAddr] = [];
                }
                pnlByToken[tokenAddr].push(pnl);
            }
        });
        
        portfolio.forEach((token, index) => {
            try {
                const gt = token.geckoterminal_complete_data;
                const tokenAddr = token.token_address || token.address || token.mint;
                const pnlHistory = pnlByToken[tokenAddr] || [];
                
                // Calculer des stats PNL pour ce token
                const totalTokenPnl = pnlHistory.reduce((sum, p) => sum + this.safeNumber(p.pnl), 0);
                const tokenTradeCount = pnlHistory.length;
                const winningPnlTrades = pnlHistory.filter(p => this.safeNumber(p.pnl) > 0);
                const losingPnlTrades = pnlHistory.filter(p => this.safeNumber(p.pnl) <= 0);
                const tokenWinRate = tokenTradeCount > 0 ? (winningPnlTrades.length / tokenTradeCount) * 100 : 0;
                
                const tokenData = {
                    wallet_address: walletAddress,
                    token_address: tokenAddr,
                    
                    // Informations de base
                    token_symbol: token.token_symbol || token.symbol,
                    token_name: token.token_name || token.name,
                    token_decimals_decimal: this.safeNumber(token.token_decimals || token.decimals),
                    chain: token.chain || 'solana',
                    
                    // Données financières wallet
                    balance: this.safeNumber(token.balance),
                    balance_raw: this.safeNumber(token.balance_raw),
                    value_usd: this.safeNumber(token.total_usd_value),
                    total_usd_value: this.safeNumber(token.total_usd_value),
                    percentage_of_portfolio: this.safeNumber(token.portfolio_weight_pct),
                    portfolio_weight_pct: this.safeNumber(token.portfolio_weight_pct),
                    holding_rank: index + 1,
                    is_top_holding: this.safeNumber(token.portfolio_weight_pct) >= 5,
                    
                    // Trading / PNL - données token
                    pnl: this.safeNumber(token.pnl),
                    pnl_percentage: this.safeNumber(token.pnl_percentage),
                    unrealized_pnl: this.safeNumber(token.unrealized_pnl),
                    realized_pnl: this.safeNumber(token.realized_pnl),
                    current_price_usd: this.safeNumber(token.token_price_usd || token.price_usd),
                    price_change_24h_pct: this.safeNumber(token.price_change_24h),
                    
                    // Trading / PNL - données calculées depuis historique
                    token_total_pnl: totalTokenPnl,
                    token_trade_count: tokenTradeCount,
                    token_winning_trades: winningPnlTrades.length,
                    token_losing_trades: losingPnlTrades.length,
                    token_win_rate: tokenWinRate,
                    token_avg_pnl_per_trade: tokenTradeCount > 0 ? totalTokenPnl / tokenTradeCount : 0,
                    token_largest_win: winningPnlTrades.length > 0 ? Math.max(...winningPnlTrades.map(p => this.safeNumber(p.pnl))) : 0,
                    token_largest_loss: losingPnlTrades.length > 0 ? Math.min(...losingPnlTrades.map(p => this.safeNumber(p.pnl))) : 0,
                    
                    // Supply
                    circulating_supply: this.safeNumber(token.circulating_supply),
                    total_supply: this.safeNumber(token.total_supply || token.supply),
                    max_supply: this.safeNumber(token.max_supply),
                    supply_owned: this.safeNumber(token.supply_owned),
                    
                    // Geckoterminal - Base
                    geckoterminal_enriched: !!gt,
                    gt_enriched: !!gt,
                    gt_name: gt?.name,
                    gt_symbol: gt?.symbol,
                    gt_decimals_decimal: this.safeNumber(gt?.decimals),
                    gt_address: gt?.address,
                    gt_on_coingecko: gt?.on_coingecko || false,
                    
                    // Geckoterminal - Prix
                    gt_price_usd: this.safeNumber(gt?.pool_data?.price_usd || gt?.pool_data?.price_in_usd),
                    gt_price_change_1h: this.safeNumber(gt?.pool_data?.price_change_1h),
                    gt_price_change_24h: this.safeNumber(gt?.pool_data?.price_change_24h),
                    gt_price_change_7d: this.safeNumber(gt?.pool_data?.price_change_7d),
                    
                    // Geckoterminal - Volume
                    gt_volume_24h_usd: this.safeNumber(gt?.pool_data?.volume_24h_usd),
                    gt_volume_change_24h: this.safeNumber(gt?.pool_data?.volume_24h_change),
                    
                    // Geckoterminal - Market Cap
                    market_cap_usd: this.safeNumber(gt?.market_cap_usd),
                    calculated_market_cap_usd: this.safeNumber(gt?.calculated_market_cap_usd),
                    original_market_cap_usd: this.safeNumber(gt?.original_market_cap_usd),
                    gt_market_cap_usd: this.safeNumber(gt?.market_cap_usd),
                    gt_calculated_market_cap_usd: this.safeNumber(gt?.calculated_market_cap_usd),
                    gt_original_market_cap_usd: this.safeNumber(gt?.original_market_cap_usd),
                    gt_circulating_supply: this.safeNumber(gt?.circulating_supply),
                    gt_total_supply: this.safeNumber(gt?.total_supply),
                    gt_max_supply: this.safeNumber(gt?.max_supply),
                    
                    // Geckoterminal - Liquidité
                    gt_liquidity_usd: this.safeNumber(gt?.pool_data?.liquidity_usd),
                    gt_pool_liquidity_usd: this.safeNumber(gt?.pool_data?.liquidity_usd),
                    
                    // Geckoterminal - Scores - FORCER EN INTEGER  
                    gt_score: Math.round(this.safeNumber(gt?.pool_data?.gt_score) || 0),
                    gt_pool_score: Math.round(this.safeNumber(gt?.pool_data?.gt_score) || 0),
                    gt_security_score: Math.round(this.safeNumber(gt?.security_data?.security_score) || 0),
                    gt_reliability_score: Math.round(this.safeNumber(gt?.reliability_score?.total_score) || 0),
                    
                    // Geckoterminal - Pool data détaillé
                    gt_pool_price_usd: this.safeNumber(gt?.pool_data?.price_usd),
                    gt_pool_volume_24h_usd: this.safeNumber(gt?.pool_data?.volume_24h_usd),
                    gt_pool_fdv: this.safeNumber(gt?.pool_data?.fdv),
                    gt_pool_price_change_percentage_24h: this.safeNumber(gt?.pool_data?.price_change_percentage_24h),
                    
                    // Geckoterminal - Security
                    holder_count: gt?.security_data?.holder_count,
                    gt_security_holder_count: gt?.security_data?.holder_count,
                    gt_security_mintable: gt?.security_data?.soul_scanner_data?.mintable === '1',
                    gt_security_freezeable: gt?.security_data?.soul_scanner_data?.freezeable === '1',
                    gt_security_top_10_holder_percent: this.safeNumber(gt?.security_data?.top_10_holder_percent),
                    gt_security_top_10_user_balance: this.safeNumber(gt?.security_data?.top_10_user_balance),
                    gt_security_locked_percent: this.safeNumber(gt?.security_data?.locked_percent),
                    
                    // GoPlus security
                    gt_goplus_honeypot_risk: gt?.security_data?.go_plus_data?.honeypot_risk,
                    gt_goplus_transfer_pausable: gt?.security_data?.go_plus_data?.transfer_pausable,
                    gt_goplus_is_blacklisted: gt?.security_data?.go_plus_data?.is_blacklisted,
                    gt_goplus_is_whitelisted: gt?.security_data?.go_plus_data?.is_whitelisted,
                    gt_goplus_buy_tax: this.safeNumber(gt?.security_data?.go_plus_data?.buy_tax),
                    gt_goplus_sell_tax: this.safeNumber(gt?.security_data?.go_plus_data?.sell_tax),
                    
                    // Reliability scores détaillés - FORCER EN INTEGER pour éviter l'erreur
                    gt_reliability_total_score: Math.round(this.safeNumber(gt?.reliability_score?.total_score) || 0),
                    gt_reliability_pool_score: Math.round(this.safeNumber(gt?.reliability_score?.factors?.pool_score) || 0),
                    gt_reliability_security_score: Math.round(this.safeNumber(gt?.reliability_score?.factors?.security_score) || 0),
                    gt_reliability_fundamentals_score: Math.round(this.safeNumber(gt?.reliability_score?.factors?.fundamentals_score) || 0),
                    gt_reliability_community_score: Math.round(this.safeNumber(gt?.reliability_score?.factors?.community_score) || 0),
                    
                    // Classification
                    is_stablecoin: this.isStablecoin(token.token_symbol),
                    is_defi_token: false, // À implémenter selon vos critères
                    is_meme_token: false, // À implémenter selon vos critères
                    is_nft_related: false, // À implémenter selon vos critères
                    risk_level: this.calculateTokenRiskLevel(gt),
                    
                    // Enrichissement status
                    goplus_enriched: !!(gt?.security_data?.go_plus_data),
                    soul_scanner_enriched: !!(gt?.security_data?.soul_scanner_data),
                    last_enriched: new Date().toISOString(),
                    enrichment_version: 1,
                    
                    // Données brutes
                    geckoterminal_raw_data: gt,
                    raw_token_data: token,
                    raw_pnl_history: pnlHistory, // Historique PNL complet pour ce token
                    
                    // Métadonnées
                    data_source: 'complete',
                    last_updated_api: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                tokens.push(tokenData);
                
            } catch (error) {
                console.log(`❌ Erreur extraction token ${index}: ${error.message}`);
            }
        });
        
        console.log(`✅ ${tokens.length} tokens extraits avec mapping complet`);
        return tokens;
    }

    extractPnlEntries(apiData, walletAddress) {
        console.log('💰 Extraction des entrées PNL individuelles...');
        
        const pnlRawData = apiData.pnl?.data || apiData.pnl || [];
        const pnlData = Array.isArray(pnlRawData) ? pnlRawData : [];
        const pnlEntries = [];
        
        pnlData.forEach((pnl, index) => {
            try {
                const gt = pnl.geckoterminal_complete_data;
                
                const pnlEntry = {
                    wallet_address: walletAddress,
                    token_address: pnl.token_address || pnl.address || pnl.mint,
                    
                    // Identifiants de trade
                    trade_id: pnl.trade_id || `${walletAddress}-${index}`,
                    transaction_id: pnl.transaction_id || pnl.tx_id,
                    
                    // Informations token
                    token_symbol: pnl.token_symbol || pnl.symbol,
                    token_name: pnl.token_name || pnl.name,
                    chain: pnl.chain || 'solana',
                    
                    // Données financières
                    pnl: this.safeNumber(pnl.pnl),
                    pnl_percentage: this.safeNumber(pnl.pnl_percentage),
                    roi: this.safeNumber(pnl.roi),
                    
                    // Trading details
                    buy_amount: this.safeNumber(pnl.buy_amount),
                    sell_amount: this.safeNumber(pnl.sell_amount),
                    buy_price: this.safeNumber(pnl.buy_price),
                    sell_price: this.safeNumber(pnl.sell_price),
                    buy_amount_usd: this.safeNumber(pnl.buy_amount_usd),
                    sell_amount_usd: this.safeNumber(pnl.sell_amount_usd),
                    
                    // Timestamps
                    buy_timestamp: pnl.buy_timestamp ? new Date(pnl.buy_timestamp * 1000).toISOString() : null,
                    sell_timestamp: pnl.sell_timestamp ? new Date(pnl.sell_timestamp * 1000).toISOString() : null,
                    buy_date: pnl.buy_date,
                    sell_date: pnl.sell_date,
                    
                    // Holding period
                    holding_time_seconds: this.safeNumber(pnl.holding_time),
                    holding_time_days: this.safeNumber(pnl.holding_time) ? this.safeNumber(pnl.holding_time) / 86400 : null,
                    
                    // DEX info
                    buy_dex: pnl.buy_dex,
                    sell_dex: pnl.sell_dex,
                    
                    // Market conditions
                    market_cap_at_buy: this.safeNumber(pnl.market_cap_at_buy),
                    market_cap_at_sell: this.safeNumber(pnl.market_cap_at_sell),
                    volume_24h_at_buy: this.safeNumber(pnl.volume_24h_at_buy),
                    volume_24h_at_sell: this.safeNumber(pnl.volume_24h_at_sell),
                    
                    // Geckoterminal enrichment
                    geckoterminal_enriched: !!gt,
                    gt_name: gt?.name,
                    gt_symbol: gt?.symbol,
                    gt_address: gt?.address,
                    gt_on_coingecko: gt?.on_coingecko || false,
                    
                    // GT - Market data
                    gt_market_cap_usd: this.safeNumber(gt?.market_cap_usd),
                    gt_price_usd: this.safeNumber(gt?.pool_data?.price_usd),
                    gt_volume_24h_usd: this.safeNumber(gt?.pool_data?.volume_24h_usd),
                    gt_liquidity_usd: this.safeNumber(gt?.pool_data?.liquidity_usd),
                    
                    // GT - Scores
                    gt_reliability_score: this.safeNumber(gt?.reliability_score?.total_score),
                    gt_security_score: this.safeNumber(gt?.security_data?.security_score),
                    gt_pool_score: this.safeNumber(gt?.pool_data?.gt_score),
                    
                    // GT - Security
                    gt_security_holder_count: gt?.security_data?.holder_count,
                    gt_security_mintable: gt?.security_data?.soul_scanner_data?.mintable === '1',
                    gt_security_freezeable: gt?.security_data?.soul_scanner_data?.freezeable === '1',
                    gt_goplus_honeypot_risk: gt?.security_data?.go_plus_data?.honeypot_risk,
                    gt_goplus_buy_tax: this.safeNumber(gt?.security_data?.go_plus_data?.buy_tax),
                    gt_goplus_sell_tax: this.safeNumber(gt?.security_data?.go_plus_data?.sell_tax),
                    
                    // Classification
                    trade_type: this.safeNumber(pnl.pnl) > 0 ? 'win' : 'loss',
                    trade_size_category: this.categorizePnlTradeSize(pnl.buy_amount_usd),
                    risk_level: this.calculateTokenRiskLevel(gt),
                    
                    // Données brutes
                    raw_pnl_data: pnl,
                    geckoterminal_raw_data: gt,
                    
                    // Métadonnées
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    data_source: 'complete'
                };
                
                pnlEntries.push(pnlEntry);
                
            } catch (error) {
                console.log(`❌ Erreur extraction PNL ${index}: ${error.message}`);
            }
        });
        
        console.log(`✅ ${pnlEntries.length} entrées PNL extraites`);
        return pnlEntries;
    }

    async saveToDatabase(walletData, tokensData, apiData) {
        console.log(`💾 Sauvegarde en base: wallet + ${tokensData.length} tokens...`);
        
        try {
            // Calculer les portfolio weights
            const totalValue = walletData.total_value_usd || 0;
            tokensData.forEach((token, index) => {
                if (totalValue > 0) {
                    token.percentage_of_portfolio = ((token.total_usd_value || 0) / totalValue) * 100;
                    token.portfolio_weight_pct = token.percentage_of_portfolio;
                    token.is_top_holding = token.percentage_of_portfolio >= 5;
                }
                token.holding_rank = index + 1;
            });
            
            // Extraire les données PNL individuelles (seulement si apiData est fourni)
            const pnlEntries = apiData ? this.extractPnlEntries(apiData, walletData.wallet_address) : [];
            
            // Sauvegarder le wallet
            const { error: walletError } = await this.supabase
                .from('wallets_extended')
                .upsert(walletData, { onConflict: 'wallet_address' });
            
            if (walletError) {
                throw new Error(`Erreur wallet: ${walletError.message}`);
            }
            
            // Supprimer les anciens tokens
            await this.supabase
                .from('wallet_tokens_extended')
                .delete()
                .eq('wallet_address', walletData.wallet_address);
            
            // Supprimer les anciennes entrées PNL
            await this.supabase
                .from('wallet_pnl_entries')
                .delete()
                .eq('wallet_address', walletData.wallet_address);
            
            // Sauvegarder les tokens par batches
            if (tokensData.length > 0) {
                const batchSize = config.processing.batchSize;
                for (let i = 0; i < tokensData.length; i += batchSize) {
                    const batch = tokensData.slice(i, i + batchSize);
                    
                    const { error: tokensError } = await this.supabase
                        .from('wallet_tokens_extended')
                        .insert(batch);
                    
                    if (tokensError) {
                        console.log(`❌ Erreur batch tokens ${i}-${i + batchSize}: ${tokensError.message}`);
                        throw new Error(`Erreur tokens batch: ${tokensError.message}`);
                    }
                }
            }
            
            // Sauvegarder les entrées PNL par batches
            if (pnlEntries.length > 0) {
                const batchSize = config.processing.batchSize;
                for (let i = 0; i < pnlEntries.length; i += batchSize) {
                    const batch = pnlEntries.slice(i, i + batchSize);
                    const { error: pnlError } = await this.supabase
                        .from('wallet_pnl_entries')
                        .insert(batch);
                    
                    if (pnlError) {
                        console.log(`❌ Erreur batch PNL ${i}-${i + batchSize}: ${pnlError.message}`);
                        throw new Error(`Erreur PNL batch: ${pnlError.message}`);
                    }
                }
            }
            
            console.log(`✅ Sauvegarde réussie: wallet + ${tokensData.length} tokens + ${pnlEntries.length} entrées PNL`);
            
        } catch (error) {
            console.log(`❌ Erreur sauvegarde: ${error.message}`);
            throw error;
        }
    }

    async updateWalletRegistry(walletAddress, walletData, status = 'completed', error = null) {
        console.log(`📋 Mise à jour registry pour ${walletAddress}...`);
        
        try {
            const updateData = {
                wallet_address: walletAddress,
                status: status,
                last_processed_at: new Date().toISOString(),
                processing_attempts: 1, // Incrémenté via SQL
                last_error: error
            };
            
            // Si le traitement a réussi, ajouter les métriques enrichies
            if (status === 'completed' && walletData) {
                updateData.enriched_analysis_score = walletData.analysis_score;
                updateData.enriched_total_value_usd = walletData.total_value_usd;
                updateData.enriched_total_tokens = walletData.total_tokens;
                updateData.enriched_winrate = walletData.win_rate;
                updateData.enriched_total_pnl_usd = walletData.total_pnl;
                updateData.enriched_ai_category = walletData.ai_category;
                updateData.enriched_ai_risk_level = walletData.ai_risk_level;
                updateData.enriched_data_completeness_score = walletData.data_completeness_score;
            }
            
            // Utiliser upsert pour créer ou mettre à jour
            const { error: registryError } = await this.supabase
                .from('wallet_registry')
                .upsert(updateData, { onConflict: 'wallet_address' });
            
            if (registryError) {
                console.log(`⚠️ Erreur mise à jour registry: ${registryError.message}`);
            } else {
                console.log(`✅ Registry mis à jour: ${status}`);
            }
            
        } catch (error) {
            console.log(`⚠️ Erreur registry: ${error.message}`);
        }
    }

    // === UTILITAIRES ===
    
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : 
            sorted[mid];
    }

    calculatePerformanceScore(data) {
        let score = 0;
        
        // Composante valeur (30 points max)
        if (data.totalValue > 100000) score += 30;
        else if (data.totalValue > 10000) score += 20;
        else if (data.totalValue > 1000) score += 10;
        
        // Composante PnL (25 points max)
        if (data.totalPnl > 0) {
            const pnlRatio = Math.min(data.totalPnl / Math.max(data.totalValue, 1), 2);
            score += pnlRatio * 25;
        }
        
        // Composante win rate (20 points max)
        score += (data.winRate / 100) * 20;
        
        // Composante diversification (15 points max)
        score += (data.diversificationScore / 100) * 15;
        
        // Composante qualité (10 points max)
        score += (data.avgReliability / 100) * 10;
        
        return Math.max(0, Math.min(100, score));
    }

    calculateRiskScore(data) {
        let risk = 0;
        
        // Concentration risk
        risk += Math.min(data.concentration, 50);
        
        // Security risk  
        const securityRatio = data.totalTokens > 0 ? data.tokensWithSecurity / data.totalTokens : 0;
        risk += (1 - securityRatio) * 30;
        
        // Reliability risk
        risk += Math.max(0, (100 - data.avgReliability) * 0.2);
        
        return Math.min(100, Math.max(0, risk));
    }

    calculateVolatilityScore(portfolio) {
        const prices = portfolio
            .filter(t => t.token_price_usd)
            .map(t => t.token_price_usd);
        
        if (prices.length === 0) return 50;
        
        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        return Math.min(100, (stdDev / avg) * 100);
    }

    calculateLiquidityScore(volumes) {
        if (volumes.length === 0) return 0;
        
        const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        
        if (avgVolume > 10000000) return 90;
        if (avgVolume > 1000000) return 70;
        if (avgVolume > 100000) return 50;
        if (avgVolume > 10000) return 30;
        return 10;
    }

    calculateCompletenessScore(apiData) {
        let score = 0;
        
        if (apiData.portfolio?.data?.portfolio) score += 40;
        if (apiData.pnl?.data && apiData.pnl.data.length > 0) score += 30;
        
        const portfolio = apiData.portfolio?.data?.portfolio || [];
        const enrichedCount = portfolio.filter(t => t.geckoterminal_complete_data).length;
        if (portfolio.length > 0) {
            score += (enrichedCount / portfolio.length) * 30;
        }
        
        return score;
    }

    classifyWallet(data) {
        let category = 'retail_trader';
        let confidence = 60;
        let riskLevel = 'medium';
        let experienceLevel = 'intermediate';
        
        if (data.totalValue > 1000000) {
            category = 'whale';
            confidence = 90;
            riskLevel = data.concentration > 70 ? 'high' : 'medium';
            experienceLevel = 'professional';
        } else if (data.totalValue > 100000) {
            if (data.winRate > 70 && data.avgReliability > 80) {
                category = 'expert_trader';
                confidence = 85;
                riskLevel = 'low';
                experienceLevel = 'expert';
            } else if (data.concentration > 80) {
                category = 'concentrated_trader';
                confidence = 75;
                riskLevel = 'high';
                experienceLevel = 'intermediate';
            } else {
                category = 'wealthy_trader';
                confidence = 70;
                riskLevel = 'medium';
                experienceLevel = 'expert';
            }
        } else if (data.tokenCount > 20 && data.concentration < 60) {
            category = 'diversified_trader';
            confidence = 75;
            riskLevel = 'low';
            experienceLevel = 'intermediate';
        } else if (data.winRate > 80) {
            category = 'expert_trader';
            confidence = 80;
            riskLevel = 'low';
            experienceLevel = 'expert';
        } else if (data.concentration > 80) {
            category = 'concentrated_trader';
            confidence = 70;
            riskLevel = 'high';
            experienceLevel = 'beginner';
        }
        
        return { category, confidence, riskLevel, experienceLevel };
    }

    isStablecoin(symbol) {
        const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'FRAX', 'TUSD', 'USDD'];
        return stablecoins.includes(symbol?.toUpperCase());
    }

    calculateTokenRiskLevel(gt) {
        if (!gt) return 'unknown';
        
        let riskPoints = 0;
        
        // Vérifier les données de sécurité
        if (gt.security_data?.soul_scanner_data?.mintable === '1') riskPoints += 2;
        if (gt.security_data?.soul_scanner_data?.freezeable === '1') riskPoints += 2;
        if (gt.security_data?.go_plus_data?.honeypot_risk === 'high') riskPoints += 3;
        if (gt.security_data?.go_plus_data?.is_blacklisted) riskPoints += 3;
        
        // Vérifier la liquidité
        const liquidity = gt.pool_data?.liquidity_usd || 0;
        if (liquidity < 10000) riskPoints += 2;
        else if (liquidity < 100000) riskPoints += 1;
        
        // Vérifier le score de fiabilité
        const reliability = gt.reliability_score?.total_score || 0;
        if (reliability < 30) riskPoints += 2;
        else if (reliability < 60) riskPoints += 1;
        
        if (riskPoints >= 5) return 'extreme';
        if (riskPoints >= 3) return 'high';
        if (riskPoints >= 1) return 'medium';
        return 'low';
    }

    categorizePnlTradeSize(amountUsd) {
        const amount = this.safeNumber(amountUsd) || 0;
        
        if (amount >= 10000) return 'whale';
        if (amount >= 1000) return 'large';
        if (amount >= 100) return 'medium';
        if (amount >= 10) return 'small';
        return 'micro';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === MÉTHODES PUBLIQUES ===

    async processBatch(walletAddresses) {
        console.log(`\n🚀 TRAITEMENT BATCH: ${walletAddresses.length} wallets`);
        const startTime = Date.now();
        
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        const results = [];
        
        for (const wallet of walletAddresses) {
            const result = await this.processWalletComplete(wallet);
            results.push({ wallet, ...result });
            
            // Pause entre les wallets pour éviter la surcharge
            if (this.stats.processed < walletAddresses.length) {
                await this.delay(1000);
            }
        }
        
        const duration = Date.now() - startTime;
        
        console.log('\n📊 RÉSUMÉ BATCH:');
        console.log(`   ⏱️  Durée: ${(duration / 1000).toFixed(1)}s`);
        console.log(`   ✅ Succès: ${this.stats.successful}/${walletAddresses.length}`);
        console.log(`   ❌ Échecs: ${this.stats.failed}`);
        
        if (this.stats.errors.length > 0) {
            console.log('\n❌ ERREURS:');
            this.stats.errors.forEach(err => {
                console.log(`   ${err.wallet}: ${err.error}`);
            });
        }
        
        return {
            success: this.stats.successful === walletAddresses.length,
            stats: this.stats,
            results,
            duration
        };
    }

    getStats() {
        return this.stats;
    }
}

// Export pour utilisation en module
module.exports = { GMGNApiService };

// Script principal pour test
if (require.main === module) {
    async function main() {
        console.log('🚀 TEST API GMGN SERVICE\n');
        
        const service = new GMGNApiService();
        
        // Wallets de test
        const testWallets = [
            'CwN8wCtN2E2erJ3qJUr3KLq4yGRaEu3X5jxuKFAy3Gba',
            'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'
        ];
        
        const result = await service.processBatch(testWallets);
        
        console.log(`\n🎯 RÉSULTAT FINAL: ${result.success ? 'SUCCÈS' : 'ÉCHEC PARTIEL'}`);
    }
    
    main().catch(console.error);
}
