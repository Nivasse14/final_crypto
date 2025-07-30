// complete-data-extractor.js
// Script pour capturer TOUTES les données de l'API et les stocker en format colonnaire

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

class CompleteDataExtractor {
    constructor() {
        this.apiBase = 'http://localhost:3001';
        this.capturedFields = new Set();
        this.samples = [];
    }

    async analyzeAPIResponse(wallet) {
        console.log(`🔍 Analyse complète pour ${wallet}...`);
        
        try {
            // Utiliser le bon endpoint
            const endpoints = [
                `/api/cielo/complete/${wallet}`
            ];
            
            let response = null;
            for (const endpoint of endpoints) {
                try {
                    console.log(`📡 Test endpoint: ${endpoint}`);
                    response = await axios.get(`${this.apiBase}${endpoint}`, {
                        timeout: 30000,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`✅ Endpoint fonctionnel: ${endpoint}`);
                    break;
                } catch (err) {
                    console.log(`❌ Endpoint ${endpoint} non accessible: ${err.message}`);
                    continue;
                }
            }
            
            if (!response) {
                throw new Error('Aucun endpoint accessible');
            }
            
            const data = response.data;
            console.log(`📊 Données reçues: ${JSON.stringify(data).length} caractères`);
            
            // Analyser la structure complète
            this.analyzeStructure('root', data);
            
            // Sauvegarder un échantillon pour analyse
            this.samples.push({
                wallet,
                data,
                timestamp: new Date().toISOString()
            });
            
            return data;
            
        } catch (error) {
            console.log(`❌ Erreur analyse ${wallet}: ${error.message}`);
            throw error;
        }
    }

    analyzeStructure(path, obj, depth = 0) {
        if (depth > 5) return; // Éviter récursion infinie
        
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                this.capturedFields.add(`${path}[]`);
                if (obj.length > 0) {
                    this.analyzeStructure(`${path}[0]`, obj[0], depth + 1);
                }
            } else {
                Object.keys(obj).forEach(key => {
                    const fullPath = path === 'root' ? key : `${path}.${key}`;
                    this.capturedFields.add(fullPath);
                    this.analyzeStructure(fullPath, obj[key], depth + 1);
                });
            }
        } else {
            // Valeur primitive
            this.capturedFields.add(`${path}:${typeof obj}`);
        }
    }

    async extractAllTokenData(portfolioData, walletAddress) {
        console.log('🪙 Extraction complète des données tokens...');
        
        const tokens = [];
        if (!portfolioData || !Array.isArray(portfolioData)) {
            console.log('⚠️  Pas de données portfolio');
            return tokens;
        }
        
        portfolioData.forEach((token, index) => {
            try {
                // Extraire TOUS les champs disponibles
                const extractedToken = {
                    wallet_address: walletAddress,
                    token_index: index,
                    
                    // === CHAMPS DE BASE ===
                    token_address: token.token_address || token.address || token.mint,
                    token_symbol: token.token_symbol || token.symbol,
                    token_name: token.token_name || token.name,
                    token_decimals: token.token_decimals || token.decimals,
                    chain: token.chain || 'solana',
                    
                    // === DONNÉES FINANCIÈRES ===
                    balance: this.safeNumber(token.balance),
                    balance_raw: this.safeNumber(token.balance_raw),
                    total_usd_value: this.safeNumber(token.total_usd_value),
                    token_price_usd: this.safeNumber(token.token_price_usd || token.price_usd),
                    price_change_24h: this.safeNumber(token.price_change_24h),
                    
                    // === PNL ===
                    pnl: this.safeNumber(token.pnl),
                    pnl_percentage: this.safeNumber(token.pnl_percentage),
                    unrealized_pnl: this.safeNumber(token.unrealized_pnl),
                    realized_pnl: this.safeNumber(token.realized_pnl),
                    
                    // === SUPPLY ===
                    total_supply: this.safeNumber(token.total_supply || token.supply),
                    circulating_supply: this.safeNumber(token.circulating_supply),
                    supply_owned: this.safeNumber(token.supply_owned),
                    max_supply: this.safeNumber(token.max_supply),
                    
                    // === GECKOTERMINAL - DONNÉES DE BASE ===
                    gt_enriched: !!(token.geckoterminal_complete_data || token.geckoterminal_enriched),
                    gt_name: token.geckoterminal_complete_data?.name,
                    gt_symbol: token.geckoterminal_complete_data?.symbol,
                    gt_decimals: token.geckoterminal_complete_data?.decimals,
                    gt_address: token.geckoterminal_complete_data?.address,
                    gt_on_coingecko: token.geckoterminal_complete_data?.on_coingecko,
                    
                    // === GECKOTERMINAL - MARKET DATA ===
                    gt_market_cap_usd: this.safeNumber(token.geckoterminal_complete_data?.market_cap_usd),
                    gt_original_market_cap_usd: this.safeNumber(token.geckoterminal_complete_data?.original_market_cap_usd),
                    gt_calculated_market_cap_usd: this.safeNumber(token.geckoterminal_complete_data?.calculated_market_cap_usd),
                    gt_circulating_supply: this.safeNumber(token.geckoterminal_complete_data?.circulating_supply),
                    gt_total_supply: this.safeNumber(token.geckoterminal_complete_data?.total_supply),
                    gt_max_supply: this.safeNumber(token.geckoterminal_complete_data?.max_supply),
                    
                    // === GECKOTERMINAL - POOL DATA ===
                    gt_pool_score: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.gt_score),
                    gt_pool_price_usd: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.price_usd || token.geckoterminal_complete_data?.pool_data?.price_in_usd),
                    gt_pool_volume_24h_usd: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.volume_24h_usd),
                    gt_pool_liquidity_usd: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.liquidity_usd),
                    gt_pool_fdv: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.fdv),
                    gt_pool_price_change_24h: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.price_change_24h),
                    gt_pool_price_change_percentage_24h: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.price_change_percentage_24h),
                    gt_pool_volume_24h_change: this.safeNumber(token.geckoterminal_complete_data?.pool_data?.volume_24h_change),
                    
                    // === GECKOTERMINAL - SECURITY DATA ===
                    gt_security_holder_count: this.safeNumber(token.geckoterminal_complete_data?.security_data?.holder_count),
                    gt_security_mintable: token.geckoterminal_complete_data?.security_data?.soul_scanner_data?.mintable === '1',
                    gt_security_freezeable: token.geckoterminal_complete_data?.security_data?.soul_scanner_data?.freezeable === '1',
                    gt_security_top_10_holder_percent: this.safeNumber(token.geckoterminal_complete_data?.security_data?.top_10_holder_percent),
                    gt_security_top_10_user_balance: this.safeNumber(token.geckoterminal_complete_data?.security_data?.top_10_user_balance),
                    gt_security_locked_percent: this.safeNumber(token.geckoterminal_complete_data?.security_data?.locked_percent),
                    
                    // === GECKOTERMINAL - GO PLUS DATA ===
                    gt_goplus_honeypot_risk: token.geckoterminal_complete_data?.security_data?.go_plus_data?.honeypot_risk,
                    gt_goplus_transfer_pausable: token.geckoterminal_complete_data?.security_data?.go_plus_data?.transfer_pausable,
                    gt_goplus_is_blacklisted: token.geckoterminal_complete_data?.security_data?.go_plus_data?.is_blacklisted,
                    gt_goplus_is_whitelisted: token.geckoterminal_complete_data?.security_data?.go_plus_data?.is_whitelisted,
                    gt_goplus_buy_tax: this.safeNumber(token.geckoterminal_complete_data?.security_data?.go_plus_data?.buy_tax),
                    gt_goplus_sell_tax: this.safeNumber(token.geckoterminal_complete_data?.security_data?.go_plus_data?.sell_tax),
                    
                    // === GECKOTERMINAL - RELIABILITY SCORES ===
                    gt_reliability_total_score: this.safeNumber(token.geckoterminal_complete_data?.reliability_score?.total_score),
                    gt_reliability_pool_score: this.safeNumber(token.geckoterminal_complete_data?.reliability_score?.factors?.pool_score),
                    gt_reliability_security_score: this.safeNumber(token.geckoterminal_complete_data?.reliability_score?.factors?.security_score),
                    gt_reliability_fundamentals_score: this.safeNumber(token.geckoterminal_complete_data?.reliability_score?.factors?.fundamentals_score),
                    gt_reliability_community_score: this.safeNumber(token.geckoterminal_complete_data?.reliability_score?.factors?.community_score),
                    
                    // === MÉTADONNÉES ===
                    data_source: token.source || 'complete',
                    last_updated_api: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    
                    // === DONNÉES BRUTES (BACKUP) ===
                    raw_token_data: token,
                    raw_geckoterminal_data: token.geckoterminal_complete_data
                };
                
                tokens.push(extractedToken);
                
            } catch (error) {
                console.log(`❌ Erreur extraction token ${index}: ${error.message}`);
            }
        });
        
        console.log(`✅ ${tokens.length} tokens extraits avec données complètes`);
        return tokens;
    }

    async extractCompleteWalletData(apiData, walletAddress) {
        console.log('💼 Extraction complète des données wallet...');
        
        try {
            const portfolio = apiData.data?.portfolio?.data?.portfolio || [];
            const pnlData = apiData.data?.pnl?.data || [];
            
            // Calculer toutes les métriques possibles
            const totalValue = portfolio.reduce((sum, token) => sum + (token.total_usd_value || 0), 0);
            const tokenCount = portfolio.length;
            const activeTokens = portfolio.filter(t => (t.total_usd_value || 0) > 0.01);
            
            // PnL metrics
            const totalPnl = pnlData.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
            const winningTrades = pnlData.filter(t => (t.pnl || 0) > 0);
            const losingTrades = pnlData.filter(t => (t.pnl || 0) < 0);
            const winRate = pnlData.length > 0 ? (winningTrades.length / pnlData.length) * 100 : 0;
            
            // Enrichment metrics
            const enrichedTokens = portfolio.filter(t => t.geckoterminal_complete_data);
            const tokensWithMarketCap = portfolio.filter(t => t.geckoterminal_complete_data?.market_cap_usd);
            const tokensWithSecurity = portfolio.filter(t => t.geckoterminal_complete_data?.security_data);
            
            // Distribution metrics
            const tokenValues = portfolio.map(t => t.total_usd_value || 0).sort((a, b) => b - a);
            const top5Value = tokenValues.slice(0, 5).reduce((sum, val) => sum + val, 0);
            const top10Value = tokenValues.slice(0, 10).reduce((sum, val) => sum + val, 0);
            const concentration5 = totalValue > 0 ? (top5Value / totalValue) * 100 : 0;
            const concentration10 = totalValue > 0 ? (top10Value / totalValue) * 100 : 0;
            const largestPosition = totalValue > 0 ? (tokenValues[0] / totalValue) * 100 : 0;
            
            // Quality metrics
            const reliabilityScores = portfolio
                .filter(t => t.geckoterminal_complete_data?.reliability_score?.total_score)
                .map(t => t.geckoterminal_complete_data.reliability_score.total_score);
            const avgReliability = reliabilityScores.length > 0 ? 
                reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length : 0;
            
            // Market cap metrics
            const marketCaps = portfolio
                .filter(t => t.geckoterminal_complete_data?.market_cap_usd)
                .map(t => t.geckoterminal_complete_data.market_cap_usd);
            const avgMarketCap = marketCaps.length > 0 ? 
                marketCaps.reduce((sum, cap) => sum + cap, 0) / marketCaps.length : 0;
            const medianMarketCap = this.calculateMedian(marketCaps);
            
            // Volume metrics
            const volumes = portfolio
                .filter(t => t.geckoterminal_complete_data?.pool_data?.volume_24h_usd)
                .map(t => t.geckoterminal_complete_data.pool_data.volume_24h_usd);
            const avgVolume = volumes.length > 0 ? 
                volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length : 0;
            const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
            
            // Classification
            const classification = this.classifyWallet({
                totalValue,
                tokenCount,
                concentration5,
                avgReliability,
                winRate,
                totalPnl
            });
            
            const walletData = {
                wallet_address: walletAddress,
                
                // === MÉTRIQUES FINANCIÈRES ===
                total_value_usd: totalValue,
                total_pnl: totalPnl,
                total_pnl_percentage: totalValue > 0 ? (totalPnl / totalValue) * 100 : 0,
                
                // === TRADING METRICS ===
                win_rate: winRate,
                total_trades: pnlData.length,
                winning_trades: winningTrades.length,
                losing_trades: losingTrades.length,
                avg_trade_size: pnlData.length > 0 ? totalPnl / pnlData.length : 0,
                largest_win: Math.max(...winningTrades.map(t => t.pnl || 0), 0),
                largest_loss: Math.min(...losingTrades.map(t => t.pnl || 0), 0),
                
                // === PORTFOLIO METRICS ===
                token_count: tokenCount,
                active_token_count: activeTokens.length,
                avg_token_value: tokenCount > 0 ? totalValue / tokenCount : 0,
                max_token_value: Math.max(...tokenValues, 0),
                min_token_value: tokenValues.filter(v => v > 0).length > 0 ? Math.min(...tokenValues.filter(v => v > 0)) : 0,
                median_token_value: this.calculateMedian(tokenValues.filter(v => v > 0)),
                
                // === CONCENTRATION METRICS ===
                top_5_tokens_concentration_pct: concentration5,
                top_10_tokens_concentration_pct: concentration10,
                largest_position_pct: largestPosition,
                diversification_score: Math.max(0, 100 - concentration5),
                gini_coefficient: this.calculateGiniCoefficient(tokenValues),
                
                // === QUALITY METRICS ===
                avg_reliability_score: avgReliability,
                median_reliability_score: this.calculateMedian(reliabilityScores),
                avg_token_market_cap: avgMarketCap,
                median_token_market_cap: medianMarketCap,
                avg_token_volume_24h: avgVolume,
                total_portfolio_volume_24h: totalVolume,
                
                // === ENRICHMENT METRICS ===
                enriched_tokens_count: enrichedTokens.length,
                enriched_tokens_percentage: tokenCount > 0 ? (enrichedTokens.length / tokenCount) * 100 : 0,
                tokens_with_market_cap: tokensWithMarketCap.length,
                tokens_with_security_data: tokensWithSecurity.length,
                tokens_on_coingecko_count: portfolio.filter(t => t.geckoterminal_complete_data?.on_coingecko).length,
                
                // === RISK METRICS ===
                risk_score: this.calculateRiskScore({
                    concentration5,
                    avgReliability,
                    tokensWithSecurity: tokensWithSecurity.length,
                    totalTokens: tokenCount
                }),
                volatility_score: this.calculateVolatilityScore(portfolio),
                liquidity_score: this.calculateLiquidityScore(volumes),
                
                // === CLASSIFICATION IA ===
                ai_category: classification.category,
                ai_confidence: classification.confidence,
                ai_risk_level: classification.riskLevel,
                ai_experience_level: classification.experienceLevel,
                
                // === PERFORMANCE SCORES ===
                performance_score: this.calculatePerformanceScore({
                    totalValue,
                    totalPnl,
                    winRate,
                    diversification: 100 - concentration5,
                    avgReliability,
                    tokenCount
                }),
                analysis_score: 0, // Sera calculé après
                
                // === MÉTADONNÉES ===
                data_completeness_score: this.calculateCompletenessScore(apiData),
                enrichment_status: enrichedTokens.length === tokenCount ? 'complete' : 
                                 enrichedTokens.length > 0 ? 'partial' : 'pending',
                last_updated: new Date().toISOString(),
                
                // === DONNÉES BRUTES ===
                raw_portfolio_data: apiData.data?.portfolio,
                raw_pnl_data: apiData.data?.pnl,
                raw_complete_data: apiData
            };
            
            // Calculer analysis_score basé sur performance_score
            walletData.analysis_score = walletData.performance_score;
            
            console.log(`✅ Wallet data extracted: $${totalValue.toLocaleString()}, ${tokenCount} tokens, score: ${walletData.performance_score.toFixed(1)}`);
            
            return walletData;
            
        } catch (error) {
            console.log(`❌ Erreur extraction wallet: ${error.message}`);
            throw error;
        }
    }

    // Utilitaires de calcul
    safeNumber(value) {
        if (value === null || value === undefined || value === '' || isNaN(value)) {
            return null;
        }
        return Number(value);
    }

    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : 
            sorted[mid];
    }

    calculateGiniCoefficient(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        const sum = sorted.reduce((a, b) => a + b, 0);
        if (sum === 0) return 0;
        
        let numerator = 0;
        for (let i = 0; i < n; i++) {
            numerator += (2 * (i + 1) - n - 1) * sorted[i];
        }
        return numerator / (n * sum);
    }

    calculateRiskScore(data) {
        let risk = 0;
        
        // Concentration risk
        risk += Math.min(data.concentration5, 50);
        
        // Security risk  
        const securityRatio = data.totalTokens > 0 ? data.tokensWithSecurity / data.totalTokens : 0;
        risk += (1 - securityRatio) * 30;
        
        // Reliability risk
        risk += Math.max(0, (100 - data.avgReliability) * 0.2);
        
        return Math.min(100, Math.max(0, risk));
    }

    calculateVolatilityScore(portfolio) {
        // Simplification: basé sur la diversité des prix
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
        
        // Score basé sur le volume moyen
        if (avgVolume > 10000000) return 90;
        if (avgVolume > 1000000) return 70;
        if (avgVolume > 100000) return 50;
        if (avgVolume > 10000) return 30;
        return 10;
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
        score += (data.diversification / 100) * 15;
        
        // Composante qualité (10 points max)
        score += (data.avgReliability / 100) * 10;
        
        return Math.max(0, Math.min(100, score));
    }

    calculateCompletenessScore(apiData) {
        let score = 0;
        
        if (apiData.data?.portfolio) score += 40;
        if (apiData.data?.pnl) score += 30;
        
        const portfolio = apiData.data?.portfolio?.data?.portfolio || [];
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
            riskLevel = data.concentration5 > 70 ? 'high' : 'medium';
            experienceLevel = 'professional';
        } else if (data.totalValue > 100000) {
            if (data.winRate > 70 && data.avgReliability > 80) {
                category = 'expert_trader';
                confidence = 85;
                riskLevel = 'low';
                experienceLevel = 'expert';
            } else if (data.concentration5 > 80) {
                category = 'concentrated_trader';
                confidence = 75;
                riskLevel = 'high';
                experienceLevel = 'intermediate';
            } else {
                category = 'whale';
                confidence = 70;
                riskLevel = 'medium';
                experienceLevel = 'expert';
            }
        } else if (data.tokenCount > 20 && data.concentration5 < 60) {
            category = 'diversified_trader';
            confidence = 75;
            riskLevel = 'low';
            experienceLevel = 'intermediate';
        } else if (data.winRate > 80) {
            category = 'expert_trader';
            confidence = 80;
            riskLevel = 'low';
            experienceLevel = 'expert';
        } else if (data.concentration5 > 80) {
            category = 'concentrated_trader';
            confidence = 70;
            riskLevel = 'high';
            experienceLevel = 'beginner';
        }
        
        return { category, confidence, riskLevel, experienceLevel };
    }

    async saveCompleteData(walletAddress, walletData, tokensData) {
        console.log(`💾 Sauvegarde complète pour ${walletAddress}...`);
        
        try {
            // Calculer les portfolio weights
            const totalValue = walletData.total_value_usd;
            tokensData.forEach((token, index) => {
                if (totalValue > 0) {
                    token.portfolio_weight_pct = ((token.total_usd_value || 0) / totalValue) * 100;
                    token.is_top_holding = token.portfolio_weight_pct >= 5;
                }
                token.holding_rank = index + 1;
            });
            
            // Sauvegarder le wallet
            const { error: walletError } = await supabase
                .from('wallets_extended')
                .upsert(walletData);
            
            if (walletError) {
                throw new Error(`Erreur wallet: ${walletError.message}`);
            }
            
            // Supprimer les anciens tokens
            await supabase
                .from('wallet_tokens_extended')
                .delete()
                .eq('wallet_address', walletAddress);
            
            // Sauvegarder les tokens par batches
            if (tokensData.length > 0) {
                const batchSize = 50;
                for (let i = 0; i < tokensData.length; i += batchSize) {
                    const batch = tokensData.slice(i, i + batchSize);
                    const { error: tokensError } = await supabase
                        .from('wallet_tokens_extended')
                        .insert(batch);
                    
                    if (tokensError) {
                        throw new Error(`Erreur tokens batch ${i}: ${tokensError.message}`);
                    }
                }
            }
            
            console.log(`✅ Sauvegardé: wallet + ${tokensData.length} tokens`);
            return true;
            
        } catch (error) {
            console.log(`❌ Erreur sauvegarde: ${error.message}`);
            throw error;
        }
    }

    async processWalletComplete(walletAddress) {
        console.log(`\n🚀 TRAITEMENT COMPLET: ${walletAddress}`);
        const startTime = Date.now();
        
        try {
            // 1. Analyser l'API et récupérer les données
            const apiData = await this.analyzeAPIResponse(walletAddress);
            
            // 2. Extraire les données wallet complètes
            const walletData = await this.extractCompleteWalletData(apiData, walletAddress);
            
            // 3. Extraire tous les tokens avec toutes leurs données
            const portfolioTokens = apiData.data?.portfolio?.data?.portfolio || [];
            const tokensData = await this.extractAllTokenData(portfolioTokens, walletAddress);
            
            // 4. Sauvegarder tout
            await this.saveCompleteData(walletAddress, walletData, tokensData);
            
            const duration = Date.now() - startTime;
            console.log(`✅ SUCCÈS en ${duration}ms`);
            console.log(`   💰 Valeur: $${walletData.total_value_usd.toLocaleString()}`);
            console.log(`   🪙 Tokens: ${tokensData.length}`);
            console.log(`   📊 Score: ${walletData.performance_score.toFixed(1)}`);
            console.log(`   🏷️  Catégorie: ${walletData.ai_category}`);
            
            return {
                success: true,
                walletData,
                tokensCount: tokensData.length,
                duration
            };
            
        } catch (error) {
            console.log(`❌ ÉCHEC: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    showCapturedFields() {
        console.log('\n📊 ANALYSE DES CHAMPS CAPTURÉS:');
        console.log(`Total: ${this.capturedFields.size} champs uniques`);
        
        const fields = Array.from(this.capturedFields).sort();
        fields.forEach(field => {
            console.log(`   ${field}`);
        });
    }

    async saveSampleData() {
        if (this.samples.length > 0) {
            const filename = `api-samples-${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(this.samples, null, 2));
            console.log(`💾 Échantillons sauvegardés: ${filename}`);
        }
    }
}

// Script principal
async function main() {
    console.log('🚀 EXTRACTEUR COMPLET DE DONNÉES API CIELO\n');
    
    const extractor = new CompleteDataExtractor();
    
    // Wallets de test
    const testWallets = [
        'CwN8wCtN2E2erJ3qJUr3KLq4yGRaEu3X5jxuKFAy3Gba',
        'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'
    ];
    
    const results = [];
    
    for (const wallet of testWallets) {
        const result = await extractor.processWalletComplete(wallet);
        results.push({ wallet, ...result });
        
        // Pause entre les wallets
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Afficher les résultats
    console.log('\n📊 RÉSUMÉ FINAL:');
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.wallet}: ${result.success ? 'Succès' : result.error}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 RÉSULTAT: ${successCount}/${testWallets.length} wallets traités avec succès`);
    
    // Sauvegarder les échantillons
    await extractor.saveSampleData();
    
    // Afficher les champs capturés
    extractor.showCapturedFields();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CompleteDataExtractor };
