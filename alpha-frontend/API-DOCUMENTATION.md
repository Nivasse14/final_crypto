# 🚀 Documentation complète des APIs scanDune

## 1. 🌐 URLs de base

```
SUPABASE_URL = https://xkndddxqqlxqknbqtefv.supabase.co
API_BASE = ${SUPABASE_URL}/functions/v1
```

## 2. 🔑 APIs principales

### 2.1 API Cielo (`/cielo-api`)

#### Endpoints Wallet
- `GET /cielo-api/complete/{address}` - Données complètes du wallet
  - Retourne: Portfolio, stats, PnL, behavioral analysis, copy trading metrics
  - Paramètres: None
  - Auth: Bearer token

- `GET /cielo-api/portfolio/{address}` - Portfolio uniquement
  - Retourne: Liste des tokens détenus
  - Paramètres: None
  - Auth: Bearer token

- `GET /cielo-api/stats/{address}` - Statistiques uniquement
  - Retourne: Métriques de performance
  - Paramètres: None
  - Auth: Bearer token

- `GET /cielo-api/pnl/{address}` - PnL data uniquement
  - Retourne: Profit & Loss détaillé
  - Paramètres: None
  - Auth: Bearer token

- `GET /cielo-api/tokens-pnl/{address}` - PnL par token
  - Paramètres:
    - page: Numéro de page (default: 1)
    - chains: Filtrer par chaînes
    - timeframe: Période d'analyse
    - sortBy: Tri des résultats
    - tokenFilter: Filtrer par tokens

#### Endpoints Analytics
- `GET /cielo-api/stats-7d/{address}` - Stats sur 7 jours
- `GET /cielo-api/stats-aggregated/{address}` - Stats agrégées
  - Paramètre: days (7 ou "max")
- `GET /cielo-api/profitability/{address}` - Analyse de profitabilité
- `GET /cielo-api/track-status/{address}` - Statut du tracking

#### Endpoints Enrichissement
- `GET /cielo-api/test-gecko/{token}/{network}` - Test Gecko API
- `GET /cielo-api/gecko-api-test/{type}/{param}` - Tests API Gecko avancés
  - Types: pools, token, networks, trending, dexes, pool-specific, pool-p1

#### Endpoints Système
- `GET /cielo-api/health` - Health check
  - Retourne: Status système, version, endpoints disponibles

### 2.2 API Enrichissement (`/wallet-enrichment`)

#### Endpoints Batch
- `POST /wallet-enrichment/batch-process` - Process batch de wallets
  - Body: 
    ```json
    {
      "batchSize": number,
      "status": string,
      "limit": number
    }
    ```

#### Endpoints Stats
- `GET /wallet-enrichment/stats` - Statistiques d'enrichissement
  - Retourne: Comptage par statut

### 2.3 API Monitoring (`/system-monitoring`)

#### Endpoints Health
- `GET /system-monitoring/health` - Health check système
  - Retourne: État global du système

#### Endpoints Analytics
- `GET /system-monitoring/stats` - Stats de la registry
- `GET /system-monitoring/priority-wallets` - Wallets prioritaires
  - Paramètres:
    - limit: Nombre max (default: 50)
    - min_pnl: PnL minimum (default: 10000)

#### Endpoints Logs & Performance
- `GET /system-monitoring/batch-logs` - Logs de batch processing
  - Paramètres:
    - limit: Nombre de logs (default: 20)
    - hours: Fenêtre temporelle (default: 24)

- `GET /system-monitoring/api-performance` - Métriques de performance
  - Paramètres:
    - limit: Nombre de métriques
    - hours: Fenêtre temporelle
    - endpoint: Filtrer par endpoint

#### Endpoints Maintenance
- `POST /system-monitoring/reset-failed` - Reset des wallets failed
- `POST /system-monitoring/cleanup-logs` - Nettoyage des vieux logs
- `POST /system-monitoring/trigger-batch` - Trigger manuel de batch
  - Body: 
    ```json
    {
      "batchSize": number,
      "status": string,
      "limit": number
    }
    ```

### 2.4 API Scraping Dune (`/dune-scraper-trigger`)

#### Endpoints Scraping
- `POST /dune-scraper-trigger/start` - Démarrer le scraping
- `GET /dune-scraper-trigger/status` - Vérifier le statut
  - Paramètre: job_id

#### Endpoints Data
- `GET /dune-scraper-trigger/pending-wallets` - Liste des wallets en attente
  - Paramètres:
    - limit: Nombre max
    - offset: Offset pagination

- `POST /dune-scraper-trigger/webhook` - Webhook pour les résultats
- `POST /dune-scraper-trigger/update-enrichment` - Update du statut d'enrichissement

## 3. 🔐 Authentification

Toutes les APIs nécessitent un header d'authentification:
```
Authorization: Bearer ${SUPABASE_ANON_KEY}
```

## 4. 📊 Formats de réponse

Toutes les réponses suivent le format:
```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "timestamp": string
}
```

## 5. 🚦 Gestion des erreurs

Codes HTTP standards:
- 200: Succès
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 500: Erreur serveur

## 6. 🔄 Websocket

Connection Supabase Realtime disponible pour:
- Updates de statut des wallets
- Notifications de batch processing
- Alertes système

## 7. 🎯 Best Practices

1. Utiliser le endpoint `/complete` pour les données complètes
2. Monitorer la performance avec `/system-monitoring/api-performance`
3. Gérer les erreurs avec exponential backoff
4. Utiliser les webhooks pour les opérations longues
5. Vérifier régulièrement le health check
