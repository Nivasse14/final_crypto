-- Script de diagnostic pour l'erreur "invalid input syntax for type integer: 48.055045871559635"
-- Ce script identifie exactement quelles colonnes causent le problème

-- 1. Identifier toutes les colonnes INTEGER dans les tables wallet
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.numeric_precision,
    c.numeric_scale,
    'ALTER TABLE ' || t.table_name || ' ALTER COLUMN ' || c.column_name || ' TYPE DECIMAL(20,8);' as fix_query
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name LIKE '%wallet%' OR t.table_name LIKE '%token%'
  AND c.data_type IN ('integer', 'bigint', 'smallint')
ORDER BY t.table_name, c.column_name;

-- 2. Cas spécifique: identifier les colonnes qui pourraient recevoir des valeurs décimales
-- Basé sur l'erreur: "48.055045871559635" qui ressemble à un balance ou price
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%balance%' THEN 'DECIMAL(20,8)'
        WHEN column_name LIKE '%price%' THEN 'DECIMAL(20,8)'
        WHEN column_name LIKE '%amount%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%value%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%pnl%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%percent%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%rate%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%ratio%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%roi%' THEN 'DECIMAL(8,4)'
        ELSE 'DECIMAL(20,8)'
    END as suggested_type,
    'ALTER TABLE ' || table_name || ' ALTER COLUMN ' || column_name || ' TYPE ' ||
    CASE 
        WHEN column_name LIKE '%balance%' THEN 'DECIMAL(20,8)'
        WHEN column_name LIKE '%price%' THEN 'DECIMAL(20,8)'
        WHEN column_name LIKE '%amount%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%value%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%pnl%' THEN 'DECIMAL(20,2)'
        WHEN column_name LIKE '%percent%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%rate%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%ratio%' THEN 'DECIMAL(8,4)'
        WHEN column_name LIKE '%roi%' THEN 'DECIMAL(8,4)'
        ELSE 'DECIMAL(20,8)'
    END || ';' as fix_statement
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type IN ('integer', 'bigint', 'smallint')
  AND (
    column_name LIKE '%balance%' OR
    column_name LIKE '%price%' OR
    column_name LIKE '%amount%' OR
    column_name LIKE '%value%' OR
    column_name LIKE '%pnl%' OR
    column_name LIKE '%percent%' OR
    column_name LIKE '%rate%' OR
    column_name LIKE '%ratio%' OR
    column_name LIKE '%roi%'
  )
ORDER BY table_name, column_name;
