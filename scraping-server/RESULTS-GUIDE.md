# 📊 Guide d'Utilisation - Visualisation des Résultats de Scraping

## 🚀 Nouveaux Endpoints Disponibles

### 1. **Dashboard Web** (Visualisation Facile)
```
GET /dashboard
```
**Description :** Interface web pour visualiser tous les jobs et leurs résultats  
**Authentification :** Aucune  
**Utilisation :** Ouvrir dans un navigateur  
**URL :** `http://localhost:3001/dashboard` (local) ou `https://votre-serveur.railway.app/dashboard`

**Fonctionnalités :**
- Liste de tous les jobs avec leur statut
- Aperçu des premiers portefeuilles pour les jobs terminés
- Téléchargement direct des résultats JSON
- Auto-refresh toutes les 30 secondes

### 2. **Résultats Complets d'un Job**
```
GET /api/job-results/:jobId
```
**Description :** Récupère tous les portefeuilles scrapés pour un job  
**Authentification :** Bearer Token requis  
**Réponse :** JSON avec résumé + liste complète des wallets

**Exemple :**
```bash
curl -H "Authorization: Bearer default-token" \
  "http://localhost:3001/api/job-results/test-123"
```

**Structure de réponse :**
```json
{
  "job_id": "test-123",
  "status": "completed",
  "completed_at": "2025-08-04T...",
  "wallets_count": 150,
  "total_pages": 3,
  "summary": {
    "total_wallets": 150,
    "pages_scraped": 3,
    "avg_wallets_per_page": 50,
    "scraping_duration": "127s"
  },
  "wallets": [
    {
      "wallet": "ABC123...",
      "total_pnl_usd": "$12,345",
      "roi": "245%",
      "winrate": "78%",
      // ... toutes les autres colonnes
    }
  ]
}
```

### 3. **Téléchargement Direct**
```
GET /download/:jobId?token=YOUR_TOKEN
```
**Description :** Télécharge les résultats en fichier JSON  
**Authentification :** Token en query parameter  
**Utilisation :** Lien direct téléchargeable

**Exemple :**
```
http://localhost:3001/download/test-123?token=default-token
```

### 4. **Liste de Tous les Jobs**
```
GET /api/jobs
```
**Description :** Aperçu de tous les jobs (sans les données complètes)  
**Authentification :** Bearer Token requis

## 🔄 Workflow Complet

### 1. Démarrer un Scraping
```bash
curl -X POST "http://localhost:3001/api/start-scraping" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer default-token" \
  -d '{
    "jobId": "mon-job-123",
    "url": "https://dune.com/queries/3398959/5690442"
  }'
```

**Réponse améliorée :**
```json
{
  "success": true,
  "job_id": "mon-job-123",
  "status": "started",
  "message": "Scraping job démarré",
  "created_at": "2025-08-04T...",
  "url": "https://dune.com/queries/3398959/5690442",
  "endpoints": {
    "status": "/api/job-status/mon-job-123",
    "results": "/api/job-results/mon-job-123",
    "estimated_duration": "2-5 minutes"
  }
}
```

### 2. Suivre le Statut
```bash
curl -H "Authorization: Bearer default-token" \
  "http://localhost:3001/api/job-status/mon-job-123"
```

### 3. Récupérer les Résultats
```bash
# Méthode 1: API JSON
curl -H "Authorization: Bearer default-token" \
  "http://localhost:3001/api/job-results/mon-job-123" > results.json

# Méthode 2: Dashboard web
open "http://localhost:3001/dashboard"

# Méthode 3: Téléchargement direct
curl "http://localhost:3001/download/mon-job-123?token=default-token" \
  -o "wallets-mon-job-123.json"
```

## 🧪 Script de Test Automatisé

Utilisez le script de test complet :
```bash
cd /Users/helenemounissamy/scanDune/scraping-server
./test-endpoints.sh
```

Ce script va :
1. Tester la santé du serveur
2. Démarrer un job de scraping
3. Suivre le statut en temps réel
4. Récupérer et afficher les résultats
5. Sauvegarder les données dans un fichier JSON

## 📱 Interface Web vs API

### **Dashboard Web** (Recommandé pour Debug)
- ✅ Facile d'utilisation
- ✅ Visualisation en temps réel
- ✅ Aucune authentification
- ✅ Auto-refresh automatique
- ✅ Aperçu des données

### **API JSON** (Recommandé pour Intégration)
- ✅ Données complètes
- ✅ Programmable
- ✅ Sécurisé (authentification)
- ✅ Format standardisé

## 🔧 Configuration Local vs Production

### **Local (Test):**
```bash
# Démarrer le serveur
cd /Users/helenemounissamy/scanDune/scraping-server
node server.js

# Accéder au dashboard
open "http://localhost:3001/dashboard"
```

### **Production (Railway):**
```bash
# Dashboard en ligne
open "https://votre-app.railway.app/dashboard"

# API en ligne
curl -H "Authorization: Bearer your-token" \
  "https://votre-app.railway.app/api/job-results/job-id"
```

## 📊 Format des Données de Portefeuilles

Chaque wallet scraped contient :
```json
{
  "wallet": "Address du wallet",
  "solscan": "Lien Solscan",
  "gmgn": "Lien GMGN", 
  "cielo": "Lien Cielo",
  "wallet_pnl_link": "Lien PnL",
  "wallet_pnl": "PnL du wallet",
  "total_bought_usd": "Total acheté en USD",
  "total_pnl_usd": "PnL total en USD",
  "roi": "Return on Investment",
  "mroi": "Modified ROI",
  "invalids": "Transactions invalides",
  "tokens": "Nombre de tokens",
  "nosells": "No sells",
  "losses": "Pertes",
  "nulls": "Nulls",
  "wins": "Gains",
  "winrate": "Taux de réussite",
  "w2x": "Wins 2x",
  "w10x": "Wins 10x", 
  "w100x": "Wins 100x",
  "scalps": "Scalps",
  "scalp_ratio": "Ratio de scalp",
  "bal": "Balance",
  "bal_ratio": "Ratio de balance",
  "last_trade": "Dernier trade",
  "trade_days": "Jours de trading",
  "trade_nums": "Nombre de trades",
  "scraped_at": "Timestamp du scraping"
}
```

Maintenant vous avez une visibilité complète sur vos données scrapées ! 🎉
