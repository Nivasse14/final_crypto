#!/usr/bin/env node

/**
 * Script pour créer automatiquement la table analysis_jobs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

async function createTableViaAPI() {
    console.log('🔧 CRÉATION DE LA TABLE ANALYSIS_JOBS');
    console.log('='.repeat(50));
    
    const createTableSQL = `
-- Table pour gérer les jobs d'analyse en arrière-plan
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('quick', 'complete')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step TEXT NOT NULL DEFAULT 'Initializing...',
    estimated_completion TIMESTAMP WITH TIME ZONE,
    results JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_wallet_address ON analysis_jobs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at);

-- Vérification
SELECT 'Table analysis_jobs créée avec succès !' as status;
    `;
    
    try {
        // Méthode 1: Via l'API REST directe
        console.log('📡 Tentative via API REST...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY
            },
            body: JSON.stringify({
                sql: createTableSQL
            })
        });
        
        if (response.ok) {
            console.log('✅ Table créée via API REST');
            return await testTable();
        }
        
        // Méthode 2: Via le client Supabase
        console.log('📡 Tentative via client Supabase...');
        
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        
        // Créer la table via une fonction SQL personnalisée
        const { data, error } = await supabase.rpc('create_analysis_jobs_table_if_not_exists');
        
        if (!error) {
            console.log('✅ Table créée via client Supabase');
            return await testTable();
        }
        
        // Méthode 3: Instructions manuelles
        console.log('⚠️  Création automatique échouée');
        console.log('\n🔧 CRÉATION MANUELLE REQUISE:');
        console.log('1. Allez sur https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor');
        console.log('2. Cliquez sur "SQL Editor"');
        console.log('3. Copiez-collez ce SQL et exécutez-le:\n');
        
        console.log('```sql');
        console.log(createTableSQL);
        console.log('```\n');
        
        console.log('4. Ensuite, relancez le test: node test-complete-api.js');
        
        return false;
        
    } catch (error) {
        console.error('❌ Erreur création table:', error.message);
        return false;
    }
}

async function testTable() {
    console.log('\n🧪 Test de la table analysis_jobs...');
    
    try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        
        // Test d'insertion
        const { data, error } = await supabase
            .from('analysis_jobs')
            .insert({
                wallet_address: 'test_wallet_' + Date.now(),
                status: 'pending',
                analysis_type: 'quick',
                current_step: 'Test de création'
            })
            .select();
        
        if (error) {
            console.log('❌ Erreur test:', error.message);
            return false;
        }
        
        console.log('✅ Test insertion réussi:', data[0].id);
        
        // Cleanup
        await supabase
            .from('analysis_jobs')
            .delete()
            .eq('id', data[0].id);
        
        console.log('✅ Table analysis_jobs opérationnelle !');
        console.log('\n🎉 Vous pouvez maintenant tester l\'API complete:');
        console.log('   node test-complete-api.js');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur test table:', error.message);
        return false;
    }
}

async function main() {
    const success = await createTableViaAPI();
    
    if (success) {
        console.log('\n🚀 PRÊT POUR L\'API COMPLETE ANALYSIS !');
    } else {
        console.log('\n⚠️  CRÉATION MANUELLE REQUISE');
    }
}

if (require.main === module) {
    main();
}

module.exports = { createTableViaAPI, testTable };
