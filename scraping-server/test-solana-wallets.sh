#!/bin/bash

echo "🧪 Test Complet - Scraping Solana Top Wallets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
SERVER_URL="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-default-token}"
JOB_ID="solana-wallets-$(date +%s)"
DUNE_URL="https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3"

echo "🔧 Configuration:"
echo "   Serveur: $SERVER_URL"
echo "   Job ID: $JOB_ID"
echo "   URL Dune: $DUNE_URL"
echo "   Token: $AUTH_TOKEN"
echo ""

# Test 1: Vérifier la santé du serveur
echo "1️⃣ Test de santé du serveur..."
HEALTH_RESPONSE=$(curl -s "$SERVER_URL/health")
echo "$HEALTH_RESPONSE" | jq '.'

if [ $? -ne 0 ]; then
    echo "❌ Serveur non accessible. Vérifiez qu'il est démarré sur le port 3000"
    exit 1
fi

echo ""

# Test 2: Démarrer le job de scraping
echo "2️⃣ Démarrage du job de scraping Solana wallets..."
START_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/start-scraping" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"url\": \"$DUNE_URL\",
    \"callback_url\": \"$SERVER_URL/webhook-test\"
  }")

echo "$START_RESPONSE" | jq '.'

# Vérifier si le job a démarré
JOB_STARTED=$(echo "$START_RESPONSE" | jq -r '.success')
if [ "$JOB_STARTED" != "true" ]; then
    echo "❌ Impossible de démarrer le job"
    echo "Réponse: $START_RESPONSE"
    exit 1
fi

echo ""

# Test 3: Suivre le statut du job
echo "3️⃣ Suivi du statut du job (max 5 minutes)..."
MAX_ATTEMPTS=60  # 5 minutes = 60 * 5 secondes
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-status/$JOB_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    CURRENT_PAGE=$(echo "$STATUS_RESPONSE" | jq -r '.current_page // 0')
    TOTAL_PAGES=$(echo "$STATUS_RESPONSE" | jq -r '.total_pages // 1')
    WALLETS_COUNT=$(echo "$STATUS_RESPONSE" | jq -r '.wallets_count // 0')
    
    echo "   ⏱️  Tentative $ATTEMPT/$MAX_ATTEMPTS - Statut: $STATUS"
    
    if [ "$STATUS" = "running" ]; then
        echo "      📄 Page: $CURRENT_PAGE/$TOTAL_PAGES | Portefeuilles: $WALLETS_COUNT"
    fi
    
    if [ "$STATUS" = "completed" ]; then
        echo "✅ Job terminé avec succès !"
        echo "📊 Résumé final:"
        echo "   - Pages scrapées: $TOTAL_PAGES"
        echo "   - Portefeuilles trouvés: $WALLETS_COUNT"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Job échoué !"
        echo "Détails de l'erreur:"
        echo "$STATUS_RESPONSE" | jq '.'
        exit 1
    fi
    
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "⏰ Timeout atteint (5 minutes), récupération du statut final..."
    curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-status/$JOB_ID" | jq '.'
    echo ""
    echo "ℹ️  Le scraping prend peut-être plus de temps. Vérifiez le dashboard:"
    echo "   👉 $SERVER_URL/dashboard"
    exit 1
fi

# Test 4: Récupérer les résultats complets
echo ""
echo "4️⃣ Récupération des résultats complets..."
RESULTS_RESPONSE=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$SERVER_URL/api/job-results/$JOB_ID")

# Afficher le résumé
echo "📊 Résumé des résultats:"
echo "$RESULTS_RESPONSE" | jq '{
    job_id: .job_id,
    status: .status,
    completed_at: .completed_at,
    wallets_count: .wallets_count,
    summary: .summary
}'

echo ""
echo "5️⃣ Aperçu des meilleurs portefeuilles (top 5)..."
echo "$RESULTS_RESPONSE" | jq '.wallets[0:5] | map({
    wallet: .wallet[0:20] + "...",
    total_pnl_usd: .total_pnl_usd,
    roi: .roi,
    winrate: .winrate,
    tokens: .tokens,
    last_trade: .last_trade
})'

# Sauvegarder les résultats complets
echo ""
echo "6️⃣ Sauvegarde des résultats..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="solana-wallets-$TIMESTAMP.json"
echo "$RESULTS_RESPONSE" > "$FILENAME"
echo "💾 Fichier sauvé: $FILENAME"

WALLET_COUNT=$(echo "$RESULTS_RESPONSE" | jq -r '.wallets_count')
echo "📈 Total de portefeuilles scrapés: $WALLET_COUNT"

# Statistiques rapides
echo ""
echo "7️⃣ Statistiques rapides..."
echo "$RESULTS_RESPONSE" | jq -r '.wallets[] | .total_pnl_usd' | grep -E '^[\$]?[0-9,]+\.?[0-9]*$' | head -10 > /tmp/pnl_values.txt

if [ -s /tmp/pnl_values.txt ]; then
    TOP_PNL=$(head -1 /tmp/pnl_values.txt)
    echo "💰 Meilleur PnL: $TOP_PNL"
else
    echo "ℹ️  Impossible de calculer les statistiques PnL"
fi

echo ""
echo "8️⃣ Liens utiles:"
echo "   🌐 Dashboard: $SERVER_URL/dashboard"
echo "   📥 Téléchargement: $SERVER_URL/download/$JOB_ID?token=$AUTH_TOKEN"
echo "   📋 Statut: $SERVER_URL/api/job-status/$JOB_ID"

echo ""
echo "✅ Test terminé avec succès !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
