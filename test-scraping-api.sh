#!/bin/bash

# Script de test pour l'API de scraping Dune

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🚀 Test de l'API de scraping Dune"
echo "================================"

# Test 1: Démarrer un job de scraping
echo ""
echo "1️⃣ Démarrage d'un job de scraping..."

response=$(curl -s \
  -X POST \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/functions/v1/dune-scraper-trigger/start")

echo "📤 Réponse:"
echo "$response" | jq '.'

# Extraire le job_id
job_id=$(echo "$response" | jq -r '.job_id // empty')

if [ -n "$job_id" ]; then
  echo "✅ Job ID: $job_id"
  
  # Test 2: Vérifier le statut
  echo ""
  echo "2️⃣ Vérification du statut..."
  
  for i in {1..5}; do
    echo "📊 Tentative $i/5..."
    
    status_response=$(curl -s \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      "$SUPABASE_URL/functions/v1/dune-scraper-trigger/status?job_id=$job_id")
    
    echo "$status_response" | jq '.'
    
    status=$(echo "$status_response" | jq -r '.status // empty')
    
    if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
      echo "🏁 Job terminé avec statut: $status"
      break
    fi
    
    echo "⏳ Attente 10 secondes..."
    sleep 10
  done
  
else
  echo "❌ Impossible de récupérer le job_id"
fi

echo ""
echo "🏁 Test terminé!"
