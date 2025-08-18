-- Script d'analyse des données pour les colonnes candidates à la suppression
-- Date: 2025-08-18T15:21:24.141Z

-- Vue d'ensemble des données
SELECT COUNT(*) as total_wallets FROM wallet_registry;

-- Analyse de chaque colonne candidate
-- pnl_total_volume_24h_usd
SELECT 
  'pnl_total_volume_24h_usd' as colonne,
  COUNT(*) as total_rows,
  COUNT(pnl_total_volume_24h_usd) as non_null_count,
  COUNT(DISTINCT pnl_total_volume_24h_usd) as distinct_values,
  ROUND(COUNT(pnl_total_volume_24h_usd)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- pnl_avg_volume_24h_usd
SELECT 
  'pnl_avg_volume_24h_usd' as colonne,
  COUNT(*) as total_rows,
  COUNT(pnl_avg_volume_24h_usd) as non_null_count,
  COUNT(DISTINCT pnl_avg_volume_24h_usd) as distinct_values,
  ROUND(COUNT(pnl_avg_volume_24h_usd)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- pnl_tokens_with_volume_data
SELECT 
  'pnl_tokens_with_volume_data' as colonne,
  COUNT(*) as total_rows,
  COUNT(pnl_tokens_with_volume_data) as non_null_count,
  COUNT(DISTINCT pnl_tokens_with_volume_data) as distinct_values,
  ROUND(COUNT(pnl_tokens_with_volume_data)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- portfolio_total_volume_24h_usd
SELECT 
  'portfolio_total_volume_24h_usd' as colonne,
  COUNT(*) as total_rows,
  COUNT(portfolio_total_volume_24h_usd) as non_null_count,
  COUNT(DISTINCT portfolio_total_volume_24h_usd) as distinct_values,
  ROUND(COUNT(portfolio_total_volume_24h_usd)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- portfolio_avg_volume_24h_usd
SELECT 
  'portfolio_avg_volume_24h_usd' as colonne,
  COUNT(*) as total_rows,
  COUNT(portfolio_avg_volume_24h_usd) as non_null_count,
  COUNT(DISTINCT portfolio_avg_volume_24h_usd) as distinct_values,
  ROUND(COUNT(portfolio_avg_volume_24h_usd)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- portfolio_tokens_with_volume_data
SELECT 
  'portfolio_tokens_with_volume_data' as colonne,
  COUNT(*) as total_rows,
  COUNT(portfolio_tokens_with_volume_data) as non_null_count,
  COUNT(DISTINCT portfolio_tokens_with_volume_data) as distinct_values,
  ROUND(COUNT(portfolio_tokens_with_volume_data)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- roi_50_to_200
SELECT 
  'roi_50_to_200' as colonne,
  COUNT(*) as total_rows,
  COUNT(roi_50_to_200) as non_null_count,
  COUNT(DISTINCT roi_50_to_200) as distinct_values,
  ROUND(COUNT(roi_50_to_200)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- roi_0_to_50
SELECT 
  'roi_0_to_50' as colonne,
  COUNT(*) as total_rows,
  COUNT(roi_0_to_50) as non_null_count,
  COUNT(DISTINCT roi_0_to_50) as distinct_values,
  ROUND(COUNT(roi_0_to_50)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- roi_total_trades
SELECT 
  'roi_total_trades' as colonne,
  COUNT(*) as total_rows,
  COUNT(roi_total_trades) as non_null_count,
  COUNT(DISTINCT roi_total_trades) as distinct_values,
  ROUND(COUNT(roi_total_trades)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- roi_winning_trades
SELECT 
  'roi_winning_trades' as colonne,
  COUNT(*) as total_rows,
  COUNT(roi_winning_trades) as non_null_count,
  COUNT(DISTINCT roi_winning_trades) as distinct_values,
  ROUND(COUNT(roi_winning_trades)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- roi_losing_trades
SELECT 
  'roi_losing_trades' as colonne,
  COUNT(*) as total_rows,
  COUNT(roi_losing_trades) as non_null_count,
  COUNT(DISTINCT roi_losing_trades) as distinct_values,
  ROUND(COUNT(roi_losing_trades)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- dune_mroi
SELECT 
  'dune_mroi' as colonne,
  COUNT(*) as total_rows,
  COUNT(dune_mroi) as non_null_count,
  COUNT(DISTINCT dune_mroi) as distinct_values,
  ROUND(COUNT(dune_mroi)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- dune_invalids
SELECT 
  'dune_invalids' as colonne,
  COUNT(*) as total_rows,
  COUNT(dune_invalids) as non_null_count,
  COUNT(DISTINCT dune_invalids) as distinct_values,
  ROUND(COUNT(dune_invalids)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- streak_wins_max_90d
SELECT 
  'streak_wins_max_90d' as colonne,
  COUNT(*) as total_rows,
  COUNT(streak_wins_max_90d) as non_null_count,
  COUNT(DISTINCT streak_wins_max_90d) as distinct_values,
  ROUND(COUNT(streak_wins_max_90d)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- streak_losses_max_90d
SELECT 
  'streak_losses_max_90d' as colonne,
  COUNT(*) as total_rows,
  COUNT(streak_losses_max_90d) as non_null_count,
  COUNT(DISTINCT streak_losses_max_90d) as distinct_values,
  ROUND(COUNT(streak_losses_max_90d)::numeric / COUNT(*) * 100, 2) as fill_percentage
FROM wallet_registry;

-- Dernière activité sur ces colonnes
SELECT 
  MAX(updated_at) as derniere_mise_a_jour,
  COUNT(*) as wallets_avec_donnees
FROM wallet_registry 
WHERE (
  pnl_total_volume_24h_usd IS NOT NULL OR
  pnl_avg_volume_24h_usd IS NOT NULL OR
  pnl_tokens_with_volume_data IS NOT NULL OR
  portfolio_total_volume_24h_usd IS NOT NULL OR
  portfolio_avg_volume_24h_usd IS NOT NULL OR
  portfolio_tokens_with_volume_data IS NOT NULL OR
  roi_50_to_200 IS NOT NULL OR
  roi_0_to_50 IS NOT NULL OR
  roi_total_trades IS NOT NULL OR
  roi_winning_trades IS NOT NULL OR
  roi_losing_trades IS NOT NULL OR
  dune_mroi IS NOT NULL OR
  dune_invalids IS NOT NULL OR
  streak_wins_max_90d IS NOT NULL OR
  streak_losses_max_90d IS NOT NULL
);
