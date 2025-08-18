-- 🕵️  INVESTIGATION - Colonnes potentiellement obsolètes
-- =====================================================
-- Date: 2025-08-18T15:24:07.408Z

-- Dune API Legacy
-- ===============

-- Vérifier si les données Dune sont encore mises à jour
SELECT 
  COUNT(*) as total_wallets,
  COUNT(*) FILTER (WHERE dune_wallet_pnl IS NOT NULL OR dune_total_bought_usd IS NOT NULL OR dune_total_pnl_usd IS NOT NULL OR dune_roi IS NOT NULL OR dune_tokens IS NOT NULL) as with_dune_data,
  MAX(updated_at) as last_update
FROM wallet_registry;

-- Échantillon de données Dune
SELECT 
  wallet_address,
  dune_wallet_pnl,
  dune_total_bought_usd,
  dune_total_pnl_usd,
  dune_roi,
  dune_tokens
FROM wallet_registry 
WHERE dune_wallet_pnl IS NOT NULL OR dune_total_bought_usd IS NOT NULL OR dune_total_pnl_usd IS NOT NULL OR dune_roi IS NOT NULL OR dune_tokens IS NOT NULL
LIMIT 5;

-- External URLs
-- =============

-- Vérifier les URLs externes
SELECT 
  COUNT(*) as total_wallets,
  COUNT(solscan_url) as solscan_url_count,
  COUNT(gmgn_url) as gmgn_url_count,
  COUNT(cielo_url) as cielo_url_count,
  COUNT(wallet_pnl_link) as wallet_pnl_link_count
FROM wallet_registry;

-- Note: Les URLs peuvent souvent être reconstruites dynamiquement
-- Exemple: https://solscan.io/account/{wallet_address}

-- RECOMMANDATIONS:
-- 1. Si les données Dune ne sont plus mises à jour → Supprimer
-- 2. Si les URLs peuvent être reconstruites → Supprimer
-- 3. Tester l'application après chaque changement
