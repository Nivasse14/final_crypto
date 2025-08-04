#!/bin/bash

echo "🔍 Vérification des Données Supabase - Wallets Scrapés"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "📊 1. STATISTIQUES GÉNÉRALES - Table wallet_registry"
curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq -r '.[] | "   Total wallets: " + (.count | tostring)'

echo ""
echo "📈 2. RÉPARTITION PAR STATUT"
curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=status&group=status&aggregate=count" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq -r '.[] | "   " + .status + ": " + (.count | tostring)'

echo ""
echo "🎯 3. TOP 10 WALLETS PAR PNL"
curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address,total_pnl_usd,roi,winrate&order=total_pnl_usd.desc&limit=10" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq -r '.[] | "   " + .wallet_address[0:20] + "... | PnL: $" + (.total_pnl_usd | tostring) + " | ROI: " + (.roi | tostring) + "% | Winrate: " + (.winrate | tostring) + "%"'

echo ""
echo "🔍 4. WALLETS SCRAPÉS RÉCEMMENT (dernières 24h)"
YESTERDAY=$(date -d "1 day ago" +%Y-%m-%dT%H:%M:%S)
curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address,total_pnl_usd,created_at,source&created_at=gte.$YESTERDAY&order=created_at.desc&limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq -r '.[] | "   " + .wallet_address[0:20] + "... | PnL: $" + (.total_pnl_usd | tostring) + " | Source: " + .source + " | " + .created_at[0:16]'

echo ""
echo "📊 5. MÉTRIQUES PAR SOURCE"
curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=source&group=source&aggregate=count" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq -r '.[] | "   " + .source + ": " + (.count | tostring)'

echo ""
echo "🔗 6. LIENS D'ACCÈS DIRECT"
echo "   📱 Dashboard Supabase: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor"
echo "   🗂️  Table wallet_registry: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor/28888"
echo "   📊 Table wallets_extended: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor/28889"

echo ""
echo "🔍 7. REQUÊTE POUR VOIR VOS DONNÉES COMPLÈTES"
echo "   curl -s \"$SUPABASE_URL/rest/v1/wallet_registry?select=*&order=created_at.desc&limit=10\" \\"
echo "     -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "     -H \"Authorization: Bearer $SUPABASE_ANON_KEY\" | jq '.'"

echo ""
echo "📈 8. EXEMPLE REQUÊTE FILTRAGE PAR PNL"
echo "   curl -s \"$SUPABASE_URL/rest/v1/wallet_registry?total_pnl_usd=gte.1000&select=wallet_address,total_pnl_usd,roi&order=total_pnl_usd.desc\" \\"
echo "     -H \"apikey: $SUPABASE_ANON_KEY\" \\"
echo "     -H \"Authorization: Bearer $SUPABASE_ANON_KEY\" | jq '.'"

echo ""
echo "✅ Vérification terminée !"
