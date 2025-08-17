#!/bin/bash

# Solution simple : Script direct pour lancer le scraping et enrichissement
# Pas besoin d'API, juste des appels directs

SUPABASE_URL="https://xkndddxqqlxqknbqtefv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"

echo "🌅 Script automatique Dune - Workflow matinal"
echo "============================================="

# Fonction pour lancer le scraping Dune local
run_dune_scraping() {
  echo "🕷️ Étape 1: Scraping Dune Analytics..."
  
  cd scripts/
  
  # Vérifier si les dépendances sont installées
  if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
  fi
  
  # Lancer le scraping
  echo "🔄 Lancement du scraping..."
  node dune-scraper.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Scraping terminé avec succès!"
    return 0
  else
    echo "❌ Erreur lors du scraping"
    return 1
  fi
}

# Fonction pour vérifier les données en base
check_database() {
  echo ""
  echo "💾 Étape 2: Vérification des données en base..."
  
  WALLET_COUNT=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count // 0')
  
  echo "📊 Total wallets en base: $WALLET_COUNT"
  
  # Compter les wallets non enrichis
  NON_ENRICHED=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=count&or=(status.is.null,status.neq.enriched)" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].count // 0')
  
  echo "🔄 Wallets à enrichir: $NON_ENRICHED"
  
  return 0
}

# Fonction pour lancer l'enrichissement
run_enrichment() {
  local limit=${1:-50}
  
  echo ""
  echo "🔄 Étape 3: Enrichissement de $limit wallets..."
  
  # Récupérer les wallets non enrichis
  WALLETS=$(curl -s "$SUPABASE_URL/rest/v1/wallet_registry?select=id,wallet_address&or=(status.is.null,status.neq.enriched)&limit=$limit" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY")
  
  WALLET_COUNT=$(echo "$WALLETS" | jq '. | length')
  
  if [ "$WALLET_COUNT" -eq 0 ]; then
    echo "ℹ️ Aucun wallet à enrichir"
    return 0
  fi
  
  echo "📊 Enrichissement de $WALLET_COUNT wallets..."
  
  local enriched=0
  local failed=0
  
  # Enrichir chaque wallet
  echo "$WALLETS" | jq -r '.[] | "\(.id)|\(.wallet_address)"' | while IFS='|' read -r id address; do
    echo "🔄 Enrichissement $address..."
    
    # Appel à l'API cielo-api/complete
    RESPONSE=$(curl -s -w "%{http_code}" \
      "$SUPABASE_URL/functions/v1/cielo-api/complete/$address" \
      -H "Authorization: Bearer $SUPABASE_KEY")
    
    HTTP_CODE="${RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ]; then
      # Marquer comme enrichi
      curl -s -X PATCH "$SUPABASE_URL/rest/v1/wallet_registry?id=eq.$id" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"status": "enriched", "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > /dev/null
      
      echo "✅ $address enrichi"
      ((enriched++))
    else
      echo "❌ Échec $address (code: $HTTP_CODE)"
      ((failed++))
    fi
    
    # Pause pour éviter la surcharge
    sleep 2
  done
  
  echo ""
  echo "📊 Enrichissement terminé:"
  echo "   ✅ Réussis: $enriched"
  echo "   ❌ Échecs: $failed"
}

# Fonction principale
main() {
  local action=${1:-full}
  local limit=${2:-50}
  
  case "$action" in
    "full"|"workflow")
      echo "🚀 Workflow complet démarré..."
      
      # 1. Scraping
      if run_dune_scraping; then
        cd ..
        
        # 2. Vérification base
        check_database
        
        # 3. Enrichissement
        run_enrichment $limit
        
        echo ""
        echo "🎉 Workflow complet terminé!"
        echo "📊 Prochaine étape: Vérifiez vos données dans Supabase Dashboard"
      else
        echo "❌ Échec du workflow à l'étape scraping"
        exit 1
      fi
      ;;
    
    "scraping"|"scrape")
      run_dune_scraping
      cd ..
      check_database
      ;;
    
    "enrich"|"enrichment")
      check_database
      run_enrichment $limit
      ;;
    
    "check"|"status")
      check_database
      ;;
    
    *)
      echo "🎯 Utilisation:"
      echo "  ./simple-dune.sh full [N]        - Workflow complet (scraping + enrichissement N wallets)"
      echo "  ./simple-dune.sh scraping        - Scraping seulement"
      echo "  ./simple-dune.sh enrich [N]      - Enrichissement seulement (N wallets)"
      echo "  ./simple-dune.sh check           - Vérifier l'état de la base"
      echo ""
      echo "📋 Exemples:"
      echo "  ./simple-dune.sh full 100        # Workflow complet + 100 wallets enrichis"
      echo "  ./simple-dune.sh scraping        # Juste le scraping"
      echo "  ./simple-dune.sh enrich 50       # Enrichir 50 wallets"
      echo "  ./simple-dune.sh check           # Voir l'état de la base"
      ;;
  esac
}

# Lancer le script
main "$@"
