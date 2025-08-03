# 🚀 Guide Postman - API Wallet Analyzer

## 📋 Import dans Postman

### 1. Importer la Collection
1. Ouvrez Postman
2. Cliquez sur **Import** (en haut à gauche)
3. Sélectionnez le fichier `Wallet-Analyzer-API.postman_collection.json`
4. Cliquez sur **Import**

### 2. Importer l'Environnement
1. Dans Postman, cliquez sur **Import**
2. Sélectionnez le fichier `Wallet-Analyzer-Environment.postman_environment.json`
3. Cliquez sur **Import**
4. **Important**: Sélectionnez l'environnement "Wallet Analyzer Environment" dans le dropdown (en haut à droite)

## 🎯 Tests Disponibles

### 1. Health Check
- **URL**: `GET /health`
- **Description**: Vérifie que l'API fonctionne
- **Réponse attendue**: Status "ok" + timestamp

### 2. Quick Analysis
- **URL**: `GET /quick/{wallet_address}`
- **Description**: Analyse rapide d'un wallet
- **Données retournées**: Score alpha, PnL, win rate, source des données

### 3. Complete Analysis  
- **URL**: `GET /complete/{wallet_address}`
- **Description**: Analyse complète avec toutes les métriques
- **Données retournées**: Analyse alpha détaillée, recommandations copy-trading, métriques avancées

## 🔧 Configuration

### Variables d'Environnement
- `base_url`: URL de base de l'API (déjà configurée)
- `api_key`: Clé d'authentification Supabase (déjà configurée)
- `test_wallet`: Wallet de test par défaut
- `custom_wallet`: Remplacez par votre wallet pour tests personnalisés

### Authentification
L'authentification Bearer Token est configurée automatiquement avec `{{api_key}}`.

## 📊 Comment Tester

### Test Rapide (Recommandé)
1. Sélectionnez l'environnement "Wallet Analyzer Environment"
2. Exécutez **Health Check** pour vérifier que tout fonctionne
3. Exécutez **Quick Analysis - Default Wallet** pour un test rapide
4. Exécutez **Complete Analysis - Default Wallet** pour l'analyse complète

### Test avec Votre Wallet
1. Dans l'environnement, modifiez `custom_wallet` avec votre adresse Solana
2. Utilisez les requêtes **Custom Wallet** 
3. Ou copiez/collez directement l'adresse dans l'URL

### Test Comparatif
1. Exécutez les 3 **Test Wallet** (1, 2, 3) successivement
2. Comparez les résultats dans l'onglet **Console** de Postman
3. Vérifiez que les scores alpha et métriques varient

## 📈 Interpréter les Résultats

### Quick Analysis Response
```json
{
  "wallet_address": "HN7cABqL...",
  "data_source": "REAL_CIELO_API",  // ✅ Utilise vraies données
  "alpha_score": 6.5,               // Score sur 10
  "total_pnl_usd": 3812.29,        // PnL en USD
  "win_rate": 83.3,                // Taux de réussite %
  "total_trades": 18                // Nombre de trades
}
```

### Complete Analysis - Points Clés
- **data_source**: `"REAL_CIELO_API"` = vraies données, `"FALLBACK_NO_CIELO"` = données de fallback
- **alpha_analysis.alpha_score**: Score de 1 à 10
- **alpha_analysis.alpha_category**: `HIGH_ALPHA`, `MODERATE_ALPHA`, `LOW_ALPHA`
- **copy_trading_recommendations.recommendation**: `STRONG_COPY`, `COPY`, `LIGHT_COPY`, `MONITOR`, `AVOID`
- **copy_trading_recommendations.suggested_allocation_percentage**: % de capital à allouer

## 🔍 Tests Automatiques

Chaque requête inclut des tests automatiques qui vérifient :
- ✅ Code de statut 200
- ✅ Temps de réponse < 60s  
- ✅ Format JSON valide
- ✅ Présence des champs requis
- ✅ Logs détaillés dans la Console

### Voir les Résultats des Tests
1. Après chaque requête, regardez l'onglet **Test Results**
2. Ouvrez la **Console** (View > Show Postman Console) pour voir les logs détaillés

## 🚨 Troubleshooting

### Erreur 401 Unauthorized
- Vérifiez que l'environnement est bien sélectionné
- Vérifiez que `api_key` est correcte dans l'environnement

### Erreur 404 Not Found
- Vérifiez que `base_url` est correct
- Assurez-vous que l'adresse wallet est valide (44 caractères)

### Timeout / Pas de réponse
- L'API peut prendre jusqu'à 60s pour répondre
- Vérifiez votre connexion internet
- L'API Cielo peut être temporairement indisponible

### Data Source = "FALLBACK_NO_CIELO"
- Normal, l'API utilise des données de fallback réalistes
- Les métriques restent valides pour les tests

## 💡 Conseils d'Utilisation

1. **Testez toujours Health Check en premier**
2. **Utilisez Quick Analysis pour des tests rapides**
3. **Complete Analysis pour l'analyse détaillée**
4. **Comparez plusieurs wallets pour voir la variation des données**
5. **Regardez la Console pour les logs détaillés**
6. **Sauvegardez vos requêtes intéressantes**

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que l'environnement est sélectionné
2. Consultez les logs dans la Console Postman
3. Testez d'abord Health Check
4. Vérifiez que l'adresse wallet est au format Solana valide
