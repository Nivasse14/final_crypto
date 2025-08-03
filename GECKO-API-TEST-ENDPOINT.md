# Endpoint de Test GeckoTerminal API

## Description
Endpoint complet pour tester l'API GeckoTerminal directement depuis Supabase Edge Functions. Permet de tester différents types d'appels à l'API GeckoTerminal avec analyse automatique de la structure des réponses.

## URL de Base
```
https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test
```

## Format de l'Endpoint
```
/cielo-api/gecko-api-test/{type}/{tokenAddress?}/{network?}
```

## Types de Tests Supportés

### 1. Networks - Liste des réseaux supportés
```bash
GET /cielo-api/gecko-api-test/networks
```
**Description :** Récupère la liste de tous les réseaux supportés par GeckoTerminal.

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/networks" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Pools - Pools d'un token spécifique
```bash
GET /cielo-api/gecko-api-test/pools/{tokenAddress}/{network}
```
**Description :** Récupère les pools associés à un token spécifique sur un réseau donné.

**Paramètres requis :**
- `tokenAddress` : Adresse du token
- `network` : Réseau (défaut: solana)

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/pools/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Token - Données d'un token spécifique
```bash
GET /cielo-api/gecko-api-test/token/{tokenAddress}/{network}
```
**Description :** Récupère les données détaillées d'un token spécifique.

**Paramètres requis :**
- `tokenAddress` : Adresse du token
- `network` : Réseau (défaut: solana)

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/token/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Trending - Pools tendance sur un réseau
```bash
GET /cielo-api/gecko-api-test/trending/{network}
```
**Description :** Récupère les pools tendance sur un réseau donné.

**Paramètres requis :**
- `network` : Réseau (ex: solana, eth, bsc)

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/trending/solana" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Dexes - Liste des DEX sur un réseau
```bash
GET /cielo-api/gecko-api-test/dexes/{network}
```
**Description :** Récupère la liste des DEX disponibles sur un réseau donné.

**Paramètres requis :**
- `network` : Réseau (ex: solana, eth, bsc)

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/dexes/solana" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### 6. Pool-Specific - Données d'un pool spécifique
```bash
GET /cielo-api/gecko-api-test/pool-specific/{poolAddress}/{network}
```
**Description :** Récupère les données détaillées d'un pool spécifique.

**Paramètres requis :**
- `poolAddress` : Adresse du pool
- `network` : Réseau (défaut: solana)

**Exemple cURL :**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/pool-specific/8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT/solana" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## Structure de la Réponse

### Réponse de Succès
```json
{
  "success": true,
  "test_type": "pools",
  "description": "Récupération des pools pour le token XXX sur solana",
  "endpoint_tested": "/networks/solana/tokens/XXX/pools?include=dex,base_token&page=1&limit=5",
  "full_url": "https://api.geckoterminal.com/api/v2/networks/solana/tokens/XXX/pools?include=dex,base_token&page=1&limit=5",
  "network": "solana",
  "token_address": "XXX",
  "response_analysis": {
    "duration_ms": 476,
    "has_data": true,
    "data_type": "array",
    "data_count": 5,
    "top_level_keys": ["data", "included"],
    "has_included": true,
    "included_count": 5
  },
  "data_preview": {
    "total_items": 5,
    "first_item_keys": ["id", "type", "attributes", "relationships"],
    "first_item_id": "solana_XXX",
    "first_item_type": "pool",
    "first_item_attributes_keys": ["base_token_price_usd", "name", "pool_created_at", ...]
  },
  "included_preview": {
    "total_included": 5,
    "types_breakdown": {
      "dex": 4,
      "token": 1
    },
    "first_included_keys": ["id", "type", "attributes"]
  },
  "raw_response": {
    // Réponse complète de l'API GeckoTerminal
  },
  "timestamp": "2025-08-03T11:44:42.397Z"
}
```

### Réponse d'Erreur
```json
{
  "error": "Type de test \"invalid-type\" non supporté",
  "available_types": ["pools", "token", "networks", "trending", "dexes", "pool-specific"]
}
```

### Aide Générale (sans paramètres)
```json
{
  "error": "Type de test requis",
  "usage": "/cielo-api/gecko-api-test/{type}/{tokenAddress?}/{network?}",
  "available_types": ["pools", "token", "networks", "trending", "dexes", "pool-specific"],
  "examples": [
    "/cielo-api/gecko-api-test/pools/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana",
    "/cielo-api/gecko-api-test/token/25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk/solana",
    "/cielo-api/gecko-api-test/networks",
    "/cielo-api/gecko-api-test/trending/solana"
  ]
}
```

## Analyse Automatique

L'endpoint fournit une analyse automatique de la réponse incluant :

- **response_analysis** : Métadonnées sur la réponse (durée, type de données, nombre d'éléments)
- **data_preview** : Aperçu de la structure des données principales
- **included_preview** : Aperçu des données incluses (relations)
- **raw_response** : Réponse complète brute pour debug

## Réseaux Populaires Supportés

- `solana` - Solana
- `eth` - Ethereum
- `bsc` - BNB Chain
- `polygon_pos` - Polygon POS
- `avax` - Avalanche
- `arbitrum` - Arbitrum
- `optimism` - Optimism
- `base` - Base
- `sui-network` - Sui Network
- `aptos` - Aptos

## Headers Requis

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

## Gestion des Erreurs

L'endpoint gère automatiquement :
- Types de test invalides
- Paramètres manquants requis
- Erreurs de l'API GeckoTerminal
- Timeouts et erreurs réseau

## Cas d'Usage

1. **Debug de l'enrichissement** : Tester directement les appels API pour debugger l'enrichissement des tokens
2. **Exploration de données** : Découvrir la structure des données GeckoTerminal
3. **Validation de tokens** : Vérifier si un token est présent dans GeckoTerminal
4. **Analyse de pools** : Explorer les pools disponibles pour un token
5. **Monitoring** : Surveiller la disponibilité et la performance de l'API GeckoTerminal

## Exemples de Tests Complets

### Test d'un token populaire (SOL)
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/token/So11111111111111111111111111111111111111112/solana"
```

### Test des pools tendance
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/trending/solana"
```

### Test des DEX sur Ethereum
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/dexes/eth"
```
