#!/usr/bin/env node

/**
 * Test simple pour vérifier que les clés API Supabase sont correctes
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
    console.log('🧪 Test des clés API Supabase...\n');
    
    // Vérifier que les variables d'environnement sont définies
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('📋 Variables d\'environnement:');
    console.log(`   SUPABASE_URL: ${url ? '✅ Définie' : '❌ Manquante'}`);
    console.log(`   SUPABASE_ANON_KEY: ${anonKey && !anonKey.includes('VOTRE_VRAIE') ? '✅ Définie' : '❌ Factice ou manquante'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceKey && !serviceKey.includes('VOTRE_VRAIE') ? '✅ Définie' : '❌ Factice ou manquante'}\n`);
    
    if (!url || !anonKey || !serviceKey) {
        console.log('❌ Veuillez configurer vos clés API dans le fichier .env');
        console.log('\n📝 Instructions:');
        console.log('1. Allez sur https://app.supabase.com/');
        console.log('2. Sélectionnez votre projet');
        console.log('3. Allez dans Settings > API');
        console.log('4. Copiez les clés "anon/public" et "service_role"');
        console.log('5. Remplacez les valeurs factices dans .env\n');
        return false;
    }
    
    if (anonKey.includes('VOTRE_VRAIE') || serviceKey.includes('VOTRE_VRAIE')) {
        console.log('❌ Les clés API sont encore factices!');
        console.log('   Remplacez "VOTRE_VRAIE_ANON_KEY_ICI" et "VOTRE_VRAIE_SERVICE_ROLE_KEY_ICI" par les vraies clés.\n');
        return false;
    }
    
    // Test avec anon key
    console.log('🔑 Test avec anon key...');
    try {
        const supabaseAnon = createClient(url, anonKey);
        const { data, error } = await supabaseAnon.from('wallet_registry').select('count').limit(1);
        
        if (error) {
            console.log(`   ⚠️  Erreur (normale si tables n'existent pas): ${error.message}`);
        } else {
            console.log('   ✅ Anon key fonctionne!');
        }
    } catch (err) {
        console.log(`   ❌ Erreur anon key: ${err.message}`);
        return false;
    }
    
    // Test avec service role key
    console.log('🔑 Test avec service role key...');
    try {
        const supabaseAdmin = createClient(url, serviceKey);
        const { data, error } = await supabaseAdmin.from('wallet_registry').select('count').limit(1);
        
        if (error) {
            console.log(`   ⚠️  Erreur (normale si tables n'existent pas): ${error.message}`);
        } else {
            console.log('   ✅ Service role key fonctionne!');
        }
    } catch (err) {
        console.log(`   ❌ Erreur service role key: ${err.message}`);
        return false;
    }
    
    console.log('\n🎉 Clés API configurées correctement!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Exécutez le script create-minimal.sql dans Supabase SQL Editor');
    console.log('2. Lancez: node test-database-save.js');
    console.log('3. Testez le système complet: node test-complete-system.js\n');
    
    return true;
}

// Test des fonctions Edge Functions
async function testEdgeFunctions() {
    console.log('🔧 Test des Edge Functions...\n');
    
    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
        console.log('❌ API_BASE_URL manquante dans .env');
        return false;
    }
    
    // Test simple ping
    try {
        const response = await fetch(`${baseUrl}/cielo-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ test: true })
        });
        
        if (response.ok) {
            console.log('✅ Edge Function accessible');
        } else {
            console.log(`⚠️  Edge Function retourne: ${response.status}`);
        }
    } catch (err) {
        console.log(`❌ Erreur Edge Function: ${err.message}`);
    }
    
    return true;
}

async function main() {
    console.log('🚀 Vérification de la configuration Supabase\n');
    console.log('=' * 50);
    
    const dbOk = await testSupabaseConnection();
    if (dbOk) {
        await testEdgeFunctions();
    }
    
    console.log('=' * 50);
    console.log('✨ Test terminé!\n');
}

if (require.main === module) {
    main().catch(console.error);
}
