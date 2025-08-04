#!/bin/bash

# Test de l'API de déclenchement de scraping sur Supabase

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🧪 Test de l'API Dune Scraper Trigger"
echo "===================================="

echo ""
echo "1️⃣ Démarrage du scraping..."

JOB_RESPONSE=$(curl -s \
  -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/dune-scraper-trigger/start")

echo "📤 Réponse du démarrage:"
echo "$JOB_RESPONSE" | jq '.'

# Extraire le job_id
JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.job_id // empty')

if [ -z "$JOB_ID" ]; then
    echo "❌ Impossible de récupérer le job_id"
    exit 1
fi

echo ""
echo "🔍 Job ID: $JOB_ID"
echo "⏳ Surveillance du statut (vérification toutes les 30 secondes)..."

# Boucle de surveillance
for i in {1..20}; do
    echo ""
    echo "📊 Vérification $i/20..."
    
    STATUS_RESPONSE=$(curl -s \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      "$SUPABASE_URL/functions/v1/dune-scraper-trigger/status?job_id=$JOB_ID")
    
    echo "$STATUS_RESPONSE" | jq '{
        status: .status,
        current_page: .current_page,
        total_pages: .total_pages,
        wallets_count: .wallets_count,
        message: .message
    }'
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "unknown"')
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo "✅ Scraping terminé avec succès!"
        WALLET_COUNT=$(echo "$STATUS_RESPONSE" | jq -r '.wallets_count // 0')
        echo "🎯 Résultat: $WALLET_COUNT wallets récupérés"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ Scraping échoué:"
        echo "$STATUS_RESPONSE" | jq '.error'
        break
    fi
    
    sleep 30
done

echo ""
echo "🏁 Test terminé!"
