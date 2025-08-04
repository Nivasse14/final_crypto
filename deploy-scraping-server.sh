#!/bin/bash

# Script de déploiement rapide pour Railway.app

echo "🚀 Déploiement du serveur de scraping sur Railway.app"
echo "================================================="

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI non trouvé. Installation..."
    echo "💡 Exécutez: npm install -g @railway/cli"
    echo "   puis: railway login"
    exit 1
fi

# Aller dans le dossier du serveur
cd scraping-server

echo "📦 Installation des dépendances..."
npm install

echo "🔐 Configuration des variables d'environnement..."
railway variables set AUTH_TOKEN=$(openssl rand -base64 32)

echo "🚀 Déploiement sur Railway..."
railway up

echo ""
echo "✅ Déploiement terminé!"
echo "📡 Votre serveur sera disponible sur l'URL Railway"
echo "🔑 Token d'auth généré automatiquement"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Récupérer l'URL Railway: railway status"
echo "2. Configurer SCRAPING_SERVER_URL dans Supabase"
echo "3. Configurer SCRAPING_SERVER_TOKEN dans Supabase"
