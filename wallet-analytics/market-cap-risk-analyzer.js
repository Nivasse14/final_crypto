/**
 * Market Cap Risk Analyzer pour scanDune
 * Analyse les risques basés sur la market cap des tokens
 */

class MarketCapRiskAnalyzer {
    constructor() {
        // Seuils de market cap pour classification des risques
        this.riskTiers = {
            MICRO_CAP: { max: 1000, risk: 'EXTREME', multiplier: 0.3 },
            NANO_CAP: { max: 10000, risk: 'VERY_HIGH', multiplier: 0.5 },
            LOW_CAP: { max: 100000, risk: 'HIGH', multiplier: 0.7 },
            SMALL_CAP: { max: 1000000, risk: 'MEDIUM', multiplier: 0.85 },
            MID_CAP: { max: 10000000, risk: 'LOW', multiplier: 1.0 },
            LARGE_CAP: { max: Infinity, risk: 'VERY_LOW', multiplier: 1.2 }
        };
    }

    /**
     * Analyse le risque basé sur la market cap
     * @param {Object} tokenData - Données du token
     * @returns {Object} - Score de risque et recommandations
     */
    analyzeRisk(tokenData) {
        const marketCap = tokenData.market_cap_usd || tokenData.calculated_market_cap_usd;
        const reliability = tokenData.reliability_score?.total_score || 0;
        
        const riskTier = this.getRiskTier(marketCap);
        const liquidityRisk = this.analyzeLiquidityRisk(tokenData);
        const securityRisk = this.analyzeSecurityRisk(tokenData);
        
        return {
            market_cap: marketCap,
            risk_tier: riskTier,
            liquidity_risk: liquidityRisk,
            security_risk: securityRisk,
            overall_risk_score: this.calculateOverallRisk(riskTier, liquidityRisk, securityRisk, reliability),
            position_recommendation: this.getPositionRecommendation(marketCap, reliability),
            exit_strategy: this.generateExitStrategy(riskTier, tokenData)
        };
    }

    /**
     * Détermine le tier de risque basé sur la market cap
     */
    getRiskTier(marketCap) {
        for (const [tier, config] of Object.entries(this.riskTiers)) {
            if (marketCap <= config.max) {
                return {
                    tier,
                    risk_level: config.risk,
                    multiplier: config.multiplier,
                    market_cap: marketCap
                };
            }
        }
    }

    /**
     * Analyse le risque de liquidité
     */
    analyzeLiquidityRisk(tokenData) {
        const poolData = tokenData.geckoterminal_complete_data?.pool_data;
        if (!poolData) return { level: 'UNKNOWN', score: 0 };

        const reserveUsd = parseFloat(poolData.reserve_usd) || 0;
        const volume24h = parseFloat(poolData.volume_24h_usd) || 0;
        const swapCount = poolData.swap_count_24h || 0;

        let liquidityScore = 0;
        
        // Score basé sur la réserve
        if (reserveUsd > 100000) liquidityScore += 30;
        else if (reserveUsd > 10000) liquidityScore += 20;
        else if (reserveUsd > 1000) liquidityScore += 10;
        
        // Score basé sur le volume
        if (volume24h > 50000) liquidityScore += 30;
        else if (volume24h > 5000) liquidityScore += 20;
        else if (volume24h > 500) liquidityScore += 10;
        
        // Score basé sur les swaps
        if (swapCount > 1000) liquidityScore += 20;
        else if (swapCount > 100) liquidityScore += 15;
        else if (swapCount > 10) liquidityScore += 10;

        return {
            level: this.getLiquidityLevel(liquidityScore),
            score: liquidityScore,
            reserve_usd: reserveUsd,
            volume_24h: volume24h,
            swap_count: swapCount
        };
    }

    /**
     * Analyse le risque de sécurité
     */
    analyzeSecurityRisk(tokenData) {
        const securityData = tokenData.security_data || {};
        const soulData = securityData.soul_scanner_data || {};
        const poolData = tokenData.geckoterminal_complete_data?.pool_data || {};
        
        let securityScore = 50; // Score de base
        
        // Vérifications de sécurité
        if (soulData.mintable === "0") securityScore += 15;
        if (soulData.freezeable === "0") securityScore += 15;
        if (tokenData.liquidity_locked?.locked_percent === 100) securityScore += 20;
        if (!tokenData.is_honeypot) securityScore += 20;
        
        // Pénalités
        if (soulData.airdrop_percentage > 90) securityScore -= 20;
        if (soulData.bundled_buy_percentage > 10) securityScore -= 15;
        if (poolData.security_indicators?.includes('low_liquidity_pool')) securityScore -= 10;
        
        return {
            score: Math.max(0, Math.min(100, securityScore)),
            is_mintable: soulData.mintable !== "0",
            is_freezeable: soulData.freezeable !== "0",
            liquidity_locked: tokenData.liquidity_locked?.locked_percent || 0,
            is_honeypot: tokenData.is_honeypot,
            airdrop_percentage: soulData.airdrop_percentage || 0
        };
    }

    /**
     * Calcule le score de risque global
     */
    calculateOverallRisk(riskTier, liquidityRisk, securityRisk, reliability) {
        const marketCapWeight = 0.4;
        const liquidityWeight = 0.3;
        const securityWeight = 0.2;
        const reliabilityWeight = 0.1;

        const marketCapScore = (1 - this.getRiskScore(riskTier.risk_level)) * 100;
        const liquidityScore = liquidityRisk.score;
        const securityScore = securityRisk.score;
        const reliabilityScore = reliability;

        const overallScore = (
            marketCapScore * marketCapWeight +
            liquidityScore * liquidityWeight +
            securityScore * securityWeight +
            reliabilityScore * reliabilityWeight
        );

        return {
            score: overallScore,
            grade: this.getGrade(overallScore),
            components: {
                market_cap: marketCapScore,
                liquidity: liquidityScore,
                security: securityScore,
                reliability: reliabilityScore
            }
        };
    }

    /**
     * Recommandation de taille de position
     */
    getPositionRecommendation(marketCap, reliability) {
        const riskTier = this.getRiskTier(marketCap);
        
        let maxPositionPercent;
        
        switch(riskTier.tier) {
            case 'MICRO_CAP': maxPositionPercent = 0.5; break;
            case 'NANO_CAP': maxPositionPercent = 1.0; break;
            case 'LOW_CAP': maxPositionPercent = 2.0; break;
            case 'SMALL_CAP': maxPositionPercent = 5.0; break;
            case 'MID_CAP': maxPositionPercent = 10.0; break;
            case 'LARGE_CAP': maxPositionPercent = 15.0; break;
            default: maxPositionPercent = 1.0;
        }

        // Ajustement basé sur la fiabilité
        if (reliability > 70) maxPositionPercent *= 1.5;
        else if (reliability < 30) maxPositionPercent *= 0.5;

        return {
            max_position_percent: Math.min(maxPositionPercent, 15),
            recommended_entry: marketCap < 100000 ? 'DCA' : 'LUMP_SUM',
            warning: marketCap < 10000 ? 'EXTREME_RISK' : null
        };
    }

    /**
     * Génère une stratégie de sortie
     */
    generateExitStrategy(riskTier, tokenData) {
        const marketCap = tokenData.market_cap_usd || tokenData.calculated_market_cap_usd;
        
        if (marketCap < 1000) {
            return {
                strategy: 'AGGRESSIVE_SCALING',
                take_profits: [
                    { percentage: 25, roi_target: 100 },
                    { percentage: 25, roi_target: 300 },
                    { percentage: 30, roi_target: 500 },
                    { percentage: 20, roi_target: 1000 }
                ],
                stop_loss: -50
            };
        } else if (marketCap < 100000) {
            return {
                strategy: 'MODERATE_SCALING',
                take_profits: [
                    { percentage: 30, roi_target: 50 },
                    { percentage: 30, roi_target: 150 },
                    { percentage: 25, roi_target: 300 },
                    { percentage: 15, roi_target: 500 }
                ],
                stop_loss: -30
            };
        } else {
            return {
                strategy: 'CONSERVATIVE_SCALING',
                take_profits: [
                    { percentage: 40, roi_target: 25 },
                    { percentage: 35, roi_target: 75 },
                    { percentage: 25, roi_target: 150 }
                ],
                stop_loss: -20
            };
        }
    }

    // Méthodes utilitaires
    getRiskScore(riskLevel) {
        const riskMap = {
            'VERY_LOW': 0.1,
            'LOW': 0.2,
            'MEDIUM': 0.4,
            'HIGH': 0.6,
            'VERY_HIGH': 0.8,
            'EXTREME': 0.95
        };
        return riskMap[riskLevel] || 0.5;
    }

    getLiquidityLevel(score) {
        if (score >= 70) return 'HIGH';
        if (score >= 50) return 'MEDIUM';
        if (score >= 30) return 'LOW';
        return 'VERY_LOW';
    }

    getGrade(score) {
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }
}

module.exports = MarketCapRiskAnalyzer;
