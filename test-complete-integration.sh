#!/bin/bash

# Test complet de l'intégration scraping + base de données

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🧪 Test de l'intégration complète Scraping + Base de données"
echo "========================================================"

echo ""
echo "1️⃣ Vérification des endpoints disponibles..."
curl -s -X GET "$SUPABASE_URL/functions/v1/dune-scraper-trigger/endpoints" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo ""
echo "2️⃣ Démarrage d'un nouveau job de scraping..."

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
echo "🔍 Job ID récupéré: $JOB_ID"

echo ""
echo "3️⃣ Attente de 30 secondes pour que le scraping démarre..."
sleep 30

echo ""
echo "4️⃣ Vérification du statut du job..."
curl -s -X GET "$SUPABASE_URL/functions/v1/dune-scraper-trigger/status?job_id=$JOB_ID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo ""
echo "5️⃣ Vérification des wallets en attente d'enrichissement..."
curl -s -X GET "$SUPABASE_URL/functions/v1/dune-scraper-trigger/pending-wallets?limit=5" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo ""
echo "✅ Test terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Attendre que le job se termine (5-10 minutes)"
echo "  2. Vérifier les wallets sauvegardés en base"
echo "  3. Lancer l'enrichissement avec l'API complète"
