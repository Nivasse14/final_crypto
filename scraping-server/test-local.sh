#!/bin/bash

echo "🔍 Lancement du test local de scraping Dune..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$(dirname "$0")"

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🚀 Démarrage du test (mode debug avec browser visible)..."
echo "   - Le navigateur va s'ouvrir en mode visible"
echo "   - Vous pourrez voir ce qui se passe en temps réel"
echo "   - Le test analysera les sélecteurs de pagination et de tableau"
echo "   - Durée: ~30 secondes pour inspection manuelle"
echo ""

node local-test.js

echo ""
echo "✅ Test terminé. Vérifiez les logs ci-dessus pour diagnostiquer le problème."
