#!/bin/bash

# 🔥 Script de déploiement pour l'intégration auto-enrichissement
# Ce script déploie la nouvelle version de l'API Cielo avec enrichissement automatique

echo "🚀 Déploiement de l'API Cielo avec auto-enrichissement"
echo "=================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "supabase/functions/cielo-api" ]; then
    echo -e "${RED}❌ Erreur : Répertoire supabase/functions/cielo-api introuvable${NC}"
    echo "Assurez-vous d'être dans le répertoire racine du projet"
    exit 1
fi

# Vérifier que le fichier avec auto-enrichissement existe
if [ ! -f "supabase/functions/cielo-api/index-with-auto-enrichment.ts" ]; then
    echo -e "${RED}❌ Erreur : Fichier index-with-auto-enrichment.ts introuvable${NC}"
    exit 1
fi

# Étape 1 : Sauvegarder l'API actuelle
echo -e "${YELLOW}📦 Étape 1/4 : Sauvegarde de l'API actuelle...${NC}"
if [ -f "supabase/functions/cielo-api/index.ts" ]; then
    cp supabase/functions/cielo-api/index.ts supabase/functions/cielo-api/index-backup-$(date +%Y%m%d-%H%M%S).ts
    echo -e "${GREEN}✅ API actuelle sauvegardée${NC}"
else
    echo -e "${YELLOW}⚠️ Aucune API existante trouvée${NC}"
fi

# Étape 2 : Déployer la nouvelle version
echo -e "${YELLOW}🔄 Étape 2/4 : Déploiement de la nouvelle version...${NC}"
cp supabase/functions/cielo-api/index-with-auto-enrichment.ts supabase/functions/cielo-api/index.ts
echo -e "${GREEN}✅ Nouvelle version déployée localement${NC}"

# Étape 3 : Vérifier la configuration Supabase
echo -e "${YELLOW}🔧 Étape 3/4 : Vérification de la configuration...${NC}"
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ CLI Supabase détectée${NC}"
    
    # Vérifier la connexion au projet
    if supabase status &> /dev/null; then
        echo -e "${GREEN}✅ Projet Supabase connecté${NC}"
    else
        echo -e "${YELLOW}⚠️ Aucun projet Supabase actif détecté${NC}"
        echo "Vous devrez déployer manuellement avec :"
        echo "supabase functions deploy cielo-api"
        echo ""
        echo -e "${GREEN}✅ Déploiement local terminé${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️ CLI Supabase non trouvée${NC}"
    echo "Installez-la avec : npm i supabase -g"
    echo "Ou déployez manuellement sur votre dashboard Supabase"
    echo ""
    echo -e "${GREEN}✅ Déploiement local terminé${NC}"
    exit 0
fi

# Étape 4 : Déployer sur Supabase
echo -e "${YELLOW}🚀 Étape 4/4 : Déploiement sur Supabase...${NC}"
if supabase functions deploy cielo-api; then
    echo -e "${GREEN}✅ Déploiement sur Supabase réussi !${NC}"
else
    echo -e "${RED}❌ Échec du déploiement sur Supabase${NC}"
    echo "Restauration de l'ancienne version..."
    
    # Restaurer la sauvegarde la plus récente
    LATEST_BACKUP=$(ls -t supabase/functions/cielo-api/index-backup-*.ts 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" supabase/functions/cielo-api/index.ts
        echo -e "${GREEN}✅ Ancienne version restaurée${NC}"
    fi
    exit 1
fi

echo ""
echo "🎉 Déploiement terminé avec succès !"
echo "=================================================="
echo ""
echo "📋 Résumé :"
echo "- ✅ API sauvegardée"
echo "- ✅ Nouvelle version déployée"
echo "- ✅ Auto-enrichissement activé"
echo ""
echo "🧪 Test de l'API :"
echo 'curl -H "Authorization: Bearer YOUR_ANON_KEY" \'
echo '  "https://YOUR_PROJECT.supabase.co/functions/v1/cielo-api/complete/7FWe2NBekGSALpnHWj1yka8sHdpnFtrGHdA8feRGpYoQ"'
echo ""
echo "🔍 La réponse devrait contenir une section 'auto_enrichment' avec success: true"
echo ""
echo "📊 Vérifiez en base que les métriques sont automatiquement mises à jour !"
