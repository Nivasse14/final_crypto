#!/bin/bash

# Script pour enrichir les wallets scrapés avec l'API complète

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

# URL de votre API d'enrichissement (à adapter)
ENRICHMENT_API_URL="$SUPABASE_URL/functions/v1/wallet-enrichment"

echo "🔧 Enrichissement des wallets scrapés"
echo "===================================="

echo ""
echo "1️⃣ Récupération des wallets en attente d'enrichissement..."

PENDING_RESPONSE=$(curl -s \
  -X GET \
  "$SUPABASE_URL/functions/v1/dune-scraper-trigger/pending-wallets?limit=10" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "📋 Wallets en attente:"
echo "$PENDING_RESPONSE" | jq '.wallets | length'

# Extraire les wallets
WALLETS=$(echo "$PENDING_RESPONSE" | jq -r '.wallets[]?.wallet_address // empty')
WALLET_IDS=$(echo "$PENDING_RESPONSE" | jq -r '.wallets[]?.id // empty')

if [ -z "$WALLETS" ]; then
    echo "ℹ️ Aucun wallet en attente d'enrichissement"
    exit 0
fi

echo ""
echo "2️⃣ Début de l'enrichissement..."

# Créer un job ID pour l'enrichissement
ENRICHMENT_JOB_ID="enrichment_$(date +%s)_$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 8)"

echo "🔍 Job d'enrichissement: $ENRICHMENT_JOB_ID"

# Marquer les wallets comme en cours de traitement
WALLET_IDS_ARRAY=$(echo "$PENDING_RESPONSE" | jq '[.wallets[]?.id] | map(tostring)')

echo ""
echo "3️⃣ Mise à jour du statut vers 'processing'..."
curl -s -X POST \
  "$SUPABASE_URL/functions/v1/dune-scraper-trigger/update-enrichment" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet_ids\": $WALLET_IDS_ARRAY,
    \"enrichment_status\": \"processing\",
    \"enrichment_job_id\": \"$ENRICHMENT_JOB_ID\"
  }" | jq '.'

echo ""
echo "4️⃣ Enrichissement des wallets individuels..."

ENRICHED_COUNT=0
FAILED_COUNT=0

for WALLET in $WALLETS; do
    echo "  🔄 Enrichissement de $WALLET..."
    
    # Appel à votre API d'enrichissement (exemple)
    ENRICHMENT_RESPONSE=$(curl -s \
      -X POST \
      "$ENRICHMENT_API_URL" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"wallet\": \"$WALLET\", \"job_id\": \"$ENRICHMENT_JOB_ID\"}")
    
    if [ $? -eq 0 ]; then
        echo "    ✅ $WALLET enrichi avec succès"
        ((ENRICHED_COUNT++))
    else
        echo "    ❌ Échec de l'enrichissement pour $WALLET"
        ((FAILED_COUNT++))
    fi
    
    # Pause pour éviter le rate limiting
    sleep 2
done

echo ""
echo "5️⃣ Mise à jour finale du statut..."

# Marquer les wallets comme complétés
curl -s -X POST \
  "$SUPABASE_URL/functions/v1/dune-scraper-trigger/update-enrichment" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet_ids\": $WALLET_IDS_ARRAY,
    \"enrichment_status\": \"completed\"
  }" | jq '.'

echo ""
echo "📊 Résultats de l'enrichissement:"
echo "  ✅ Enrichis avec succès: $ENRICHED_COUNT"
echo "  ❌ Échecs: $FAILED_COUNT"
echo "  🔧 Job ID: $ENRICHMENT_JOB_ID"

echo ""
echo "✅ Enrichissement terminé!"
