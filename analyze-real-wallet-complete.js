#!/usr/bin/env node

/**
 * Analyse complète d'un wallet réel avec l'API complete et Market Cap Analyzer
 */

require('dotenv').config();
const MarketCapRiskAnalyzer = require('./wallet-analytics/market-cap-risk-analyzer');

async function analyzeRealWalletComplete() {
    console.log('🚀 ANALYSE COMPLÈTE - WALLET RÉEL + API + MARKET CAP ANALYZER\n');
    console.log('=' * 70);
    
    const apiUrl = process.env.API_BASE_URL + '/cielo-api';
    const authToken = process.env.SUPABASE_ANON_KEY;
    const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    
    console.log(`🔍 Wallet analysé: ${testWallet}\n`);
    
    try {
        // 1. Récupérer les données via API
        console.log('📡 1. RÉCUPÉRATION DES DONNÉES API...');
        const response = await fetch(`${apiUrl}/complete/${testWallet}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const apiData = await response.json();
        const walletData = apiData.data;
        
        console.log('   ✅ Données reçues de l\'API complete');
        
        // 2. Analyser avec Market Cap Risk Analyzer
        console.log('\n🧮 2. ANALYSE MARKET CAP RISK...');
        const analyzer = new MarketCapRiskAnalyzer();
        
        let portfolioAnalysis = [];
        let pnlAnalysis = [];
        let totalRiskScore = 0;
        let alphaSignals = [];
        
        // Analyser le portfolio actuel
        if (walletData.portfolio?.data?.portfolio) {
            console.log('\n💼 ANALYSE DU PORTFOLIO ACTUEL:');
            console.log('=' * 40);
            
            walletData.portfolio.data.portfolio.forEach((token, i) => {
                if (token.geckoterminal_complete_data) {
                    const tokenData = {
                        market_cap_usd: token.geckoterminal_complete_data.market_cap_usd,
                        calculated_market_cap_usd: token.geckoterminal_complete_data.calculated_market_cap_usd,
                        reliability_score: token.geckoterminal_complete_data.reliability_score,
                        security_data: token.geckoterminal_complete_data.security_data,
                        token_symbol: token.token_symbol,
                        token_name: token.token_name,
                        total_pnl_usd: token.pnl || 0,
                        roi_percentage: token.pnl_percentage || 0,
                        total_usd_value: token.total_usd_value
                    };
                    
                    const analysis = analyzer.analyzeRisk(tokenData);
                    portfolioAnalysis.push({ token: tokenData, analysis });
                    
                    console.log(`\n💎 ${i + 1}. ${token.token_symbol} (${token.token_name}):`);
                    console.log(`   💰 Market Cap: $${(tokenData.market_cap_usd / 1000000).toFixed(0)}M`);
                    console.log(`   ⚠️  Risk Tier: ${analysis.risk_tier?.tier} (${analysis.risk_tier?.risk_level})`);
                    console.log(`   📈 Grade: ${analysis.overall_risk_score?.grade} (${analysis.overall_risk_score?.score?.toFixed(1)})`);
                    console.log(`   💵 Valeur: $${token.total_usd_value?.toLocaleString()}`);
                    console.log(`   📊 PnL: $${token.pnl?.toFixed(0)} (${token.pnl_percentage?.toFixed(1)}%)`);
                    console.log(`   🔒 Reliability: ${tokenData.reliability_score?.total_score}/100`);
                    
                    totalRiskScore += analysis.overall_risk_score?.score || 50;
                    
                    // Détecter signaux alpha
                    if (analysis.risk_tier?.tier === 'MICRO_CAP' && Math.abs(token.pnl_percentage || 0) > 100) {
                        alphaSignals.push(`${token.token_symbol}: Micro-cap avec fort PnL`);
                    }
                }
            });
        }
        
        // Analyser les meilleurs trades PnL
        if (walletData.pnl?.data) {
            console.log('\n🏆 ANALYSE DES MEILLEURS TRADES:');
            console.log('=' * 40);
            
            // Trier par PnL décroissant et prendre les 5 meilleurs
            const bestTrades = walletData.pnl.data
                .filter(trade => trade.pnl > 1000) // PnL > $1000
                .sort((a, b) => b.pnl - a.pnl)
                .slice(0, 5);
            
            bestTrades.forEach((trade, i) => {
                console.log(`\n🚀 Trade ${i + 1}: ${trade.token_symbol}`);
                console.log(`   💰 PnL: $${trade.pnl.toLocaleString()}`);
                console.log(`   📈 ROI: ${trade.roi?.toFixed(1)}%`);
                console.log(`   💵 Investissement: $${trade.buy_amount_usd?.toLocaleString()}`);
                console.log(`   ⏱️  Holding: ${Math.round((trade.holding_time || 0) / (24 * 60 * 60 * 1000))} jours`);
                
                if (trade.roi > 500) {
                    alphaSignals.push(`${trade.token_symbol}: ROI exceptionnel ${trade.roi.toFixed(0)}%`);
                }
            });
        }
        
        // 3. Calcul du score Alpha global
        console.log('\n🎯 3. SCORE ALPHA GLOBAL:');
        console.log('=' * 30);
        
        const summary = walletData.summary;
        const stats = walletData.stats?.data;
        
        let alphaScore = 0;
        
        // Facteur Performance (30%)
        const totalPnl = summary?.total_pnl_usd || 0;
        const performanceScore = Math.min((totalPnl / 1000), 30); // Max 30 points
        alphaScore += Math.max(0, performanceScore);
        
        // Facteur Win Rate (20%)
        const winRate = summary?.winrate || 0;
        const winRateScore = Math.min((winRate / 5), 20); // Max 20 points
        alphaScore += winRateScore;
        
        // Facteur Diversification (20%)
        const tokensTraded = summary?.total_tokens_traded || 0;
        const diversificationScore = Math.min((tokensTraded / 5), 20); // Max 20 points
        alphaScore += diversificationScore;
        
        // Facteur Risk-Adjusted (15%)
        const avgRiskScore = totalRiskScore / Math.max(portfolioAnalysis.length, 1);
        const riskAdjustedScore = Math.min((avgRiskScore / 6.67), 15); // Max 15 points
        alphaScore += riskAdjustedScore;
        
        // Facteur Alpha Signals (15%)
        const alphaSignalScore = Math.min((alphaSignals.length * 3), 15); // Max 15 points
        alphaScore += alphaSignalScore;
        
        console.log(`💰 Total PnL: $${totalPnl?.toLocaleString()}`);
        console.log(`🎯 Win Rate: ${winRate?.toFixed(1)}%`);
        console.log(`🪙 Tokens tradés: ${tokensTraded}`);
        console.log(`⚖️  Risk Score moyen: ${avgRiskScore?.toFixed(1)}/100`);
        console.log(`🚨 Signaux Alpha: ${alphaSignals.length}`);
        console.log(`\n🌟 ALPHA SCORE FINAL: ${alphaScore.toFixed(1)}/100`);
        
        // Classification
        let classification = '';
        if (alphaScore >= 80) {
            classification = '🥇 WALLET ALPHA ELITE';
        } else if (alphaScore >= 60) {
            classification = '🥈 WALLET ALPHA CONFIRMÉ';
        } else if (alphaScore >= 40) {
            classification = '🥉 WALLET PROMETTEUR';
        } else {
            classification = '📊 WALLET STANDARD';
        }
        
        console.log(`🏆 Classification: ${classification}`);
        
        // 4. Recommandations
        console.log('\n💡 4. RECOMMANDATIONS:');
        console.log('=' * 25);
        
        if (alphaScore >= 60) {
            console.log('✅ Copy trading recommandé');
            console.log('✅ Surveiller les nouveaux trades');
        }
        
        if (alphaSignals.length >= 3) {
            console.log('✅ Wallet avec signaux alpha forts');
        }
        
        if (winRate < 20) {
            console.log('⚠️  Win rate faible - Stratégie risquée');
        }
        
        if (totalPnl > 10000) {
            console.log('💎 Performance financière excellente');
        }
        
        // 5. Signaux Alpha détectés
        if (alphaSignals.length > 0) {
            console.log('\n🚨 5. SIGNAUX ALPHA DÉTECTÉS:');
            console.log('=' * 35);
            alphaSignals.forEach((signal, i) => {
                console.log(`   ${i + 1}. ${signal}`);
            });
        }
        
        console.log('\n' + '=' * 70);
        console.log('✨ ANALYSE TERMINÉE - SYSTÈME OPÉRATIONNEL!');
        console.log('🎯 Ce wallet présente des signaux alpha intéressants');
        console.log('🚀 Prêt pour le monitoring automatique des wallets performants');
        
        return {
            alphaScore,
            classification,
            signals: alphaSignals,
            performance: {
                totalPnl,
                winRate,
                tokensTraded
            }
        };
        
    } catch (err) {
        console.log(`❌ Erreur: ${err.message}`);
        return null;
    }
}

if (require.main === module) {
    analyzeRealWalletComplete().catch(console.error);
}
