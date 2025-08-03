#!/usr/bin/env node

/**
 * Vérification complète du schéma de base de données
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseSchema() {
    console.log('🔍 VÉRIFICATION COMPLÈTE DU SCHÉMA\n');
    console.log('=' * 50);
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Colonnes attendues pour wallet_registry
    const expectedWalletRegistryColumns = [
        'id', 'wallet_address', 'total_pnl_usd', 'total_bought_usd', 
        'roi', 'winrate', 'tokens_traded', 'wins', 'losses', 'trade_count',
        'last_trade_date', 'source', 'status', 'created_at', 'updated_at',
        'processing_attempts', 'last_processed_at', 'metadata'
    ];
    
    // Colonnes attendues pour wallet_tokens
    const expectedWalletTokensColumns = [
        'id', 'wallet_address', 'token_address', 'token_symbol', 'token_name',
        'chain', 'hold_time', 'num_swaps', 'chart_link', 'last_trade', 'first_trade',
        'is_honeypot', 'total_buy_usd', 'total_pnl_usd', 'holding_amount',
        'roi_percentage', 'total_sell_usd', 'token_price_usd', 'total_buy_amount',
        'average_buy_price', 'total_sell_amount', 'average_sell_price',
        'holding_amount_usd', 'unrealized_pnl_usd', 'geckoterminal_enriched',
        'unrealized_roi_percentage', 'market_cap_usd', 'calculated_market_cap_usd',
        'circulating_supply', 'reliability_score', 'liquidity_locked_percent',
        'security_data', 'geckoterminal_complete_data', 'raw_pnl_history',
        'created_at', 'updated_at'
    ];
    
    console.log('📋 TEST 1: Vérification wallet_registry...');
    try {
        // Test chaque colonne attendue
        const testQuery = expectedWalletRegistryColumns.join(', ');
        const { data, error } = await supabase
            .from('wallet_registry')
            .select(testQuery)
            .limit(1);
            
        if (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            
            // Identifier les colonnes manquantes
            const missingColumns = [];
            for (const col of expectedWalletRegistryColumns) {
                if (error.message.includes(col)) {
                    missingColumns.push(col);
                }
            }
            
            if (missingColumns.length > 0) {
                console.log(`   🔍 Colonnes manquantes: ${missingColumns.join(', ')}`);
            }
        } else {
            console.log('   ✅ wallet_registry : toutes les colonnes présentes!');
        }
    } catch (err) {
        console.log(`   ❌ Erreur test: ${err.message}`);
    }
    
    console.log('\n📋 TEST 2: Vérification wallet_tokens...');
    try {
        // Test chaque colonne attendue
        const testQuery = expectedWalletTokensColumns.join(', ');
        const { data, error } = await supabase
            .from('wallet_tokens')
            .select(testQuery)
            .limit(1);
            
        if (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            
            // Identifier les colonnes manquantes
            const missingColumns = [];
            for (const col of expectedWalletTokensColumns) {
                if (error.message.includes(col)) {
                    missingColumns.push(col);
                }
            }
            
            if (missingColumns.length > 0) {
                console.log(`   🔍 Colonnes manquantes: ${missingColumns.join(', ')}`);
            }
        } else {
            console.log('   ✅ wallet_tokens : toutes les colonnes présentes!');
        }
    } catch (err) {
        console.log(`   ❌ Erreur test: ${err.message}`);
    }
    
    console.log('\n📋 TEST 3: Test des colonnes critiques...');
    
    // Test spécifique des colonnes problématiques
    const criticalTests = [
        { table: 'wallet_registry', column: 'roi' },
        { table: 'wallet_registry', column: 'metadata' },
        { table: 'wallet_tokens', column: 'chain' },
        { table: 'wallet_tokens', column: 'market_cap_usd' },
        { table: 'wallet_tokens', column: 'roi_percentage' },
        { table: 'wallet_tokens', column: 'calculated_market_cap_usd' }
    ];
    
    for (const test of criticalTests) {
        try {
            const { data, error } = await supabase
                .from(test.table)
                .select(test.column)
                .limit(1);
                
            if (error) {
                console.log(`   ❌ ${test.table}.${test.column} : manquante`);
            } else {
                console.log(`   ✅ ${test.table}.${test.column} : présente`);
            }
        } catch (err) {
            console.log(`   ❌ ${test.table}.${test.column} : erreur`);
        }
    }
    
    console.log('\n' + '=' * 50);
    console.log('📋 ACTIONS RECOMMANDÉES:\n');
    
    console.log('Si des colonnes sont manquantes:');
    console.log('1. Exécutez fix-schema-complete.sql dans Supabase SQL Editor');
    console.log('2. Relancez: node check-schema.js');
    console.log('3. Puis testez: node test-database-save.js\n');
    
    console.log('Si toutes les colonnes sont présentes:');
    console.log('1. Lancez: node test-database-save.js');
    console.log('2. Puis: node test-complete-system.js');
    
    console.log('\n🎯 Objectif: Toutes les colonnes doivent être ✅ pour que le système fonctionne!');
}

if (require.main === module) {
    checkDatabaseSchema().catch(console.error);
}
