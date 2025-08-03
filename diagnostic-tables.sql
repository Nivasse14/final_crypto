-- Diagnostic complet de la structure de la base de données
-- À exécuter dans le SQL Editor de Supabase

-- 1. Lister toutes les tables existantes
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Lister toutes les vues
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. Lister toutes les colonnes avec leurs types
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4. Chercher les contraintes de longueur problématiques
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND data_type LIKE '%character%'
  AND character_maximum_length < 50
  AND (column_name LIKE '%address%' OR column_name LIKE '%token%')
ORDER BY table_name, column_name;
