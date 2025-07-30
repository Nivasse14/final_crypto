-- Script pour identifier la structure exacte des tables avant correction
-- À exécuter d'abord pour voir quelles colonnes existent vraiment

-- 1. Lister toutes les tables du schéma public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Voir la structure détaillée de chaque table importante
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('wallet_registry', 'wallet_tokens', 'token_enrichment_data', 'batch_processing_logs')
ORDER BY table_name, ordinal_position;

-- 3. Identifier spécifiquement les colonnes avec des types INTEGER qui pourraient poser problème
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'decimal', 'real', 'double precision')
ORDER BY table_name, column_name;
