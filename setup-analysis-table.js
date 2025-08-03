// Script pour créer la table analysis_jobs directement en production
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAnalysisJobsTable() {
    console.log('📊 Création de la table analysis_jobs...');
    
    try {
        // SQL pour créer la table
        const { data, error } = await supabase.rpc('create_analysis_jobs_table');
        
        if (error) {
            // Si la fonction n'existe pas, on utilise une requête directe
            console.log('Tentative avec requête SQL directe...');
            
            const createTableSQL = `
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
            `;
            
            const { data: tableData, error: tableError } = await supabase
                .from('_dummy')
                .select('*')
                .limit(1);
            
            // Alternative: utiliser l'API REST directement
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
            
            if (!response.ok) {
                console.log('Tentative avec approche manuelle...');
                
                // Tenter de créer via un insert test
                const { data: testData, error: testError } = await supabase
                    .from('analysis_jobs')
                    .select('*')
                    .limit(1);
                
                if (testError && testError.code === '42P01') {
                    console.log('❌ Table analysis_jobs n\'existe pas et ne peut pas être créée automatiquement');
                    console.log('🔧 Vous devez créer la table manuellement dans Supabase Dashboard:');
                    console.log('');
                    console.log('1. Allez sur https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor');
                    console.log('2. Ouvrez le SQL Editor');
                    console.log('3. Exécutez le contenu de create-analysis-jobs-table.sql');
                    console.log('');
                    return false;
                } else {
                    console.log('✅ Table analysis_jobs semble déjà exister');
                    return true;
                }
            }
        }
        
        console.log('✅ Table analysis_jobs créée avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de la table:', error.message);
        return false;
    }
}

async function testTable() {
    console.log('🧪 Test de la table analysis_jobs...');
    
    try {
        // Test d'insertion
        const { data, error } = await supabase
            .from('analysis_jobs')
            .insert({
                wallet_address: 'test_wallet',
                status: 'pending',
                analysis_type: 'quick',
                current_step: 'Test insertion'
            })
            .select();
        
        if (error) {
            console.error('❌ Erreur test insertion:', error.message);
            return false;
        }
        
        console.log('✅ Test insertion réussi:', data[0].id);
        
        // Cleanup
        await supabase
            .from('analysis_jobs')
            .delete()
            .eq('id', data[0].id);
        
        console.log('✅ Table analysis_jobs fonctionnelle');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur test table:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 SETUP DE LA TABLE ANALYSIS_JOBS');
    console.log('='.repeat(40));
    
    const tableCreated = await createAnalysisJobsTable();
    
    if (tableCreated) {
        const tableWorks = await testTable();
        
        if (tableWorks) {
            console.log('\n✅ Setup terminé ! Vous pouvez maintenant tester les nouvelles APIs.');
        }
    }
}

if (require.main === module) {
    main();
}

module.exports = { createAnalysisJobsTable, testTable };
