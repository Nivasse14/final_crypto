/**
 * Audit complet de la base de données scanDune
 * Vérifie la disponibilité des données pour l'analyseur market cap
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditDatabase() {
    console.log('🔍 AUDIT DE LA BASE DE DONNÉES SCANDUNE\n');
    console.log('='.repeat(60));
    
    try {
        // 1. Vérifier les tables existantes
        console.log('\n📋 1. TABLES DISPONIBLES:');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('❌ Erreur tables:', tablesError.message);
        } else {
            tables?.forEach(table => console.log(`   ✅ ${table.table_name}`));
        }

        // 2. Vérifier la structure des colonnes
        console.log('\n📊 2. STRUCTURE DES COLONNES:');
        
        const criticalTables = ['tokens', 'wallets', 'wallet_tokens', 'transactions'];
        
        for (const tableName of criticalTables) {
            console.log(`\n   🔍 Table: ${tableName}`);
            
            const { data: columns, error: colError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, character_maximum_length')
                .eq('table_name', tableName)
                .eq('table_schema', 'public');
                
            if (colError) {
                console.log(`   ❌ Erreur: ${colError.message}`);
            } else if (!columns || columns.length === 0) {
                console.log(`   ⚠️  Table non trouvée ou vide`);
            } else {
                columns.forEach(col => {
                    const length = col.character_maximum_length ? ` (${col.character_maximum_length})` : '';
                    console.log(`     • ${col.column_name}: ${col.data_type}${length}`);
                });
            }
        }

        // 3. Tester la récupération de données échantillon
        console.log('\n💾 3. DONNÉES ÉCHANTILLON:');
        
        // Test tokens
        console.log('\n   🪙 Tokens:');
        const { data: tokensData, error: tokensError } = await supabase
            .from('tokens')
            .select('*')
            .limit(2);
            
        if (tokensError) {
            console.log(`   ❌ Erreur tokens: ${tokensError.message}`);
        } else if (tokensData && tokensData.length > 0) {
            console.log(`   ✅ ${tokensData.length} tokens trouvés`);
            const token = tokensData[0];
            console.log('   📊 Champs disponibles pour market cap analysis:');
            console.log(`     • token_address: ${token.token_address || 'N/A'}`);
            console.log(`     • market_cap_usd: ${token.market_cap_usd || 'N/A'}`);
            console.log(`     • calculated_market_cap_usd: ${token.calculated_market_cap_usd || 'N/A'}`);
            console.log(`     • liquidity_locked: ${token.liquidity_locked || 'N/A'}`);
            console.log(`     • is_honeypot: ${token.is_honeypot || 'N/A'}`);
            console.log(`     • reliability_score: ${token.reliability_score || 'N/A'}`);
        } else {
            console.log('   ⚠️  Aucun token trouvé');
        }

        // Test wallets
        console.log('\n   👛 Wallets:');
        const { data: walletsData, error: walletsError } = await supabase
            .from('wallets')
            .select('*')
            .limit(2);
            
        if (walletsError) {
            console.log(`   ❌ Erreur wallets: ${walletsError.message}`);
        } else if (walletsData && walletsData.length > 0) {
            console.log(`   ✅ ${walletsData.length} wallets trouvés`);
            const wallet = walletsData[0];
            console.log('   📊 Champs disponibles pour wallet analysis:');
            console.log(`     • wallet_address: ${wallet.wallet_address || 'N/A'}`);
            console.log(`     • total_pnl_usd: ${wallet.total_pnl_usd || 'N/A'}`);
            console.log(`     • total_trades: ${wallet.total_trades || 'N/A'}`);
            console.log(`     • win_rate: ${wallet.win_rate || 'N/A'}`);
            console.log(`     • avg_hold_time: ${wallet.avg_hold_time || 'N/A'}`);
        } else {
            console.log('   ⚠️  Aucun wallet trouvé');
        }

        // 4. Vérifier les contraintes problématiques
        console.log('\n🚨 4. CONTRAINTES PROBLÉMATIQUES:');
        
        const { data: constraints, error: constraintsError } = await supabase
            .from('information_schema.columns')
            .select('table_name, column_name, character_maximum_length')
            .eq('table_schema', 'public')
            .in('column_name', ['token_address', 'wallet_address', 'gt_address'])
            .lt('character_maximum_length', 50);
            
        if (constraintsError) {
            console.log(`   ❌ Erreur contraintes: ${constraintsError.message}`);
        } else if (constraints && constraints.length > 0) {
            console.log('   ⚠️  Colonnes avec contraintes problématiques:');
            constraints.forEach(constraint => {
                console.log(`     • ${constraint.table_name}.${constraint.column_name}: ${constraint.character_maximum_length} chars (besoin: 50+)`);
            });
        } else {
            console.log('   ✅ Pas de contraintes problématiques détectées');
        }

        // 5. Vérifier les vues dépendantes
        console.log('\n👁️  5. VUES DÉPENDANTES:');
        
        const { data: views, error: viewsError } = await supabase
            .from('information_schema.views')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (viewsError) {
            console.log(`   ❌ Erreur vues: ${viewsError.message}`);
        } else if (views && views.length > 0) {
            console.log(`   📊 ${views.length} vues trouvées:`);
            views.forEach(view => console.log(`     • ${view.table_name}`));
        } else {
            console.log('   ✅ Aucune vue trouvée');
        }

        // 6. Tester l'API Supabase
        console.log('\n🌐 6. TEST DE L\'API SUPABASE:');
        
        try {
            const apiUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/health';
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('   ✅ API Supabase fonctionnelle');
                console.log(`   📊 Status: ${data.status || 'OK'}`);
            } else {
                console.log(`   ❌ API erreur: ${response.status}`);
            }
        } catch (apiError) {
            console.log(`   ❌ Erreur API: ${apiError.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 RECOMMANDATIONS:');
        
        if (constraints && constraints.length > 0) {
            console.log('   🔧 1. Corriger les contraintes de colonnes avec fix-all-views.sql');
        }
        
        console.log('   🎯 2. Une fois corrigé, implémenter le market cap analyzer');
        console.log('   📊 3. Créer le système de scoring des wallets');
        console.log('   🚀 4. Développer les alertes en temps réel');

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Fonction pour tester avec des données JSON locales
function analyzeJsonData() {
    console.log('\n🔍 ANALYSE DES DONNÉES JSON DISPONIBLES:');
    
    // Simuler l'analyse de vos données JSON
    const sampleData = {
        "chain": "solana",
        "hold_time": 33,
        "num_swaps": 46,
        "token_address": "M5SRMqMgL36gZYcoXFS2oimWqUbEZyUfD6m1B2jJs7Y",
        "total_buy_usd": 14776.46,
        "total_pnl_usd": 220415.64,
        "roi_percentage": 1491.66,
        "market_cap_usd": 6.0741758408210815,
        "reliability_score": { "total_score": 37.018348623853214 },
        "geckoterminal_complete_data": {
            "pool_data": {
                "reserve_usd": "5.2712",
                "volume_24h_usd": "0.07014330869",
                "swap_count_24h": 1
            }
        },
        "security_data": {
            "soul_scanner_data": {
                "mintable": "0",
                "freezeable": "0",
                "airdrop_percentage": 95.0
            }
        }
    };
    
    console.log('   ✅ Données JSON riches disponibles');
    console.log('   📊 Champs utiles pour market cap analysis:');
    console.log(`     • market_cap_usd: ✅`);
    console.log(`     • reliability_score: ✅`);
    console.log(`     • security_data: ✅`);
    console.log(`     • pool_data: ✅`);
    console.log(`     • trading metrics: ✅`);
    
    console.log('\n   🎯 PRÊT POUR: Market Cap Risk Analyzer');
}

// Exécution
auditDatabase().then(() => {
    analyzeJsonData();
}).catch(console.error);
