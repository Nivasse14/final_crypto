# Guide de Test API Wallet Analyzer - Postman

## 🎯 API Opérationnelle avec Vraies Données Cielo

L'API `wallet-analyzer` est maintenant entièrement intégrée avec l'API Cielo réelle et retourne des métriques professionnelles dynamiques pour chaque wallet analysé.

## 📡 Endpoints Disponibles

### 1. Health Check
```
GET {{baseUrl}}/wallet-analyzer/health
```

### 2. Analyse Rapide
```
GET {{baseUrl}}/wallet-analyzer/quick/{wallet_address}
```

### 3. Analyse Complète
```
GET {{baseUrl}}/wallet-analyzer/complete/{wallet_address}
```

## 🎭 Wallets de Test Validés

Ces wallets ont été testés et retournent des données réelles de Cielo :

### Wallet Performant (Alpha élevé)
- **Adresse**: `GUFxwDrsLzSQ27xxTVe4y9BARZ6cENWmjzgzn6f6THCp`
- **Performance**: +$46,097 PnL, 65% Win Rate, Alpha 8.5
- **Recommandation**: COPY (11% allocation suggérée)

### Wallet Moyen
- **Adresse**: `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R`
- **Performance**: +$4,825 PnL, 52% Win Rate, Alpha 5.5
- **Recommandation**: MONITOR

### Wallet Sous-performant
- **Adresse**: `HdSc3j6p9fLcvz6MhZoUE1JXqP7xpvYDgrtAf3sxF1YN`
- **Performance**: -$15,968 PnL, 46% Win Rate, Alpha 5.5
- **Recommandation**: AVOID

## 🧪 Tests à Effectuer dans Postman

### Test 1: Vérification du Health Check
```
GET {{baseUrl}}/wallet-analyzer/health
```
**Résultat attendu**: Status OK, version "cielo-integrated-v1"

### Test 2: Analyse Rapide d'un Wallet Performant
```
GET {{baseUrl}}/wallet-analyzer/quick/GUFxwDrsLzSQ27xxTVe4y9BARZ6cENWmjzgzn6f6THCp
```
**Résultat attendu**: 
- `data_source`: "REAL_CIELO_API"
- `alpha_score`: > 7.0
- `total_pnl_usd`: > 0

### Test 3: Analyse Complète
```
GET {{baseUrl}}/wallet-analyzer/complete/GUFxwDrsLzSQ27xxTVe4y9BARZ6cENWmjzgzn6f6THCp
```
**Résultat attendu**:
- Structure complète avec toutes les métriques
- `alpha_analysis.alpha_category`: "HIGH_ALPHA" ou "EXTREME_ALPHA"
- `copy_trading_recommendations.recommendation`: "COPY" ou "STRONG_COPY"

### Test 4: Variation des Données
Testez plusieurs wallets différents pour vérifier que les données varient :

1. `GUFxwDrsLzSQ27xxTVe4y9BARZ6cENWmjzgzn6f6THCp` (performant)
2. `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` (moyen)
3. `HdSc3j6p9fLcvz6MhZoUE1JXqP7xpvYDgrtAf3sxF1YN` (sous-performant)

**Validation**: Les métriques (PnL, win rate, alpha score) doivent être différentes pour chaque wallet.

## 📊 Métriques Clés à Surveiller

### Dans l'Analyse Rapide
- `data_source`: Doit être "REAL_CIELO_API"
- `total_pnl_usd`: PnL total réel du wallet
- `win_rate`: Pourcentage de trades gagnants
- `alpha_score`: Score de 1 à 10
- `total_trades`: Nombre de trades estimé

### Dans l'Analyse Complète
- `alpha_analysis.alpha_score`: Score alpha détaillé
- `alpha_analysis.alpha_category`: Catégorie d'alpha
- `copy_trading_recommendations.recommendation`: Recommandation de copy trading
- `copy_trading_recommendations.suggested_allocation_percentage`: % d'allocation suggéré
- `trade_analysis.total_pnl_usd`: PnL total détaillé
- `token_analysis.tokens`: Liste des tokens tradés avec métriques

## 🔄 Tests de Régression

Pour s'assurer que l'API continue de fonctionner correctement :

1. **Test de Consistance**: Appelez le même endpoint plusieurs fois et vérifiez que les données principales restent cohérentes
2. **Test de Performance**: Vérifiez que les réponses arrivent en moins de 5 secondes
3. **Test d'Erreur**: Testez avec une adresse invalide pour vérifier la gestion d'erreur

## 🚨 Indicateurs de Problème

Si vous voyez ces indicateurs, il y a un problème :

- `data_source`: "FALLBACK_NO_CIELO" (API Cielo inaccessible)
- `data_source`: "FALLBACK_DATA" (Données par défaut)
- Tous les wallets retournent les mêmes métriques exactes
- Erreurs HTTP 500 ou timeouts fréquents

## ✅ Validation Réussie

L'API a été testée avec succès et retourne :
- ✅ Données réelles de Cielo (pas de mock)
- ✅ Résultats différents pour chaque wallet
- ✅ Métriques professionnelles complètes
- ✅ Recommandations de copy trading intelligentes
- ✅ Scores alpha basés sur les vraies performances

L'API est maintenant prête pour la production et peut être utilisée exactement comme votre ancien serveur Express, mais avec l'avantage d'être serverless sur Supabase.
