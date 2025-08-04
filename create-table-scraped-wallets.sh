#!/bin/bash

# Script pour créer la table scraped_wallets via l'API Supabase

echo "🏗️ Création de la table scraped_wallets..."

# Utiliser l'API SQL de Supabase pour créer la table
curl -X POST 'https://xkndddxqqlxqknbqtefv.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.Sv3k-p7PQ5CXxTh4Z6YzKN_HF-y6-sD89GXcO8C8xXk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.Sv3k-p7PQ5CXxTh4Z6YzKN_HF-y6-sD89GXcO8C8xXk" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS scraped_wallets (id BIGSERIAL PRIMARY KEY, scraping_job_id TEXT NOT NULL, scraped_at TIMESTAMPTZ DEFAULT NOW(), dune_url TEXT NOT NULL, wallet_address TEXT NOT NULL, solscan_url TEXT, gmgn_url TEXT, cielo_url TEXT, wallet_pnl_link TEXT, wallet_pnl TEXT, total_bought_usd TEXT, total_pnl_usd TEXT, roi TEXT, mroi TEXT, invalids TEXT, tokens TEXT, nosells TEXT, losses TEXT, nulls TEXT, wins TEXT, winrate TEXT, w2x TEXT, w10x TEXT, w100x TEXT, scalps TEXT, scalp_ratio TEXT, bal TEXT, bal_ratio TEXT, last_trade TEXT, trade_days TEXT, trade_nums TEXT, enrichment_status TEXT DEFAULT 'pending', enriched_at TIMESTAMPTZ, enrichment_job_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());"
  }'

echo ""
echo "📋 Création des index..."

curl -X POST 'https://xkndddxqqlxqknbqtefv.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.Sv3k-p7PQ5CXxTh4Z6YzKN_HF-y6-sD89GXcO8C8xXk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.Sv3k-p7PQ5CXxTh4Z6YzKN_HF-y6-sD89GXcO8C8xXk" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE INDEX IF NOT EXISTS idx_scraped_wallets_wallet ON scraped_wallets(wallet_address); CREATE INDEX IF NOT EXISTS idx_scraped_wallets_job ON scraped_wallets(scraping_job_id); CREATE INDEX IF NOT EXISTS idx_scraped_wallets_status ON scraped_wallets(enrichment_status);"
  }'

echo ""
echo "✅ Table scraped_wallets créée avec succès!"
echo ""
echo "🔗 Endpoints disponibles:"
echo "  • POST /start - Démarrer le scraping"
echo "  • GET /status?job_id=xxx - Vérifier le statut"
echo "  • GET /pending-wallets?limit=100 - Récupérer les wallets en attente"
echo "  • POST /update-enrichment - Mettre à jour le statut"
