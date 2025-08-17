#!/bin/bash

# Script de vérification des données Dune dans la base de données
# Vérifie la cohérence entre le scraping et le stockage

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🔍 Vérification des données Dune dans la base de données"
echo "======================================================"

# 1. Statistiques générales
echo ""
echo "📊 1. STATISTIQUES GÉNÉRALES"
TOTAL_WALLETS=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

DUNE_WALLETS=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

echo "   📈 Total wallets en base: $TOTAL_WALLETS"
echo "   🕷️ Wallets de Dune: $DUNE_WALLETS"
echo "   📊 Pourcentage Dune: $(echo "scale=1; $DUNE_WALLETS * 100 / $TOTAL_WALLETS" | bc)%"

# 2. Vérification du fichier JSON local
echo ""
echo "📁 2. COMPARAISON AVEC LE FICHIER LOCAL"
if [ -f "scripts/wallets.json" ]; then
  JSON_COUNT=$(jq '. | length' scripts/wallets.json)
  echo "   📄 Wallets dans wallets.json: $JSON_COUNT"
  
  if [ "$JSON_COUNT" -eq "$DUNE_WALLETS" ]; then
    echo "   ✅ Correspondance parfaite!"
  else
    echo "   ⚠️ Différence détectée: JSON=$JSON_COUNT vs DB=$DUNE_WALLETS"
  fi
else
  echo "   ❌ Fichier wallets.json non trouvé"
fi

# 3. Données récentes
echo ""
echo "⏰ 3. DONNÉES RÉCENTES (dernières 24h)"
YESTERDAY=$(date -u -d "1 day ago" +%Y-%m-%dT%H:%M:%S)
RECENT_DUNE=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper&updated_at=gte.$YESTERDAY" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

echo "   🆕 Wallets Dune mis à jour dans les 24h: $RECENT_DUNE"

# 4. Échantillon de données
echo ""
echo "👁️ 4. ÉCHANTILLON DE DONNÉES DUNE"
echo "   (5 derniers wallets Dune mis à jour)"

curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=wallet_address,total_pnl_usd,roi,updated_at&source=eq.dune_scraper&order=updated_at.desc&limit=5" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | \
  jq -r '.[] | "   🔸 " + .wallet_address[0:20] + "... | PnL: $" + (.total_pnl_usd | tostring) + " | ROI: " + (.roi | tostring) + "% | " + .updated_at[0:16]'

# 5. Répartition par statut d'enrichissement
echo ""
echo "🔄 5. STATUT D'ENRICHISSEMENT (wallets Dune)"

ENRICHED_DUNE=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper&status=eq.enriched" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

PENDING_DUNE=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper&or=(status.is.null,status.neq.enriched)" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

echo "   ✅ Enrichis: $ENRICHED_DUNE"
echo "   ⏳ En attente: $PENDING_DUNE"
echo "   📊 Taux enrichissement: $(echo "scale=1; $ENRICHED_DUNE * 100 / $DUNE_WALLETS" | bc)%"

# 6. Métadonnées Dune
echo ""
echo "🏷️ 6. MÉTADONNÉES DUNE"
echo "   (Vérification que les données originales sont préservées)"

HAS_METADATA=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&source=eq.dune_scraper&metadata=not.is.null" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count')

echo "   📦 Wallets avec métadonnées: $HAS_METADATA"
if [ "$HAS_METADATA" -eq "$DUNE_WALLETS" ]; then
  echo "   ✅ Toutes les métadonnées sont préservées"
else
  echo "   ⚠️ Métadonnées manquantes: $((DUNE_WALLETS - HAS_METADATA)) wallets"
fi

# 7. Liens directs pour explorer
echo ""
echo "🔗 7. LIENS POUR EXPLORER LES DONNÉES"
echo "   📊 Dashboard Supabase: https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor/28888"
echo "   🔍 API directe (tous les wallets Dune):"
echo "     curl \"$SUPABASE_URL/rest/v1/wallet_registry?source=eq.dune_scraper&limit=10\" \\"
echo "       -H \"apikey: $SUPABASE_KEY\""

# 8. Résumé final
echo ""
echo "📋 8. RÉSUMÉ DE VÉRIFICATION"
if [ "$DUNE_WALLETS" -gt 0 ]; then
  echo "   ✅ Les wallets Dune SONT présents en base de données"
  echo "   ✅ $DUNE_WALLETS wallets de source 'dune_scraper' détectés"
  echo "   ✅ Données fraîches avec $RECENT_DUNE mises à jour récentes"
  
  if [ "$PENDING_DUNE" -gt 0 ]; then
    echo "   🔄 $PENDING_DUNE wallets en attente d'enrichissement"
    echo "   💡 Lancez: ./simple-dune.sh enrich $PENDING_DUNE"
  fi
else
  echo "   ❌ AUCUN wallet Dune trouvé en base!"
  echo "   💡 Lancez: ./simple-dune.sh scraping"
fi

echo ""
echo "✅ Vérification terminée!"
