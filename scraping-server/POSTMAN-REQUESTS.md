# 📮 Requêtes Postman - Scraping Solana Wallets

## Configuration de Base
```
Server: http://localhost:3000
Auth Token: default-token
```

---

## 1. Test de Santé du Serveur

**Method:** `GET`  
**URL:** `http://localhost:3000/health`  
**Headers:** Aucun  

**Réponse attendue:**
```json
{
  "status": "healthy",
  "server": "dune-scraping-server",
  "version": "1.0.0",
  "timestamp": "2025-08-04T...",
  "endpoints": {
    "GET /health": "Statut du serveur",
    "POST /api/start-scraping": "Démarrer un job de scraping",
    "GET /api/job-status/:jobId": "Statut d'un job",
    "GET /api/job-results/:jobId": "Résultats d'un job terminé",
    "GET /api/jobs": "Liste de tous les jobs"
  },
  "active_jobs": 0
}
```

---

## 2. Démarrer un Job de Scraping Solana Wallets

**Method:** `POST`  
**URL:** `http://localhost:3000/api/start-scraping`  
**Headers:**
```
Content-Type: application/json
Authorization: Bearer default-token
```

**Body (JSON):**
```json
{
  "jobId": "solana-wallets-test-001",
  "url": "https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3",
  "callback_url": "http://localhost:3000/webhook-test"
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "job_id": "solana-wallets-test-001",
  "status": "started",
  "message": "Scraping job démarré",
  "created_at": "2025-08-04T...",
  "url": "https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3",
  "endpoints": {
    "status": "/api/job-status/solana-wallets-test-001",
    "results": "/api/job-results/solana-wallets-test-001",
    "estimated_duration": "2-5 minutes"
  }
}
```

---

## 3. Vérifier le Statut du Job

**Method:** `GET`  
**URL:** `http://localhost:3000/api/job-status/solana-wallets-test-001`  
**Headers:**
```
Authorization: Bearer default-token
```

**Réponses possibles:**

### Job en cours:
```json
{
  "id": "solana-wallets-test-001",
  "status": "running",
  "created_at": "2025-08-04T...",
  "started_at": "2025-08-04T...",
  "url": "https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3",
  "current_page": 2,
  "total_pages": 5,
  "wallets_count": 87
}
```

### Job terminé:
```json
{
  "id": "solana-wallets-test-001",
  "status": "completed",
  "created_at": "2025-08-04T...",
  "started_at": "2025-08-04T...",
  "completed_at": "2025-08-04T...",
  "url": "https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3",
  "total_pages": 5,
  "wallets_count": 250
}
```

### Job échoué:
```json
{
  "id": "solana-wallets-test-001",
  "status": "failed",
  "created_at": "2025-08-04T...",
  "started_at": "2025-08-04T...",
  "completed_at": "2025-08-04T...",
  "error": "Aucun tableau trouvé sur la page. La structure de la page a peut-être changé."
}
```

---

## 4. Récupérer les Résultats Complets

**Method:** `GET`  
**URL:** `http://localhost:3000/api/job-results/solana-wallets-test-001`  
**Headers:**
```
Authorization: Bearer default-token
```

**Réponse (si job terminé):**
```json
{
  "job_id": "solana-wallets-test-001",
  "status": "completed",
  "completed_at": "2025-08-04T...",
  "wallets_count": 250,
  "total_pages": 5,
  "summary": {
    "total_wallets": 250,
    "pages_scraped": 5,
    "avg_wallets_per_page": 50,
    "scraping_duration": "187s"
  },
  "wallets": [
    {
      "wallet": "ABC123DEF456...",
      "solscan": "https://solscan.io/account/...",
      "gmgn": "https://gmgn.ai/wallet/...",
      "cielo": "https://cielo.finance/wallet/...",
      "wallet_pnl_link": "https://dune.com/...",
      "wallet_pnl": "$15,234.56",
      "total_bought_usd": "$50,000.00",
      "total_pnl_usd": "$15,234.56",
      "roi": "30.47%",
      "mroi": "28.12%",
      "invalids": "0",
      "tokens": "45",
      "nosells": "12",
      "losses": "8",
      "nulls": "2",
      "wins": "35",
      "winrate": "77.78%",
      "w2x": "15",
      "w10x": "5",
      "w100x": "1",
      "scalps": "20",
      "scalp_ratio": "44.44%",
      "bal": "$2,345.67",
      "bal_ratio": "4.69%",
      "last_trade": "2025-08-03T15:30:00Z",
      "trade_days": "87",
      "trade_nums": "156",
      "scraped_at": "2025-08-04T..."
    }
    // ... 249 autres wallets
  ]
}
```

---

## 5. Lister Tous les Jobs

**Method:** `GET`  
**URL:** `http://localhost:3000/api/jobs`  
**Headers:**
```
Authorization: Bearer default-token
```

**Réponse:**
```json
{
  "total_jobs": 3,
  "jobs": [
    {
      "id": "solana-wallets-test-001",
      "status": "completed",
      "created_at": "2025-08-04T...",
      "completed_at": "2025-08-04T...",
      "wallets_count": 250,
      "total_pages": 5,
      "error": null
    },
    {
      "id": "solana-wallets-test-002",
      "status": "running",
      "created_at": "2025-08-04T...",
      "completed_at": null,
      "wallets_count": 87,
      "total_pages": 5,
      "error": null
    }
  ]
}
```

---

## 🌐 Alternative: Dashboard Web

**URL:** `http://localhost:3000/dashboard`  
**Method:** Ouvrir dans un navigateur  
**Auth:** Aucune  

Interface web complète avec:
- Visualisation de tous les jobs
- Statuts en temps réel
- Aperçu des données
- Liens de téléchargement
- Auto-refresh

---

## 🔍 Diagnostics d'Erreurs

### Erreur 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Solution:** Vérifier le header `Authorization: Bearer default-token`

### Erreur 400 Bad Request
```json
{
  "error": "jobId and url required"
}
```
**Solution:** Vérifier que `jobId` et `url` sont présents dans le body

### Erreur 404 Job not found
```json
{
  "error": "Job not found"
}
```
**Solution:** Vérifier l'ID du job dans l'URL

### Job failed avec timeout
**Cause possible:** Page Dune non accessible ou structure changée  
**Solution:** Vérifier les logs du serveur et tester avec le script de diagnostic

---

## 🚀 Test Automatisé

**Alternative aux requêtes manuelles:**
```bash
cd /Users/helenemounissamy/scanDune/scraping-server
./test-solana-wallets.sh
```

Ce script automatise toutes les étapes et affiche les résultats en temps réel.
