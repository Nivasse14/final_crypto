# 🧪 Guide de Test Postman ### 2. 🪙 **Tokens PnL Détaillés** ⭐ TOUT NOUVEAU
```
GET /cielo-api/tokens-pnl/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB?page=1
```
- **But** : Tester `profile.fetchTokenPnlSlow` - TOUS les tokens tradés avec PnL
- **Attendu** : `trpc_equivalent: "profile.fetchTokenPnlSlow"`, liste détaillée des tokens
- **Paramètres** : `page`, `chains`, `timeframe`, `sortBy`, `tokenFilter`

### 3. 🔄 **Complete (Équivalent TRPC Ultra-Complet)** ⭐ PRIORITÉ MAX
```
GET /cielo-api/complete/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : Équivalent des 5 appels TRPC principaux en une requête
- **Attendu** : Portfolio + Stats + Profitability + Track Status + Tokens PnL
- **Check** : `endpoints_called.length = 5` et toutes les méthodes TRPC

### 4. 🔍 **Track Status** API Cielo COMPLÈTE ⭐

## 🎉 **NOUVEAU : API 100% Compatible TRPC !**

Notre API couvre maintenant **TOUS** les endpoints principaux de la requête TRPC batch découverte :
- ✅ `profile.getWalletPortfolio` → `/portfolio/{wallet}`
- ✅ `profile.getEnhancedStatsAggregated` → `/stats/{wallet}` & `/stats-7d/{wallet}`
- ✅ `profile.getEnhancedStatsProfitability` → `/profitability/{wallet}` & `/profitability-7d/{wallet}`
- ⭐ `profile.getWalletGlobalTrackStatus` → `/track-status/{wallet}` **NOUVEAU !**

## 📋 **Import de la Collection**

1. **Importer la collection** : `Cielo-API-Complete.postman_collection.json`
2. **Wallet de test** : `ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`
3. **URL Supabase** : `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1`

## 🎯 **Endpoints à Tester (par ordre de priorité)**

### 1. 🩺 **Health Check** (OBLIGATOIRE en premier)
```
GET /cielo-api/health
```
- **But** : Vérifier que l'API fonctionne
- **Attendu** : `status: "healthy"`, 10 endpoints disponibles

### ⭐ **NOUVEAUX ENDPOINTS PRIORITAIRES (découverts via TRPC)**

### 2. � **Track Status** ⭐ TOUT NOUVEAU
```
GET /cielo-api/track-status/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : Tester `profile.getWalletGlobalTrackStatus`
- **Attendu** : `endpoint_used: "/wallet/track-status"`, statut de tracking

### 3. � **Complete (Équivalent TRPC Batch)** ⭐ PRIORITÉ MAX
```
GET /cielo-api/complete/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : Équivalent des 4 appels TRPC principaux en une requête
- **Attendu** : Portfolio + Stats + Profitability + Track Status
- **Check** : `trpc_equivalent` doit contenir les 4 méthodes TRPC

### **ENDPOINTS DÉJÀ VALIDÉS**

### 4. � **Stats Enhanced Aggregated (All Time)**
```
GET /cielo-api/stats/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : `profile.getEnhancedStatsAggregated` avec `days=max`

### 5. � **Profitability Enhanced (All Time)**
```
GET /cielo-api/profitability/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : `profile.getEnhancedStatsProfitability` avec `days=max`

### 6. 📋 **Portfolio**
```
GET /cielo-api/portfolio/ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```
- **But** : `profile.getWalletPortfolio`

## ✅ **Checklist de Validation**

### **Pour chaque endpoint :**
- [ ] **Status 200** ✅
- [ ] **`success: true`** ✅
- [ ] **`source: "CIELO_API"`** (pas de fallback) ✅
- [ ] **`wallet_address`** correspond ✅
- [ ] **`timestamp`** récent ✅
- [ ] **Données réelles** (pas de mocks) ✅

### **Spécifique aux nouveaux endpoints :**
- [ ] **Stats** : `endpoint_used: "/enhanced-stats/aggregated"` ✅
- [ ] **Stats** : `cielo_url` contient `enhanced-stats/aggregated` ✅
- [ ] **Profitability** : `endpoint_used: "/enhanced-stats/profitability"` ✅
- [ ] **Complete** : `endpoints_called` contient les 3 endpoints ✅
- [ ] **7d endpoints** : `period: "7_days"` ✅

## 🚨 **Points de Vigilance**

### **Pas de Fallback = Succès**
Si tu vois `source: "FALLBACK_STABLE_DATA"`, c'est que l'API Cielo n'a pas répondu.

### **Coherence des Données**
- Les données doivent être **cohérentes** entre appels
- Pas de valeurs aléatoires/générées
- `win_rate`, `total_pnl`, etc. doivent avoir du sens

### **Performance**
- Réponse en **< 10 secondes** pour endpoints simples
- Réponse en **< 20 secondes** pour `/complete` (3 appels)

## 🔄 **Test de Stabilité**

1. **Appeler 3 fois le même endpoint**
2. **Comparer les résultats**
3. **Vérifier que les métriques principales sont identiques**

## 🎯 **Résultat Attendu**

✅ **Tous les endpoints répondent avec des données Cielo réelles**  
✅ **Les nouveaux endpoints TRPC fonctionnent**  
✅ **L'endpoint `/complete` combine correctement les 3 sources**  
✅ **Pas de données de fallback (sauf en cas d'erreur API)**

---

**🚀 Prêt pour les tests ! Lance la collection dans Postman et vérifie que tout est vert.**
