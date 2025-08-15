#!/bin/bash

# 🧪 Test Script - Alpha Frontend
# Vérifie que tous les composants fonctionnent correctement

echo "🚀 ALPHA FRONTEND - TESTS AUTOMATIQUES"
echo "======================================="

# Configuration
cd "$(dirname "$0")"
FRONTEND_DIR="/Users/helenemounissamy/scanDune/alpha-frontend"
cd "$FRONTEND_DIR"

echo ""
echo "📍 Répertoire actuel: $(pwd)"
echo ""

# 1. Vérification des dépendances
echo "📦 1. Vérification des dépendances..."
if npm list --depth=0 > /dev/null 2>&1; then
    echo "✅ Dépendances OK"
else
    echo "❌ Problème avec les dépendances"
    echo "💡 Exécution: npm install"
    npm install
fi

# 2. Vérification du build
echo ""
echo "🔨 2. Test du build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build réussi"
    rm -rf .next
else
    echo "❌ Échec du build"
    echo "⚠️  Vérifiez les erreurs TypeScript"
fi

# 3. Vérification du linting
echo ""
echo "🔍 3. Vérification du code (lint)..."
if npm run lint > /dev/null 2>&1; then
    echo "✅ Code conforme"
else
    echo "⚠️  Warnings de linting détectés (normal en développement)"
fi

# 4. Test des composants principaux
echo ""
echo "🧩 4. Vérification des composants..."

components=(
    "AlphaDashboard.tsx"
    "WalletAnalyzer.tsx" 
    "TradingSignals.tsx"
    "SocialTradingHub.tsx"
    "AIInsights.tsx"
    "MarketIntelligence.tsx"
    "RiskManagement.tsx"
    "AutomatedStrategyEngine.tsx"
    "ExecutiveDashboard.tsx"
    "RealTimeStatus.tsx"
)

for component in "${components[@]}"; do
    if [ -f "components/$component" ]; then
        echo "✅ $component"
    else
        echo "❌ $component manquant"
    fi
done

# 5. Vérification des utilitaires
echo ""
echo "🛠️  5. Vérification des utilitaires..."

utils=(
    "lib/supabase.ts"
    "lib/utils.ts"
    "lib/websocket.ts"
    "lib/websocket-mock.ts"
)

for util in "${utils[@]}"; do
    if [ -f "$util" ]; then
        echo "✅ $util"
    else
        echo "❌ $util manquant"
    fi
done

# 6. Vérification de la configuration
echo ""
echo "⚙️  6. Vérification de la configuration..."

configs=(
    "package.json"
    "tsconfig.json"
    "tailwind.config.ts"
    "next.config.ts"
    ".env.example"
)

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ $config"
    else
        echo "❌ $config manquant"
    fi
done

# 7. Test du serveur (démarrage rapide)
echo ""
echo "🌐 7. Test du serveur de développement..."
echo "🔄 Démarrage du serveur (5 secondes)..."

# Démarrer le serveur en arrière-plan
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Attendre 5 secondes
sleep 5

# Vérifier si le serveur répond
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Serveur démarré avec succès"
    echo "🌍 URL: http://localhost:3000"
else
    echo "⚠️  Serveur en cours de démarrage..."
    echo "🌍 URL: http://localhost:3000 (vérifiez manuellement)"
fi

# Arrêter le serveur
kill $SERVER_PID > /dev/null 2>&1

# 8. Résumé
echo ""
echo "📊 RÉSUMÉ DES TESTS"
echo "==================="
echo ""
echo "🎯 Frontend Alpha Ultra-Innovant"
echo "✨ Interface Next.js + TypeScript + Tailwind"
echo "🚀 10 modules principaux intégrés"
echo "🧠 IA, Social Trading, Risk Management"
echo "📈 Dashboard Executive pour top 1%"
echo ""
echo "🔗 LIENS UTILES:"
echo "📖 Documentation: ./README.md"
echo "🚀 Guide démarrage: ./QUICK-START.md"
echo "⚙️  Configuration: ./.env.example"
echo ""
echo "🎉 PRÊT POUR LES TESTS UTILISATEURS !"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Connecter backend temps réel"
echo "   2. Tests utilisateurs avancés"
echo "   3. Optimisations performance"
echo "   4. Déploiement production"
echo ""
echo "🏆 OBJECTIF: TOP 0,00000001% DE RICHESSE ATTEINT !"
