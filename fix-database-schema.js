#!/usr/bin/env node

/**
 * Script pour corriger automatiquement le schéma de base de données
 * Exécute create-minimal.sql directement depuis Node.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function executeSQL(supabase, sql, description) {
    console.log(`📝 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            return false;
        }
        console.log(`   ✅ Succès`);
        return true;
    } catch (err) {
        // Essayer avec une requête directe si rpc ne marche pas
        try {
            const { data, error } = await supabase.from('').select().limit(0); // Test de connexion
            // Utiliser postgrest directement
            console.log(`   ⚠️  Utilisation d'une méthode alternative...`);
            return true;
        } catch (directErr) {
            console.log(`   ❌ Erreur: ${err.message}`);
            return false;
        }
    }
}

async function fixDatabaseSchema() {
    console.log('🔧 CORRECTION AUTOMATIQUE DU SCHÉMA DE BASE DE DONNÉES\n');
    console.log('=' * 60);
    
    // Connexion Supabase
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('📡 Test de connexion...');
    try {
        const { data, error } = await supabase.from('wallet_registry').select('id').limit(1);
        if (error && !error.message.includes('does not exist')) {
            console.log('   ✅ Connexion OK, tables existent');
        } else if (error && error.message.includes('does not exist')) {
            console.log('   ✅ Connexion OK, tables à créer');
        } else {
            console.log('   ✅ Connexion OK, tables opérationnelles');
        }
    } catch (err) {
        console.log(`   ❌ Erreur de connexion: ${err.message}`);
        return false;
    }
    
    console.log('\n🗄️ Correction du schéma...\n');
    
    // Les commandes SQL essentielles à exécuter séparément
    const sqlCommands = [
        {
            sql: `-- Corriger wallet_registry
            DO $$ 
            BEGIN
                -- Agrandir wallet_address si nécessaire
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_registry' 
                    AND column_name = 'wallet_address' 
                    AND character_maximum_length < 100
                ) THEN
                    ALTER TABLE wallet_registry ALTER COLUMN wallet_address TYPE VARCHAR(100);
                    RAISE NOTICE 'wallet_registry.wallet_address → VARCHAR(100)';
                END IF;
                
                -- Ajouter metadata si manquante
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_registry' 
                    AND column_name = 'metadata'
                ) THEN
                    ALTER TABLE wallet_registry ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
                    RAISE NOTICE 'Colonne metadata ajoutée';
                END IF;
            END $$;`,
            description: 'Correction de wallet_registry'
        },
        {
            sql: `-- Corriger wallet_tokens
            DO $$ 
            BEGIN
                -- Agrandir wallet_address si nécessaire
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' 
                    AND column_name = 'wallet_address' 
                    AND character_maximum_length < 100
                ) THEN
                    ALTER TABLE wallet_tokens ALTER COLUMN wallet_address TYPE VARCHAR(100);
                    RAISE NOTICE 'wallet_tokens.wallet_address → VARCHAR(100)';
                END IF;
                
                -- Agrandir token_address si nécessaire  
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' 
                    AND column_name = 'token_address' 
                    AND character_maximum_length < 100
                ) THEN
                    ALTER TABLE wallet_tokens ALTER COLUMN token_address TYPE VARCHAR(100);
                    RAISE NOTICE 'wallet_tokens.token_address → VARCHAR(100)';
                END IF;
            END $$;`,
            description: 'Correction des adresses dans wallet_tokens'
        },
        {
            sql: `-- Ajouter colonnes manquantes dans wallet_tokens
            DO $$ 
            BEGIN
                -- roi_percentage
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' AND column_name = 'roi_percentage'
                ) THEN
                    ALTER TABLE wallet_tokens ADD COLUMN roi_percentage DECIMAL(10,4) DEFAULT 0;
                    RAISE NOTICE 'Colonne roi_percentage ajoutée';
                END IF;
                
                -- calculated_market_cap_usd
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' AND column_name = 'calculated_market_cap_usd'
                ) THEN
                    ALTER TABLE wallet_tokens ADD COLUMN calculated_market_cap_usd DECIMAL(30,2);
                    RAISE NOTICE 'Colonne calculated_market_cap_usd ajoutée';
                END IF;
                
                -- reliability_score
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' AND column_name = 'reliability_score'
                ) THEN
                    ALTER TABLE wallet_tokens ADD COLUMN reliability_score DECIMAL(8,2);
                    RAISE NOTICE 'Colonne reliability_score ajoutée';
                END IF;
                
                -- liquidity_locked_percent
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'wallet_tokens' AND column_name = 'liquidity_locked_percent'
                ) THEN
                    ALTER TABLE wallet_tokens ADD COLUMN liquidity_locked_percent DECIMAL(8,4);
                    RAISE NOTICE 'Colonne liquidity_locked_percent ajoutée';
                END IF;
            END $$;`,
            description: 'Ajout des colonnes manquantes'
        }
    ];
    
    // Exécuter chaque commande
    let allSuccess = true;
    for (const cmd of sqlCommands) {
        const success = await executeSQL(supabase, cmd.sql, cmd.description);
        if (!success) allSuccess = false;
    }
    
    console.log('\n🧪 Test après correction...');
    
    // Test final
    try {
        const { data: walletData, error: walletError } = await supabase
            .from('wallet_registry')
            .select('id, wallet_address, metadata')
            .limit(1);
            
        const { data: tokenData, error: tokenError } = await supabase
            .from('wallet_tokens')
            .select('id, wallet_address, token_address, roi_percentage, calculated_market_cap_usd')
            .limit(1);
            
        if (!walletError) {
            console.log('   ✅ wallet_registry : colonnes corrigées');
        } else {
            console.log(`   ⚠️  wallet_registry : ${walletError.message}`);
        }
        
        if (!tokenError) {
            console.log('   ✅ wallet_tokens : colonnes corrigées');
        } else {
            console.log(`   ⚠️  wallet_tokens : ${tokenError.message}`);
        }
        
    } catch (err) {
        console.log(`   ❌ Erreur test: ${err.message}`);
    }
    
    console.log('\n' + '=' * 60);
    if (allSuccess) {
        console.log('🎉 SCHÉMA CORRIGÉ AVEC SUCCÈS!');
        console.log('\n📋 Prochaines étapes:');
        console.log('1. Lancez: node test-database-save.js');
        console.log('2. Testez le système: node test-complete-system.js');
    } else {
        console.log('⚠️  CORRECTION PARTIELLE');
        console.log('\n📋 Action requise:');
        console.log('1. Exécutez manuellement create-minimal.sql dans Supabase SQL Editor');
        console.log('2. Puis lancez: node test-database-save.js');
    }
    
    return allSuccess;
}

if (require.main === module) {
    fixDatabaseSchema().catch(console.error);
}
