#!/bin/bash

echo "🧪 Test des endpoints du serveur de scraping"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
SERVER_URL="${1:-http://localhost:3001}"
AUTH_TOKEN="${2:-default-token}"
JOB_ID="test-$(date +%s)"
DUNE_URL="https://dune.com/queries/3398959/5690442"

echo "🔧 Configuration:"
echo "   Serveur: $SERVER_URL"
echo "   Job ID: $JOB_ID"
echo ""

# Test 1: Vérifier la santé du serveur
echo "1️⃣ Test de santé du serveur..."
curl -s "$SERVER_URL/health" | jq '.'
echo ""

# Test 2: Lister les jobs existants
echo "2️⃣ Liste des jobs existants..."
curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/jobs" | jq '.'
echo ""

# Test 3: Démarrer un nouveau job
echo "3️⃣ Démarrage d'un nouveau job de scraping..."
START_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/start-scraping" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"url\": \"$DUNE_URL\",
    \"callback_url\": \"$SERVER_URL/webhook-test\"
  }")

echo "$START_RESPONSE" | jq '.'
echo ""

# Test 4: Vérifier le statut du job
echo "4️⃣ Vérification du statut du job..."
sleep 2
curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-status/$JOB_ID" | jq '.'
echo ""

# Test 5: Attendre et récupérer les résultats
echo "5️⃣ Attente de la fin du scraping (max 3 minutes)..."
MAX_ATTEMPTS=36  # 3 minutes = 36 * 5 secondes
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-status/$JOB_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    
    echo "   Tentative $ATTEMPT/$MAX_ATTEMPTS - Statut: $STATUS"
    
    if [ "$STATUS" = "completed" ]; then
        echo "✅ Job terminé avec succès !"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Job échoué !"
        echo "$STATUS_RESPONSE" | jq '.'
        exit 1
    fi
    
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "⏰ Timeout atteint, récupération du statut final..."
    curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-status/$JOB_ID" | jq '.'
else
    # Test 6: Récupérer les résultats complets
    echo ""
    echo "6️⃣ Récupération des résultats complets..."
    RESULTS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-results/$JOB_ID")
    
    # Afficher le résumé
    echo "$RESULTS_RESPONSE" | jq '{
        job_id: .job_id,
        status: .status,
        completed_at: .completed_at,
        wallets_count: .wallets_count,
        summary: .summary
    }'
    
    echo ""
    echo "7️⃣ Aperçu des premiers portefeuilles (5 premiers)..."
    echo "$RESULTS_RESPONSE" | jq '.wallets[0:5] | map({
        wallet: .wallet,
        total_pnl_usd: .total_pnl_usd,
        roi: .roi,
        winrate: .winrate,
        tokens: .tokens
    })'
    
    # Sauvegarder les résultats complets
    echo ""
    echo "💾 Sauvegarde des résultats complets..."
    echo "$RESULTS_RESPONSE" > "scraping-results-$JOB_ID.json"
    echo "   Fichier sauvé: scraping-results-$JOB_ID.json"
    
    WALLET_COUNT=$(echo "$RESULTS_RESPONSE" | jq -r '.wallets_count')
    echo "   Total portefeuilles: $WALLET_COUNT"
fi

echo ""
echo "8️⃣ État final de tous les jobs..."
curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/jobs" | jq '.'

echo ""
echo "✅ Test terminé !"
