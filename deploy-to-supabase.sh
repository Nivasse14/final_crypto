#!/bin/bash

# Script de déploiement automatisé pour Supabase Edge Functions
# Projet: xkndddxqqlxqknbqtefv

set -e

echo "🚀 Déploiement des Edge Functions sur Supabase"
echo "📋 Projet: xkndddxqqlxqknbqtefv"
echo "-------------------------------------------"

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/config.toml" ]; then
    print_error "Fichier supabase/config.toml non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# Charger les variables d'environnement
if [ -f ".env" ]; then
    print_status "Chargement des variables d'environnement..."
    export $(grep -v '^#' .env | xargs)
    print_success "Variables d'environnement chargées"
else
    print_warning "Fichier .env non trouvé"
fi

# Vérifier la version de Supabase CLI
print_status "Vérification de Supabase CLI..."
SUPABASE_VERSION=$(supabase --version 2>/dev/null || echo "non installé")
echo "Version CLI: $SUPABASE_VERSION"

# Lister les fonctions disponibles
print_status "Fonctions Edge disponibles:"
for func in supabase/functions/*/; do
    if [ -d "$func" ]; then
        func_name=$(basename "$func")
        if [ -f "$func/index.ts" ]; then
            echo "  ✅ $func_name (index.ts présent)"
        else
            echo "  ❌ $func_name (index.ts manquant)"
        fi
    fi
done

# Fonction pour déployer une Edge Function spécifique
deploy_function() {
    local func_name=$1
    local project_ref="xkndddxqqlxqknbqtefv"
    
    print_status "Déploiement de la fonction: $func_name"
    
    if [ ! -f "supabase/functions/$func_name/index.ts" ]; then
        print_error "Fonction $func_name non trouvée"
        return 1
    fi
    
    # Vérifier la syntaxe TypeScript (si deno est disponible)
    if command -v deno &> /dev/null; then
        print_status "Vérification de la syntaxe TypeScript..."
        if deno check "supabase/functions/$func_name/index.ts"; then
            print_success "Syntaxe TypeScript validée"
        else
            print_warning "Erreurs de syntaxe détectées, mais on continue..."
        fi
    fi
    
    # Déployer avec curl (approche alternative si le CLI pose problème)
    print_status "Déploiement via API Supabase..."
    
    # Préparer le payload pour l'API de déploiement
    # Note: Cette approche nécessiterait l'API de déploiement Supabase
    # Pour l'instant, on utilise le CLI standard
    
    # Tentative de déploiement direct
    print_status "Exécution: supabase functions deploy $func_name --project-ref $project_ref"
    
    # Essayer le déploiement
    if supabase functions deploy "$func_name" --project-ref "$project_ref" --no-verify-jwt; then
        print_success "✅ Fonction $func_name déployée avec succès !"
        
        # Test rapide de la fonction
        FUNCTION_URL="https://$project_ref.supabase.co/functions/v1/$func_name"
        print_status "Test de la fonction déployée: $FUNCTION_URL"
        
        # Test simple avec curl
        if curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL" | grep -E "^(200|400|405)$" > /dev/null; then
            print_success "✅ Fonction accessible et répond"
        else
            print_warning "⚠️  Fonction déployée mais test d'accès échoué (normal pour certaines fonctions)"
        fi
        
        return 0
    else
        print_error "❌ Échec du déploiement de $func_name"
        return 1
    fi
}

# Menu principal
echo ""
echo "Que souhaitez-vous déployer ?"
echo "1. cielo-api (fonction principale ETL)"
echo "2. wallet-analyzer (analyseur de portefeuilles)"
echo "3. batch-processor (traitement par lots)"
echo "4. Toutes les fonctions"
echo "5. Déploiement manuel avec debug"

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        print_status "Déploiement de cielo-api..."
        deploy_function "cielo-api"
        ;;
    2)
        print_status "Déploiement de wallet-analyzer..."
        deploy_function "wallet-analyzer"
        ;;
    3)
        print_status "Déploiement de batch-processor..."
        deploy_function "batch-processor"
        ;;
    4)
        print_status "Déploiement de toutes les fonctions principales..."
        for func in "cielo-api" "wallet-analyzer" "batch-processor" "wallet-enrichment"; do
            if [ -f "supabase/functions/$func/index.ts" ]; then
                deploy_function "$func"
                echo ""
            fi
        done
        ;;
    5)
        print_status "Mode debug activé..."
        echo "Commandes manuelles à exécuter :"
        echo ""
        echo "1. Se connecter (si nécessaire):"
        echo "   supabase login"
        echo ""
        echo "2. Lier le projet:"
        echo "   supabase link --project-ref xkndddxqqlxqknbqtefv"
        echo ""
        echo "3. Déployer une fonction:"
        echo "   supabase functions deploy cielo-api --project-ref xkndddxqqlxqknbqtefv"
        echo ""
        echo "4. Vérifier le déploiement:"
        echo "   curl https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api"
        ;;
    *)
        print_error "Choix invalide"
        exit 1
        ;;
esac

print_success "🎉 Script de déploiement terminé !"
echo ""
echo "🔗 URLs des fonctions déployées:"
echo "   cielo-api: https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api"
echo "   wallet-analyzer: https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer"
echo ""
echo "📖 Pour tester les fonctions:"
echo "   curl -X POST https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"wallet_address\": \"your_wallet_address\"}'"
