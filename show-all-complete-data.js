#!/usr/bin/env node

/**
 * Script pour visualiser TOUTES les données de l'API Complete Analysis
 */

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function runCompleteAnalysisAndShowAllData() {
    console.log('🔍 ANALYSE COMPLÈTE AVEC TOUTES LES DONNÉES');
    console.log('='.repeat(60));
    
    const walletAddress = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    
    try {
        // 1. Démarrer l'analyse
        console.log('🚀 Démarrage de l\'analyse complète...');
        
        const startResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/complete/${walletAddress}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!startResponse.ok) {
            throw new Error(`Start failed: ${await startResponse.text()}`);
        }
        
        const jobData = await startResponse.json();
        const jobId = jobData.job_id;
        
        console.log(`✅ Job créé: ${jobId}\n`);
        
        // 2. Attendre la fin
        let attempts = 0;
        let jobCompleted = false;
        let results = null;
        
        while (attempts < 30 && !jobCompleted) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-analyzer/status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (statusResponse.ok) {
                const job = await statusResponse.json();
                
                if (job.status === 'completed') {
                    results = job.results;
                    jobCompleted = true;
                } else if (job.status === 'failed') {
                    throw new Error(job.error_message);
                } else {
                    console.log(`⏳ Progrès: ${job.progress_percentage}% - ${job.current_step}`);
                }
            }
            
            attempts++;
        }
        
        if (!jobCompleted) {
            throw new Error('Timeout - analyse trop longue');
        }
        
        // 3. Afficher TOUTES les données
        console.log('\n' + '='.repeat(60));
        console.log('📊 TOUTES LES DONNÉES DE L\'ANALYSE COMPLÈTE');
        console.log('='.repeat(60));
        
        displayCompleteResults(results);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

function displayCompleteResults(results) {
    const data = results.data;
    
    // 1. RÉSUMÉ GÉNÉRAL
    console.log('\n🎯 RÉSUMÉ GÉNÉRAL');
    console.log('-'.repeat(40));
    console.log(`Wallet: ${results.wallet_address}`);
    console.log(`Type d'analyse: ${results.analysis_type}`);
    console.log(`Généré le: ${results.generated_at}`);
    
    // 2. HISTORIQUE DES TRANSACTIONS
    if (data.transaction_summary) {
        console.log('\n📈 HISTORIQUE DES TRANSACTIONS');
        console.log('-'.repeat(40));
        const summary = data.transaction_summary;
        console.log(`Total transactions: ${summary.total_transactions}`);
        console.log(`Transactions d'achat: ${summary.buy_transactions}`);
        console.log(`Transactions de vente: ${summary.sell_transactions}`);
        console.log(`Première transaction: ${new Date(summary.first_transaction).toLocaleDateString()}`);
        console.log(`Dernière transaction: ${new Date(summary.last_transaction).toLocaleDateString()}`);
        
        if (data.transaction_history && data.transaction_history.length > 0) {
            console.log('\n📝 Échantillon de transactions:');
            data.transaction_history.slice(0, 5).forEach((tx, i) => {
                console.log(`  ${i+1}. ${tx.type.toUpperCase()} - ${tx.signature} - ${new Date(tx.timestamp).toLocaleDateString()}`);
            });
        }
    }
    
    // 3. ANALYSE DES TRADES
    if (data.trade_analysis) {
        console.log('\n💹 ANALYSE DÉTAILLÉE DES TRADES');
        console.log('-'.repeat(40));
        const trades = data.trade_analysis;
        console.log(`Total trades: ${trades.total_trades}`);
        console.log(`Trades profitables: ${trades.profitable_trades} (${((trades.profitable_trades/trades.total_trades)*100).toFixed(1)}%)`);
        console.log(`Trades perdants: ${trades.losing_trades} (${((trades.losing_trades/trades.total_trades)*100).toFixed(1)}%)`);
        console.log(`PnL total: $${trades.total_pnl?.toFixed(2) || 'N/A'}`);
        console.log(`Volume total tradé: $${trades.total_volume_traded?.toFixed(2) || 'N/A'}`);
        console.log(`Profit moyen par trade: $${trades.average_profit_per_trade?.toFixed(2) || 'N/A'}`);
        console.log(`Tokens uniques tradés: ${trades.unique_tokens_traded || 'N/A'}`);
        console.log(`Durée moyenne de hold: ${(trades.average_hold_duration/60)?.toFixed(1) || 'N/A'} heures`);
        
        if (trades.best_trade) {
            console.log(`\n🏆 Meilleur trade:`);
            console.log(`  Token: ${trades.best_trade.token_symbol}`);
            console.log(`  PnL: $${trades.best_trade.pnl_usd?.toFixed(2)}`);
            console.log(`  ROI: ${trades.best_trade.roi_percentage?.toFixed(1)}%`);
        }
        
        if (trades.worst_trade) {
            console.log(`\n💸 Pire trade:`);
            console.log(`  Token: ${trades.worst_trade.token_symbol}`);
            console.log(`  PnL: $${trades.worst_trade.pnl_usd?.toFixed(2)}`);
            console.log(`  ROI: ${trades.worst_trade.roi_percentage?.toFixed(1)}%`);
        }
        
        if (trades.trading_patterns) {
            console.log(`\n📊 Patterns de trading:`);
            console.log(`  DEX le plus utilisé: ${trades.trading_patterns.most_used_dex}`);
            console.log(`  Slippage moyen: ${trades.trading_patterns.average_slippage?.toFixed(2)}%`);
            console.log(`  Frais de gas total: ${trades.trading_patterns.total_gas_fees?.toFixed(4)} SOL`);
            console.log(`  Score de timing alpha: ${trades.trading_patterns.alpha_timing_score?.toFixed(1)}/10`);
        }
    }
    
    // 4. ANALYSE DES TOKENS
    if (data.token_analysis) {
        console.log('\n💎 ANALYSE DES TOKENS');
        console.log('-'.repeat(40));
        const tokens = data.token_analysis;
        console.log(`Total tokens analysés: ${tokens.total_tokens_analyzed}`);
        console.log(`Tokens actuellement détenus: ${tokens.currently_holding}`);
        console.log(`Tokens profitables: ${tokens.profitable_tokens}`);
        console.log(`Tokens perdants: ${tokens.losing_tokens}`);
        console.log(`Tokens avec signaux alpha: ${tokens.tokens_with_alpha_signals}`);
        console.log(`Recommandations haute confiance: ${tokens.high_confidence_recommendations}`);
        
        if (tokens.best_performing_token) {
            console.log(`\n🌟 Meilleur token:`);
            console.log(`  Symbol: ${tokens.best_performing_token.token_symbol}`);
            console.log(`  ROI: ${tokens.best_performing_token.roi_percentage?.toFixed(1)}%`);
            console.log(`  PnL total: $${tokens.best_performing_token.total_pnl?.toFixed(2)}`);
            console.log(`  Signaux alpha: ${tokens.best_performing_token.alpha_signals?.join(', ') || 'Aucun'}`);
        }
        
        if (tokens.detailed_tokens && tokens.detailed_tokens.length > 0) {
            console.log(`\n📝 Top 5 tokens détaillés:`);
            tokens.detailed_tokens.slice(0, 5).forEach((token, i) => {
                console.log(`\n  ${i+1}. ${token.token_symbol}:`);
                console.log(`     Market Cap: $${token.market_cap?.toLocaleString() || 'N/A'}`);
                console.log(`     Volume 24h: $${token.volume_24h?.toLocaleString() || 'N/A'}`);
                console.log(`     Holders: ${token.holders_count?.toLocaleString() || 'N/A'}`);
                console.log(`     ROI: ${token.roi_percentage?.toFixed(1) || 'N/A'}%`);
                console.log(`     PnL: $${token.total_pnl?.toFixed(2) || 'N/A'}`);
                console.log(`     Trades: ${token.number_of_trades || 'N/A'}`);
                console.log(`     Risque: ${token.risk_level || 'N/A'}`);
                console.log(`     Recommandation: ${token.current_recommendation || 'N/A'}`);
                console.log(`     Signaux alpha: ${token.alpha_signals?.join(', ') || 'Aucun'}`);
            });
        }
    }
    
    // 5. MÉTRIQUES AVANCÉES
    if (data.advanced_metrics) {
        console.log('\n📊 MÉTRIQUES FINANCIÈRES AVANCÉES');
        console.log('-'.repeat(40));
        const metrics = data.advanced_metrics;
        console.log(`Win Rate: ${metrics.win_rate?.toFixed(1)}%`);
        console.log(`Profit Factor: ${metrics.profit_factor?.toFixed(2)}`);
        console.log(`Sharpe Ratio: ${metrics.sharpe_ratio?.toFixed(2)}`);
        console.log(`Max Drawdown: ${metrics.max_drawdown?.toFixed(1)}%`);
        console.log(`Volatilité: ${metrics.volatility?.toFixed(1)}%`);
        console.log(`VaR 95%: $${metrics.value_at_risk_95?.toFixed(2)}`);
        console.log(`Ratio de Sortino: ${metrics.sortino_ratio?.toFixed(2)}`);
        console.log(`Beta vs marché: ${metrics.beta_to_market?.toFixed(2)}`);
        console.log(`Alpha généré: ${metrics.alpha_generation?.toFixed(1)}%`);
        
        console.log(`\n🔥 Streaks:`);
        console.log(`  Victoires consécutives: ${metrics.consecutive_wins}`);
        console.log(`  Défaites consécutives: ${metrics.consecutive_losses}`);
        console.log(`  Plus longue série de gains: ${metrics.longest_winning_streak}`);
        console.log(`  Plus longue série de pertes: ${metrics.longest_losing_streak}`);
        
        console.log(`\n⏱️ Métriques temporelles:`);
        console.log(`  Fréquence de trading: ${metrics.trading_frequency_per_day?.toFixed(1)} trades/jour`);
        console.log(`  Temps en marché: ${metrics.time_in_market_percentage?.toFixed(1)}%`);
        console.log(`  Durée moyenne position: ${metrics.average_position_duration_hours?.toFixed(1)} heures`);
    }
    
    // 6. ANALYSE ALPHA COMPLÈTE
    if (data.alpha_analysis) {
        console.log('\n🏆 ANALYSE ALPHA DÉTAILLÉE');
        console.log('-'.repeat(40));
        const alpha = data.alpha_analysis;
        console.log(`Score Alpha: ${alpha.alpha_score?.toFixed(1)}/10`);
        console.log(`Catégorie: ${alpha.alpha_category}`);
        console.log(`Confiance: ${alpha.alpha_confidence}%`);
        console.log(`Capacité de détection: ${alpha.early_detection_ability}`);
        console.log(`Force du signal: ${alpha.signal_strength}/100`);
        
        console.log(`\n📊 Scores spécialisés:`);
        console.log(`  Timing d'entrée: ${alpha.entry_timing_score}/10`);
        console.log(`  Timing de sortie: ${alpha.exit_timing_score}/10`);
        console.log(`  Gestion du risque: ${alpha.risk_management_score}/10`);
        console.log(`  Consistance: ${alpha.consistency_score}/10`);
        
        if (alpha.trading_psychology) {
            console.log(`\n🧠 Psychologie de trading:`);
            console.log(`  Contrôle émotionnel: ${alpha.trading_psychology.emotional_control}/10`);
            console.log(`  Patience: ${alpha.trading_psychology.patience_score}/10`);
            console.log(`  Discipline: ${alpha.trading_psychology.discipline_rating}/10`);
            console.log(`  Résistance FOMO: ${alpha.trading_psychology.fomo_resistance}/10`);
        }
        
        if (alpha.alpha_patterns) {
            console.log(`\n🔍 Patterns alpha détectés:`);
            alpha.alpha_patterns.forEach(pattern => {
                console.log(`  • ${pattern.replace(/_/g, ' ')}`);
            });
        }
        
        if (alpha.market_performance) {
            console.log(`\n📈 Performance par conditions de marché:`);
            console.log(`  Marché haussier: +${alpha.market_performance.bull_market_alpha?.toFixed(1)}%`);
            console.log(`  Marché baissier: +${alpha.market_performance.bear_market_alpha?.toFixed(1)}%`);
            console.log(`  Marché latéral: +${alpha.market_performance.sideways_market_alpha?.toFixed(1)}%`);
            console.log(`  Haute volatilité: +${alpha.market_performance.high_volatility_performance?.toFixed(1)}%`);
            console.log(`  Faible volatilité: +${alpha.market_performance.low_volatility_performance?.toFixed(1)}%`);
        }
        
        console.log(`\n🎯 Recommandations copy-trading:`);
        console.log(`  Adapté au copy-trading: ${alpha.copy_trading_suitability}`);
        console.log(`  % optimal de copie: ${alpha.optimal_copy_percentage}%`);
        console.log(`  Tolérance au risque requise: ${alpha.risk_tolerance_required}`);
    }
    
    // 7. RECOMMANDATIONS DE COPY-TRADING
    if (data.copy_trading_recommendations) {
        console.log('\n🤖 RECOMMANDATIONS DE COPY-TRADING');
        console.log('-'.repeat(40));
        const reco = data.copy_trading_recommendations;
        console.log(`Recommandation globale: ${reco.overall_recommendation}`);
        
        if (reco.copy_settings) {
            console.log(`\n⚙️ Paramètres recommandés:`);
            console.log(`  % de copie: ${reco.copy_settings.recommended_copy_percentage}%`);
            console.log(`  Taille max position: $${reco.copy_settings.max_position_size?.toLocaleString()}`);
            console.log(`  Stop loss: ${reco.copy_settings.stop_loss_percentage}%`);
            console.log(`  Take profit: ${reco.copy_settings.take_profit_percentage}%`);
        }
        
        if (reco.tokens_to_follow && reco.tokens_to_follow.length > 0) {
            console.log(`\n👀 Tokens à suivre:`);
            reco.tokens_to_follow.forEach(token => {
                console.log(`  • ${token.symbol} (${token.confidence}% confiance) - ${token.reason}`);
            });
        }
        
        if (reco.tokens_to_avoid && reco.tokens_to_avoid.length > 0) {
            console.log(`\n🚫 Tokens à éviter:`);
            reco.tokens_to_avoid.forEach(token => {
                console.log(`  • ${token.symbol} - ${token.reason}`);
            });
        }
        
        if (reco.risk_management) {
            console.log(`\n⚠️ Gestion du risque:`);
            console.log(`  Allocation max portfolio: ${reco.risk_management.max_portfolio_allocation}`);
            console.log(`  Diversification nécessaire: ${reco.risk_management.diversification_needed ? 'Oui' : 'Non'}`);
            console.log(`  Fréquence de monitoring: ${reco.risk_management.monitoring_frequency || 'N/A'}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ANALYSE COMPLÈTE TERMINÉE');
    console.log('🎯 Ce wallet contient maintenant TOUTES les données nécessaires');
    console.log('   pour une analyse professionnelle de wallet alpha !');
    console.log('='.repeat(60));
}

if (require.main === module) {
    runCompleteAnalysisAndShowAllData();
}

module.exports = { runCompleteAnalysisAndShowAllData };
