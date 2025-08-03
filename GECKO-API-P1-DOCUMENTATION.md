# Documentation API GeckoTerminal P1 - Enrichissement Avancé

## Vue d'ensemble

L'API P1 de GeckoTerminal offre des données beaucoup plus complètes que l'API v2, incluant le market cap, FDV, scores de qualité, et métadonnées étendues. Elle est particulièrement utile pour l'enrichissement avancé des tokens.

## URL de base API P1

```
https://app.geckoterminal.com/api/p1/
```

## Endpoint principal utilisé

```
/{network}/pools/{poolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0
```

## Paramètres d'inclusion

L'API p1 utilise des paramètres `include` URL-encodés pour récupérer le maximum de données :

- `dex` : Informations sur le DEX (Raydium, Jupiter, etc.)
- `dex.network.explorers` : Liens vers les explorers de blockchain
- `dex_link_services` : Services de trading externes
- `network_link_services` : Services d'analyse et scan
- `pairs` : Données détaillées des paires de trading
- `token_link_services` : Services spécifiques aux tokens
- `tokens.token_security_metric` : Métriques de sécurité des tokens
- `tokens.tags` : Tags et catégories des tokens
- `pool_locked_liquidities` : Informations sur la liquidité verrouillée
- `base_token=0` : Référence pour les calculs de prix

## Structure de réponse API P1

### Données principales du pool

```json
{
  "data": {
    "id": "178543554",
    "type": "pool",
    "attributes": {
      "address": "8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT",
      "name": "SDOG / SOL",
      "price_in_usd": "0.0000179088647602397213102250863782603903967463218237387810946344594",
      "fully_diluted_valuation": "7519.3100505144176305777247813607765989334400097660811796585699274318163401346",
      "reserve_in_usd": "9921.7314",
      "from_volume_in_usd": "6.2117825137",
      "to_volume_in_usd": "6.2117825137",
      "swap_count_24h": 1,
      "gt_score": 56.758348623853216,
      "gt_score_details": {
        "info": 40,
        "pool": 79.167,
        "transactions": 0,
        "holders": 40,
        "creation": 50
      },
      "price_percent_changes": {
        "last_5m": "0%",
        "last_15m": "0%",
        "last_30m": "0%",
        "last_1h": "0%",
        "last_6h": "0%",
        "last_24h": "0%"
      },
      "token_value_data": {
        "4045901": {
          "fdv_in_usd": 97854758776.24222,
          "market_cap_in_usd": 0
        },
        "43715085": {
          "fdv_in_usd": 7781.7662676332775,
          "market_cap_in_usd": null
        }
      }
    }
  }
}
```

### Données incluses enrichies

L'API p1 inclut jusqu'à 24 types d'objets différents :

- **Tokens** : Informations détaillées sur chaque token de la paire
- **Security Metrics** : Données de sécurité (honeypot, rug check, etc.)
- **DEX Info** : Informations sur l'exchange décentralisé
- **Network Info** : Détails du réseau blockchain
- **Tags** : Catégories et tags des tokens
- **Explorers** : Liens vers les explorers de blockchain
- **Liquidity Locks** : Informations sur la liquidité verrouillée

## Avantages de l'API P1 vs V2

### API P1 (app.geckoterminal.com/api/p1)
✅ **Fully Diluted Valuation (FDV)**  
✅ **Market Cap par token**  
✅ **GT Score (score de qualité)**  
✅ **Détails du GT Score**  
✅ **Métriques de sécurité avancées**  
✅ **Données de liquidité verrouillée**  
✅ **Tags et métadonnées enrichies**  
✅ **Liens vers services externes**  
✅ **Données historiques détaillées**  
✅ **Token value data par ID**  

### API V2 (api.geckoterminal.com/api/v2)
❌ Pas de FDV direct  
❌ Market cap limité  
❌ Pas de GT Score  
❌ Métriques de sécurité basiques  
❌ Données moins enrichies  

## Test avec notre endpoint

### Endpoint de test disponible

```
GET /cielo-api/gecko-api-test/pool-p1/{poolAddress}/{network}
```

### Exemple d'appel

```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/gecko-api-test/pool-p1/8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT/solana" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU" \
  -H "Content-Type: application/json"
```

### Réponse analysée

L'endpoint retourne une analyse structurée :

```json
{
  "success": true,
  "test_type": "pool-p1",
  "description": "Test API P1 avancé pour pool {poolAddress} sur {network} avec enrichissement complet",
  "analysis": {
    "duration_ms": 690,
    "api_source": "geckoterminal_p1",
    "pool_attributes": {
      "has_price": true,
      "has_fdv": true,
      "has_liquidity": true,
      "has_volume": true,
      "has_price_changes": true,
      "has_gt_score": true,
      "main_metrics": {
        "price_usd": "0.0000179088647602397213102250863782603903967463218237387810946344594",
        "fdv_usd": "7519.3100505144176305777247813607765989334400097660811796585699274318163401346",
        "liquidity_usd": "9921.7314",
        "gt_score": 56.758348623853216
      }
    },
    "tokens_included": {
      "count": 2,
      "tokens": [
        {
          "id": "4045901",
          "address": "So11111111111111111111111111111111111111112",
          "name": "Wrapped SOL",
          "symbol": "SOL"
        },
        {
          "id": "43715085", 
          "address": "25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk",
          "name": "Smiling Dog",
          "symbol": "SDOG"
        }
      ]
    }
  },
  "raw_data": { /* Données brutes complètes */ }
}
```

## Utilisation dans l'enrichissement

L'API P1 est utilisée dans la fonction `enrichTokenWithGeckoP1Pool()` pour :

1. **Enrichissement principal** : Prix, FDV, liquidité, volumes
2. **Score de qualité** : GT Score et détails 
3. **Données de sécurité** : Métriques avancées
4. **Métadonnées** : Tags, liens, descriptions
5. **Informations de pool** : Frais, réserves, historique

## Mapping des champs enrichis

| Champ API P1 | Champ enrichi | Description |
|---------------|---------------|-------------|
| `price_in_usd` | `price_usd` | Prix en USD |
| `fully_diluted_valuation` | `fdv_usd` | Capitalisation diluée |
| `reserve_in_usd` | `liquidity_usd` | Liquidité totale |
| `from_volume_in_usd` | `from_volume_in_usd` | Volume entrant 24h |
| `to_volume_in_usd` | `to_volume_in_usd` | Volume sortant 24h |
| `gt_score` | `gt_score` | Score de qualité |
| `gt_score_details` | `gt_score_details` | Détail du score |
| `swap_count_24h` | `swap_count_24h` | Nombre de swaps 24h |
| `price_percent_changes.*` | `price_change_percentage_*` | Variations de prix |

## Pools de test recommandés

### BONK/SOL (Raydium)
```
8MsMB9zGkescT7r3mSA6uJdFthtgx3JHAn93b8swQicT
```

### USDC/SOL (Jupiter)
```
58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2
```

### Popular meme coin pools
Rechercher via l'endpoint `/networks/solana/trending_pools`

## Limites et considérations

- **Rate limiting** : L'API p1 peut avoir des limites plus strictes
- **Latence** : Plus de données = temps de réponse plus long (600-800ms)
- **Complexité** : Structure de réponse plus complexe à parser
- **Stabilité** : API moins documentée publiquement

## Conclusion

L'API P1 de GeckoTerminal offre des données significativement plus riches pour l'enrichissement des tokens, particulièrement le FDV et les scores de qualité qui ne sont pas disponibles dans l'API v2. Elle constitue la source de données optimale pour l'analyse avancée de DeFi.
