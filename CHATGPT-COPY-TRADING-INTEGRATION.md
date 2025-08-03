# 🤖 INTÉGRATION CHATGPT - ANALYSE COPY TRADING SOLANA

## 📋 Vue d'ensemble

L'API Cielo a été enrichie avec une analyse comportementale ChatGPT spécialisée pour le copy trading sur Solana. Cette intégration utilise GPT-4o-mini avec un prompt optimisé pour évaluer la viabilité d'un wallet pour le copy trading selon des critères stricts.

## 🎯 Critères d'évaluation copy trading

### 1. **Win Rate & Performance** 
- Win rate minimum requis : **85%**
- ROI minimum : **100%+**
- Nombre de transactions minimum : **50** (période recommandée: 7 jours)
- PnL positif et constant

### 2. **Anti-Bot / Anti-Farming**
- Durée de holding minimale : **10 minutes**
- Maximum **30 transactions par jour**
- Détection de patterns de scalping répétitifs
- Identification des comportements de farming/bot

### 3. **Taille des positions**
- Taille maximale d'un trade : **1000$**
- Pourcentage maximum du supply détenu : **5%**
- Évaluation de la diversification

### 4. **Tokens & Stratégie**
- Focus sur mid-cap et gros market cap
- Early mover = **bonus significatif**
- Éviter les wallets qui ne tradent que SOL/USDC
- Analyse de la qualité des tokens tradés

### 5. **Copy Trading Pratique**
- Délai acceptable entre trades : **quelques minutes max**
- DEX compatibles : **Jupiter, Raydium, Orca**
- Fréquence de trading adaptée au copy trading

## 🚀 Endpoints disponibles

### 1. **API d'analyse directe**
```
POST https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/analyze-wallet-behavior
```

**Payload:**
```json
{
  "walletAddress": "string",
  "walletData": {
    "total_pnl_usd": 15750.80,
    "winrate": 89.2,
    "total_tokens_traded": 142,
    "total_roi_percentage": 312.5,
    "tokens": [
      {
        "token_symbol": "SOL",
        "token_address": "So11111111111111111111111111111111111111112",
        "pnl": 5500.25,
        "realized_pnl": 4200.30,
        "unrealized_pnl": 1299.95
      }
    ],
    "stats_aggregated": {
      "total_pnl": 15750.80,
      "winrate": 89.2,
      "total_roi_percentage": 312.5,
      "swap_count": 142
    }
  }
}
```

**Réponse:**
```json
{
  "copyTradingScore": 85,
  "recommendation": "🟢",
  "recommendationText": "excellent",
  "explanation": "Wallet excellent pour copy trading avec 89% de win rate...",
  "criteriaAnalysis": {
    "winRateScore": 89,
    "antiBot": true,
    "positionSizing": "acceptable",
    "tokenStrategy": "diversifiée",
    "practicalCopyTrading": "facile"
  },
  "strengths": ["Win rate exceptionnel", "Bonne diversification"],
  "weaknesses": ["Volume parfois élevé"],
  "recommendations": ["Maintenir la stratégie actuelle"],
  "copyTradingViability": "Wallet adapté au copy trading car...",
  "metadata": {
    "analyzedAt": "2025-08-03T16:30:00.000Z",
    "walletAddress": "test123",
    "dataSource": "openai_gpt4o_mini",
    "criteriaVersion": "solana_copy_trading_v1",
    "analysisVersion": "2.0"
  }
}
```

### 2. **Endpoint Complete avec analyse intégrée**
```
GET https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/{wallet_address}
```

L'endpoint `/complete` inclut automatiquement l'analyse ChatGPT dans le champ `behavioral_analysis`:

```json
{
  "success": true,
  "wallet_address": "ABd...",
  "portfolio": {...},
  "stats_aggregated": {...},
  "tokens_pnl": {...},
  "behavioral_analysis": {
    "success": true,
    "analysis": {
      "copyTradingScore": 75,
      "recommendation": "🟡",
      "explanation": "...",
      "criteriaAnalysis": {...},
      "strengths": [...],
      "weaknesses": [...],
      "recommendations": [...]
    },
    "analysis_duration_ms": 1250,
    "analyzed_at": "2025-08-03T16:30:00.000Z",
    "version": "copy_trading_solana_v2.0"
  }
}
```

## 📊 Scoring et recommandations

### Échelle de scoring
- **85-100 points** : 🟢 **EXCELLENT** - Copy recommandé
- **60-84 points** : 🟡 **MOYEN** - Copy avec précautions
- **0-59 points** : 🔴 **À ÉVITER** - Ne pas copy

### Types de recommandations
- `🟢 excellent` : Wallet idéal pour copy trading
- `🟡 moyen` : Wallet acceptable avec monitoring
- `🔴 à éviter` : Wallet non recommandé pour copy
- `🔴 erreur` : Erreur technique ou données insuffisantes

## 🛡️ Gestion d'erreurs

### Rate Limiting OpenAI (429)
```json
{
  "success": false,
  "error": "HTTP 500: {...}",
  "fallback_reason": "ChatGPT API call failed"
}
```

### Données insuffisantes
```json
{
  "copyTradingScore": 30,
  "recommendation": "🔴",
  "explanation": "Données insuffisantes pour évaluation fiable",
  "criteriaAnalysis": {
    "winRateScore": 0,
    "antiBot": false,
    "positionSizing": "unknown"
  }
}
```

## 🧪 Tests et validation

### Script de test bash
```bash
./test-chatgpt-integration.sh
```

### Collection Postman
- Import: `Cielo-API-ChatGPT-Integration.postman_collection.json`
- Tests automatisés inclus
- Variables d'environnement configurées

### Tests manuels avec cURL

1. **Health check:**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/health"
```

2. **Analyse directe:**
```bash
curl -X POST "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/analyze-wallet-behavior" \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "test", "walletData": {...}}'
```

3. **Complete avec analyse:**
```bash
curl -X GET "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/WALLET_ADDRESS"
```

## 🔧 Configuration technique

### Variables d'environnement requises
- `OPENAI_API_KEY` : Clé API OpenAI (configurée sur Supabase)

### Modèle utilisé
- **GPT-4o-mini** : Plus rapide et économique que GPT-4
- **Temperature: 0.2** : Réponses déterministes et cohérentes
- **Max tokens: 1200** : Suffisant pour l'analyse complète

### URLs de production
- **API principale:** `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/`
- **Analyse ChatGPT:** `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/analyze-wallet-behavior`

## 📈 Fonctionnalités avancées

### Enrichissement GeckoTerminal
- **Méthode V2→P1** : Recherche pool via V2, enrichissement via P1
- **Données avancées** : FDV, GT Score, metrics de sécurité
- **Persistance** : Sauvegarde automatique en base `wallet_tokens_extended`

### Persistance des données
- **Table Supabase** : `wallet_tokens_extended`
- **API de sauvegarde** : `/save-tokens`
- **Enrichissement** : Tokens avec données GeckoTerminal complètes

## 🎯 Cas d'usage

### 1. **Analyse de wallet pour copy trading**
```javascript
// Frontend integration
const response = await fetch(`/cielo-api/complete/${walletAddress}`);
const data = await response.json();

if (data.behavioral_analysis.success) {
  const score = data.behavioral_analysis.analysis.copyTradingScore;
  const recommendation = data.behavioral_analysis.analysis.recommendation;
  
  if (score >= 85) {
    showCopyRecommendation('excellent', data.behavioral_analysis.analysis);
  } else if (score >= 60) {
    showCopyRecommendation('caution', data.behavioral_analysis.analysis);
  } else {
    showCopyRecommendation('avoid', data.behavioral_analysis.analysis);
  }
}
```

### 2. **Dashboard de monitoring**
- Score copy trading en temps réel
- Évolution des métriques dans le temps
- Alertes sur changements de recommandation

### 3. **API pour bots de copy trading**
- Évaluation automatique des wallets
- Filtrage basé sur les critères Solana
- Intégration avec plateformes de copy trading

## 🚀 Roadmap

### Version actuelle (v2.0)
- ✅ Prompt optimisé copy trading Solana
- ✅ Intégration dans endpoint `/complete`
- ✅ Gestion d'erreurs robuste
- ✅ Métadonnées et versioning

### Version future (v2.1)
- 🔄 Cache intelligent pour réduire appels OpenAI
- 🔄 Analyse de tendances historiques
- 🔄 Scoring adaptatif basé sur la performance
- 🔄 Intégration avec d'autres modèles IA

---

**📞 Support**: En cas de problème, vérifier les logs Supabase et les quotas OpenAI.
**🔗 Documentation**: Cette intégration complète l'écosystème Cielo API avec une intelligence artificielle spécialisée copy trading Solana.
