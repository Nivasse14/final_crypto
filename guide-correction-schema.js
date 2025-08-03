#!/usr/bin/env node

/**
 * Guide étape par étape pour corriger le schéma manuellement
 */

console.log('🔧 GUIDE DE CORRECTION MANUELLE DU SCHÉMA\n');
console.log('=' * 50);

console.log('\n📋 ÉTAPES À SUIVRE:');

console.log('\n1. 🌐 Ouvrez Supabase Dashboard:');
console.log('   → https://app.supabase.com/');
console.log('   → Sélectionnez votre projet');

console.log('\n2. 📝 Allez dans SQL Editor:');
console.log('   → Cliquez sur "SQL Editor" dans le menu latéral');

console.log('\n3. 📋 Copiez-collez ce SQL:');
console.log('\n' + '-' * 40);
console.log(`
-- Corriger le schéma pour les wallets alpha
-- Étape 1: Agrandir les colonnes d'adresses

ALTER TABLE wallet_registry 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Étape 2: Ajouter metadata à wallet_registry
ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Étape 3: Agrandir les adresses dans wallet_tokens
ALTER TABLE wallet_tokens 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

ALTER TABLE wallet_tokens 
ALTER COLUMN token_address TYPE VARCHAR(100);

-- Étape 4: Ajouter les colonnes manquantes à wallet_tokens
ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS roi_percentage DECIMAL(10,4) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS calculated_market_cap_usd DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(8,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS liquidity_locked_percent DECIMAL(8,4);

-- Vérification finale
SELECT 'Schema correction complete!' as status;
`);
console.log('-' * 40);

console.log('\n4. ▶️  Exécutez le script:');
console.log('   → Cliquez sur "Run" (ou Ctrl+Enter)');

console.log('\n5. ✅ Vérifiez les résultats:');
console.log('   → Vous devriez voir "Schema correction complete!"');

console.log('\n6. 🧪 Testez la correction:');
console.log('   → Revenez au terminal');
console.log('   → Lancez: node test-database-save.js');

console.log('\n' + '=' * 50);
console.log('📄 ALTERNATIVE: Utilisation du script complet');
console.log('Si vous préférez, vous pouvez aussi copier-coller');
console.log('tout le contenu du fichier: create-minimal.sql');
console.log('=' * 50);

console.log('\n💡 CONSEIL:');
console.log('Une fois la correction faite, tous les tests devraient passer!');
console.log('Le système sera alors prêt pour détecter les wallets alpha.');

// Créer aussi un fichier SQL simple pour copier-coller
const fs = require('fs');
const simpleSQL = `-- Correction simple du schéma pour scanDune
-- Copiez-collez ce code dans Supabase SQL Editor

-- Agrandir les colonnes d'adresses pour supporter Solana (46 caractères)
ALTER TABLE wallet_registry 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

-- Ajouter metadata à wallet_registry
ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Agrandir les adresses dans wallet_tokens  
ALTER TABLE wallet_tokens 
ALTER COLUMN wallet_address TYPE VARCHAR(100);

ALTER TABLE wallet_tokens 
ALTER COLUMN token_address TYPE VARCHAR(100);

-- Ajouter les colonnes manquantes à wallet_tokens
ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS roi_percentage DECIMAL(10,4) DEFAULT 0;

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS calculated_market_cap_usd DECIMAL(30,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(8,2);

ALTER TABLE wallet_tokens 
ADD COLUMN IF NOT EXISTS liquidity_locked_percent DECIMAL(8,4);

-- Vérification finale
SELECT 'Schema correction complete! 🎉' as status;`;

fs.writeFileSync('/Users/helenemounissamy/scanDune/fix-schema-simple.sql', simpleSQL);
console.log('\n📁 Fichier créé: fix-schema-simple.sql');
console.log('   (Vous pouvez aussi copier son contenu directement)');
