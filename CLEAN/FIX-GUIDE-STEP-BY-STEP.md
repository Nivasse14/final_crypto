# 🛠️ Guide de Résolution de l'Erreur de Types de Colonnes

## 🎯 Problème
```
ERROR: 42703: column "token_price_usd" of relation "wallet_tokens" does not exist
```

## 📋 Diagnostic en 3 étapes

### Étape 1: Identifier la structure exacte de vos tables
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet  
3. Allez dans "SQL Editor"
4. Copiez le contenu de `inspect-tables.sql`
5. Exécutez → Cela vous montre toutes vos tables et colonnes

### Étape 2: Diagnostic spécifique des colonnes problématiques
1. Dans le même "SQL Editor"
2. Copiez le contenu de `diagnostic-column-types.sql` 
3. Exécutez → Cela génère les commandes ALTER TABLE exactes pour vos colonnes

### Étape 3: Appliquer la correction sécurisée
1. Dans le même "SQL Editor"
2. Copiez le contenu de `fix-column-types-safe.sql`
3. Exécutez → Ce script vérifie chaque colonne avant de la modifier

## 📁 Scripts Disponibles

- **`inspect-tables.sql`** - Voir la structure exacte de vos tables
- **`diagnostic-column-types.sql`** - Identifier les colonnes à corriger  
- **`fix-column-types-safe.sql`** - Correction sécurisée avec vérifications

## 🎯 Après correction

Testez que tout fonctionne :
```bash
cd CLEAN/
node test-column-types.js
```

Puis testez votre script GMGN :
```bash
cd scripts/
node -e "const { GMGNApiService } = require('./api-gmgn.js'); new GMGNApiService().processWalletComplete('2bdcq3CfFZfZ5e5RNMv4w3nTFHGzyJEM1cuFf8E4AQth')"
```

## 💡 Explication

L'erreur `invalid input syntax for type integer: "48.055045871559635"` arrive quand :
- Une valeur décimale (48.055045871559635) est insérée dans une colonne INTEGER
- La colonne devrait être DECIMAL/NUMERIC pour accepter les décimales

Le script sécurisé corrige automatiquement tous ces types selon le contexte :
- `balance`, `price` → DECIMAL(20,8) (haute précision)
- `amount`, `value`, `pnl` → DECIMAL(20,2) (montants en USD)  
- `percent`, `rate`, `roi` → DECIMAL(8,4) (pourcentages)

## ✅ Résultat attendu

Après correction, vous devriez voir :
```
✅ wallet_registry.total_pnl_usd corrigé
✅ wallet_registry.roi corrigé  
✅ wallet_registry.winrate corrigé
✅ Script de correction exécuté
```
