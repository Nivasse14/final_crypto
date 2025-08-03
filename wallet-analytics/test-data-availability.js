/**
 * Test de disponibilité des données pour l'analyse Market Cap
 * Vérifie quelles données sont présentes en base de données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const MarketCapRiskAnalyzer = require('./market-cap-risk-analyzer');

class DataAvailabilityTester {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        this.analyzer = new MarketCapRiskAnalyzer();
    }

    /**
     * Teste la disponibilité des données de market cap
     */
    async testDataAvailability() {
        console.log('🔍 Test de disponibilité des données Market Cap...\n');

        try {
            // 1. Vérifier les tables disponibles
            await this.checkDatabaseTables();
            
            // 2. Analyser quelques échantillons de données
            await this.analyzeSampleData();
            
            // 3. Tester l'analyseur avec des données réelles
            await this.testAnalyzerWithRealData();

        } catch (error) {
            console.error('❌ Erreur lors du test:', error.message);
        }
    }

    /**
     * Vérifie quelles tables existent en base
     */
    async checkDatabaseTables() {
        console.log('📊 Vérification des tables de la base de données:\n');

        const tables = [
            'wallet_registry',
            'wallet_tokens', 
            'token_enrichment_data',
            'wallets_extended'
        ];

        for (const table of tables) {
            try {
                const { data, error, count } = await this.supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.log(`❌ ${table}: N'existe pas (${error.message})`);
                } else {
                    console.log(`✅ ${table}: ${count} enregistrements`);
                }
            } catch (err) {
                console.log(`❌ ${table}: Erreur d'accès`);
            }
        }
        console.log('');
    }

    /**
     * Analyse un échantillon de données
     */
    async analyzeSampleData() {
        console.log('🔬 Analyse d\'échantillon de données:\n');

        // Tester wallet_tokens avec enrichissement
        await this.analyzeWalletTokens();
        
        // Tester wallets_extended
        await this.analyzeWalletsExtended();
    }

    /**
     * Analyse les données de wallet_tokens
     */
    async analyzeWalletTokens() {
        try {
            const { data: tokens, error } = await this.supabase
                .from('wallet_tokens')
                .select(`
                    wallet_address,
                    token_address,
                    token_symbol,
                    total_usd_value,
                    portfolio_weight_pct,
                    gt_market_cap_usd,
                    gt_calculated_market_cap_usd,
                    gt_score,
                    gt_reliability_total_score,
                    gt_security_holder_count,
                    gt_pool_volume_24h_usd,
                    gt_pool_liquidity_usd
                `)
                .limit(5);

            if (error) {
                console.log('❌ wallet_tokens: Pas accessible');
                return;
            }

            console.log('📈 wallet_tokens - Échantillon:');
            console.log(`   Nombre de tokens: ${tokens.length}`);
            
            if (tokens.length > 0) {
                const sample = tokens[0];
                console.log('   Colonnes disponibles:');
                console.log(`   - market_cap_usd: ${sample.gt_market_cap_usd || 'N/A'}`);
                console.log(`   - calculated_market_cap_usd: ${sample.gt_calculated_market_cap_usd || 'N/A'}`);
                console.log(`   - gt_score: ${sample.gt_score || 'N/A'}`);
                console.log(`   - reliability_score: ${sample.gt_reliability_total_score || 'N/A'}`);
                console.log(`   - holder_count: ${sample.gt_security_holder_count || 'N/A'}`);
                console.log(`   - volume_24h: ${sample.gt_pool_volume_24h_usd || 'N/A'}`);
                console.log(`   - liquidity: ${sample.gt_pool_liquidity_usd || 'N/A'}`);
            }
            console.log('');

        } catch (error) {
            console.log('❌ Erreur wallet_tokens:', error.message);
        }
    }

    /**
     * Analyse les données de wallets_extended
     */
    async analyzeWalletsExtended() {
        try {
            const { data: wallets, error } = await this.supabase
                .from('wallets_extended')
                .select(`
                    wallet_address,
                    total_value_usd,
                    total_pnl,
                    performance_score,
                    win_rate,
                    token_count,
                    avg_token_market_cap,
                    avg_reliability_score,
                    top_5_tokens_concentration_pct
                `)
                .limit(5);

            if (error) {
                console.log('❌ wallets_extended: Pas accessible');
                return;
            }

            console.log('👛 wallets_extended - Échantillon:');
            console.log(`   Nombre de wallets: ${wallets.length}`);
            
            if (wallets.length > 0) {
                const sample = wallets[0];
                console.log('   Métriques disponibles:');
                console.log(`   - total_value_usd: $${sample.total_value_usd?.toLocaleString() || 'N/A'}`);
                console.log(`   - performance_score: ${sample.performance_score || 'N/A'}`);
                console.log(`   - win_rate: ${sample.win_rate || 'N/A'}%`);
                console.log(`   - token_count: ${sample.token_count || 'N/A'}`);
                console.log(`   - avg_market_cap: $${sample.avg_token_market_cap?.toLocaleString() || 'N/A'}`);
                console.log(`   - avg_reliability: ${sample.avg_reliability_score || 'N/A'}`);
            }
            console.log('');

        } catch (error) {
            console.log('❌ Erreur wallets_extended:', error.message);
        }
    }

    /**
     * Teste l'analyseur avec des données réelles
     */
    async testAnalyzerWithRealData() {
        console.log('🧪 Test de l\'analyseur avec données réelles:\n');

        try {
            // Récupérer quelques tokens avec market cap
            const { data: tokens, error } = await this.supabase
                .from('wallet_tokens')
                .select(`
                    token_address,
                    token_symbol,
                    wallet_address,
                    gt_market_cap_usd,
                    gt_calculated_market_cap_usd,
                    gt_score,
                    gt_reliability_total_score,
                    gt_security_holder_count,
                    gt_pool_volume_24h_usd,
                    gt_pool_liquidity_usd,
                    gt_security_mintable,
                    gt_security_freezeable
                `)
                .not('gt_market_cap_usd', 'is', null)
                .limit(3);

            if (error || !tokens.length) {
                console.log('❌ Pas de données de market cap disponibles pour le test');
                return;
            }

            console.log('🎯 Tests avec données réelles:');
            
            for (const token of tokens) {
                console.log(`\n--- ${token.token_symbol} (${token.token_address}) ---`);
                
                // Simuler les données dans le format attendu
                const tokenData = {
                    market_cap_usd: token.gt_market_cap_usd,
                    calculated_market_cap_usd: token.gt_calculated_market_cap_usd,
                    reliability_score: {
                        total_score: token.gt_reliability_total_score || 0
                    },
                    geckoterminal_complete_data: {
                        pool_data: {
                            reserve_usd: token.gt_pool_liquidity_usd || 0,
                            volume_24h_usd: token.gt_pool_volume_24h_usd || 0,
                            swap_count_24h: 100, // Valeur par défaut
                            gt_score: token.gt_score || 0,
                            security_indicators: []
                        }
                    },
                    security_data: {
                        holder_count: token.gt_security_holder_count || 0,
                        soul_scanner_data: {
                            mintable: token.gt_security_mintable ? "1" : "0",
                            freezeable: token.gt_security_freezeable ? "1" : "0",
                            airdrop_percentage: 0
                        }
                    },
                    liquidity_locked: {
                        locked_percent: 100
                    },
                    is_honeypot: false
                };

                // Analyser le risque
                const riskAnalysis = this.analyzer.analyzeRisk(tokenData);
                
                console.log(`   Market Cap: $${tokenData.market_cap_usd?.toLocaleString()}`);
                console.log(`   Risk Tier: ${riskAnalysis.risk_tier.tier} (${riskAnalysis.risk_tier.risk_level})`);
                console.log(`   Overall Score: ${riskAnalysis.overall_risk_score.score.toFixed(1)} (${riskAnalysis.overall_risk_score.grade})`);
                console.log(`   Position Rec: Max ${riskAnalysis.position_recommendation.max_position_percent}%`);
                console.log(`   Exit Strategy: ${riskAnalysis.exit_strategy.strategy}`);
            }

        } catch (error) {
            console.log('❌ Erreur test analyseur:', error.message);
        }
    }

    /**
     * Génère un rapport de compatibilité
     */
    async generateCompatibilityReport() {
        console.log('\n📋 RAPPORT DE COMPATIBILITÉ\n');
        console.log('='.repeat(50));
        
        console.log('\n✅ DONNÉES DISPONIBLES:');
        console.log('   - Market cap (gt_market_cap_usd)');
        console.log('   - Calculated market cap (gt_calculated_market_cap_usd)');
        console.log('   - GT Score (gt_score)');
        console.log('   - Reliability score (gt_reliability_total_score)');
        console.log('   - Holder count (gt_security_holder_count)');
        console.log('   - Volume 24h (gt_pool_volume_24h_usd)');
        console.log('   - Liquidity (gt_pool_liquidity_usd)');
        
        console.log('\n⚠️  ADAPTATIONS NÉCESSAIRES:');
        console.log('   - Adapter les noms de colonnes dans l\'analyseur');
        console.log('   - Ajouter la gestion des valeurs nulles');
        console.log('   - Créer un mapping pour les données GeckoTerminal');
        
        console.log('\n🚀 PROCHAINES ÉTAPES:');
        console.log('   1. Adapter l\'analyseur aux noms de colonnes réels');
        console.log('   2. Créer un wrapper pour les données de la DB');
        console.log('   3. Tester sur un échantillon plus large');
        console.log('   4. Intégrer dans le pipeline principal');
    }
}

// Exécution du test
async function runTest() {
    const tester = new DataAvailabilityTester();
    await tester.testDataAvailability();
    await tester.generateCompatibilityReport();
}

if (require.main === module) {
    runTest();
}

module.exports = DataAvailabilityTester;
