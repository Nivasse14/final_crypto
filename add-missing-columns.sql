-- Correction rapide: ajouter la colonne manquante
-- Copiez-collez ce code dans Supabase SQL Editor

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS total_pnl_usd DECIMAL(20,2) DEFAULT 0;

ALTER TABLE wallet_registry 
ADD COLUMN IF NOT EXISTS total_bought_usd DECIMAL(20,2) DEFAULT 0;

-- Vérification
SELECT 'Colonnes manquantes ajoutées! ✅' as status;
