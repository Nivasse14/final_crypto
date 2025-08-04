# 🗄️ Intégration Base de Données - Scraping Dune + Enrichissement

## ✅ Fonctionnalités Ajoutées

### 1. **Persistance en Base Supabase** 📊
- Table `scraped_wallets` pour stocker tous les portefeuilles scrapés
- Métadonnées complètes : dates, job IDs, URLs sources
- Statut d'enrichissement pour chaque wallet

### 2. **Workflow d'Enrichissement** 🔄
- Récupération des wallets en attente (`pending`)
- Appel à l'API d'enrichissement pour chaque adresse
- Suivi du statut : `pending` → `processing` → `completed`

### 3. **API Complète** 🔗
- Nouveaux endpoints pour gérer la persistance
- Intégration avec le système existant
- Prêt pour l'automatisation

## 🏗️ Structure de la Table `scraped_wallets`

```sql
CREATE TABLE scraped_wallets (
  id                  BIGSERIAL PRIMARY KEY,
  
  -- Métadonnées de scraping
  scraping_job_id     TEXT NOT NULL,
  scraped_at          TIMESTAMPTZ DEFAULT NOW(),
  dune_url            TEXT NOT NULL,
  
  -- Données du wallet
  wallet_address      TEXT NOT NULL,
  solscan_url         TEXT,
  gmgn_url            TEXT,
  cielo_url           TEXT,
  wallet_pnl_link     TEXT,
  
  -- Métriques financières (toutes en TEXT pour conserver les formats originaux)
  wallet_pnl          TEXT,
  total_bought_usd    TEXT,
  total_pnl_usd       TEXT,
  roi                 TEXT,
  mroi                TEXT,
  
  -- Statistiques de trading
  invalids            TEXT,
  tokens              TEXT,
  nosells             TEXT,
  losses              TEXT,
  nulls               TEXT,
  wins                TEXT,
  winrate             TEXT,
  w2x                 TEXT,
  w10x                TEXT,
  w100x               TEXT,
  scalps              TEXT,
  scalp_ratio         TEXT,
  bal                 TEXT,
  bal_ratio           TEXT,
  last_trade          TEXT,
  trade_days          TEXT,
  trade_nums          TEXT,
  
  -- Gestion de l'enrichissement
  enrichment_status   TEXT DEFAULT 'pending',  -- pending|processing|completed|failed
  enriched_at         TIMESTAMPTZ,
  enrichment_job_id   TEXT,
  
  -- Métadonnées système
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔗 Nouveaux Endpoints API

### **GET** `/pending-wallets`
Récupère les wallets en attente d'enrichissement.

**Paramètres** :
- `limit` (optionnel) : Nombre max de résultats (défaut: 100)
- `offset` (optionnel) : Décalage pour la pagination (défaut: 0)

**Réponse** :
```json
{
  "success": true,
  "wallets": [
    {
      "id": 123,
      "wallet_address": "ABC123...",
      "scraping_job_id": "job_1754305846442_dwmr1wqpd",
      "scraped_at": "2025-08-04T11:10:46.889Z",
      "enrichment_status": "pending",
      // ... autres champs
    }
  ],
  "count": 1520,
  "limit": 100,
  "offset": 0,
  "has_more": true
}
```

### **POST** `/update-enrichment`
Met à jour le statut d'enrichissement des wallets.

**Body** :
```json
{
  "wallet_ids": [123, 124, 125],
  "enrichment_status": "completed",
  "enrichment_job_id": "enrichment_1754306000_abc12345"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Statut d'enrichissement mis à jour",
  "updated_count": 3
}
```

## 📈 Workflow Complet

### 1. **Scraping Initial**
```bash
# Démarrer le scraping
curl -X POST "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/start" \
  -H "Authorization: Bearer YOUR_KEY"

# Les données sont automatiquement sauvegardées en base via le webhook
```

### 2. **Enrichissement des Wallets**
```bash
# 1. Récupérer les wallets en attente
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/pending-wallets?limit=50"

# 2. Marquer comme en traitement
curl -X POST "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/update-enrichment" \
  -d '{"wallet_ids": [1,2,3], "enrichment_status": "processing"}'

# 3. Appeler l'API d'enrichissement pour chaque wallet
# (via votre API existante)

# 4. Marquer comme terminé
curl -X POST "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/update-enrichment" \
  -d '{"wallet_ids": [1,2,3], "enrichment_status": "completed"}'
```

## 🔧 Scripts Utilitaires

### **test-complete-integration.sh**
Test complet de l'intégration scraping + base de données.

### **enrich-scraped-wallets.sh**
Script automatique pour enrichir les wallets en attente.

### **create-table-scraped-wallets.sh**
Création de la table en base de données.

## 🎯 Intégration avec l'API Existante

### Modification Nécessaire dans votre API d'enrichissement :

```javascript
// Exemple d'intégration dans votre fonction d'enrichissement
app.post('/api/enrich-batch', async (req, res) => {
  const { wallet_addresses, enrichment_job_id } = req.body;
  
  try {
    // 1. Marquer comme en traitement
    await supabase
      .from('scraped_wallets')
      .update({ 
        enrichment_status: 'processing',
        enrichment_job_id: enrichment_job_id 
      })
      .in('wallet_address', wallet_addresses);
    
    // 2. Enrichir chaque wallet
    for (const wallet of wallet_addresses) {
      // Votre logique d'enrichissement existante
      await enrichWallet(wallet);
    }
    
    // 3. Marquer comme terminé
    await supabase
      .from('scraped_wallets')
      .update({ 
        enrichment_status: 'completed',
        enriched_at: new Date().toISOString()
      })
      .in('wallet_address', wallet_addresses);
    
    res.json({ success: true, enriched_count: wallet_addresses.length });
    
  } catch (error) {
    // Marquer comme échoué en cas d'erreur
    await supabase
      .from('scraped_wallets')
      .update({ enrichment_status: 'failed' })
      .in('wallet_address', wallet_addresses);
      
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 Requêtes SQL Utiles

### Statistiques de scraping
```sql
SELECT 
  scraping_job_id,
  COUNT(*) as total_wallets,
  MIN(scraped_at) as started_at,
  MAX(scraped_at) as completed_at
FROM scraped_wallets 
GROUP BY scraping_job_id 
ORDER BY started_at DESC;
```

### Statut d'enrichissement
```sql
SELECT 
  enrichment_status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM scraped_wallets 
GROUP BY enrichment_status;
```

### Wallets récemment scrapés
```sql
SELECT 
  wallet_address,
  total_pnl_usd,
  roi,
  winrate,
  scraped_at,
  enrichment_status
FROM scraped_wallets 
WHERE scraped_at > NOW() - INTERVAL '24 hours'
ORDER BY scraped_at DESC
LIMIT 100;
```

## ✅ Prochaines Étapes

1. **Créer la table** via le dashboard Supabase (SQL Editor)
2. **Déployer** la fonction mise à jour
3. **Tester** l'intégration complète
4. **Connecter** avec votre API d'enrichissement existante
5. **Automatiser** le workflow complet

## 🚀 Résultat Final

**Workflow automatique complet** :
1. 🕷️ **Scraping** → Dune Analytics (toutes les pages)
2. 💾 **Persistance** → Base Supabase (avec métadonnées)
3. 🔍 **Enrichissement** → API complète (données détaillées)
4. 📊 **Analyse** → Données consolidées prêtes à l'emploi

**L'infrastructure est maintenant prête pour un pipeline de données complètement automatisé !** 🎯
