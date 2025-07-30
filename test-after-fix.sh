#!/bin/bash
# Script de test après correction de la base de données

echo "🧪 TESTS APRÈS CORRECTION DB"
echo "============================="

echo ""
echo "📍 Répertoire actuel: $(pwd)"

echo ""
echo "1️⃣ Test des types de colonnes..."
cd /Users/helenemounissamy/scanDune/CLEAN
node test-column-types.js

echo ""
echo "2️⃣ Test API Supabase..."
node test.js

echo ""
echo "3️⃣ Test script GMGN..."
cd /Users/helenemounissamy/scanDune/scripts
node -e "const { GMGNApiService } = require('./api-gmgn.js'); new GMGNApiService().processWalletComplete('2bdcq3CfFZfZ5e5RNMv4w3nTFHGzyJEM1cuFf8E4AQth')"

echo ""
echo "🎉 Tests terminés !"
