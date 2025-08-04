#!/bin/bash

echo "🚀 Test rapide des nouveaux endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVER_URL="http://localhost:3001"

echo "1️⃣ Test de santé..."
curl -s "$SERVER_URL/health" | jq '.'

echo ""
echo "2️⃣ Liste des jobs..."
curl -s -H "Authorization: Bearer default-token" "$SERVER_URL/api/jobs" | jq '.'

echo ""
echo "3️⃣ Dashboard web disponible à:"
echo "   👉 $SERVER_URL/dashboard"
echo ""

echo "✅ Pour démarrer un job de test complet:"
echo "   ./test-endpoints.sh"
