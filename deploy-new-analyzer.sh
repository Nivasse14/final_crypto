#!/bin/bash

echo "🚀 DÉPLOIEMENT DE LA NOUVELLE API WALLET ANALYZER"
echo "================================================"

# Vérification de l'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    exit 1
fi

# Source des variables d'environnement
source .env

# 1. Créer la table analysis_jobs
echo "📊 Création de la table analysis_jobs..."
if ! psql "$SUPABASE_DB_URL" -f create-analysis-jobs-table.sql; then
    echo "⚠️  Erreur lors de la création de la table (peut-être déjà existante)"
fi

# 2. Déployer la nouvelle Edge Function
echo "🔥 Déploiement de l'Edge Function wallet-analyzer..."
if ! npx supabase functions deploy wallet-analyzer --no-verify-jwt; then
    echo "❌ Erreur lors du déploiement de la fonction"
    exit 1
fi

# 3. Tester la fonction
echo "🧪 Test de la fonction déployée..."
node test-new-wallet-analyzer.js

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 ENDPOINTS DISPONIBLES:"
echo "  🚀 Analyse rapide (30s)    : GET  /functions/v1/wallet-analyzer/quick/{wallet}"
echo "  🔍 Analyse complète (5-10m): POST /functions/v1/wallet-analyzer/complete/{wallet}"
echo "  📊 Statut d'analyse        : GET  /functions/v1/wallet-analyzer/status/{job_id}"
echo "  🏥 Health check            : GET  /functions/v1/wallet-analyzer/health"
echo ""
echo "🎯 DIFFÉRENCES CLÉS:"
echo "  • Analyse RAPIDE  : Données enrichies + simulées (30 secondes)"
echo "  • Analyse COMPLÈTE: Vraie blockchain + métriques avancées (5-10 minutes)"
echo ""
echo "📖 USAGE:"
echo "  curl '$SUPABASE_URL/functions/v1/wallet-analyzer/quick/HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH' \\"
echo "       -H \"Authorization: Bearer \$SUPABASE_ANON_KEY\""
