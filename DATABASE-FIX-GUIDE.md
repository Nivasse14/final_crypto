# 🛠️ Guide de Résolution des Erreurs de Base de Données

## 🎯 Problème Identifié

L'erreur `invalid input syntax for type integer: "48.055045871559635"` indique que :
- Des valeurs décimales sont insérées dans des colonnes de type `INTEGER`
- Le schéma de base de données doit être corrigé

## ✅ Solution en 3 Étapes

### 1. Appliquer le Script de Correction

**Option A: Via l'interface Supabase**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans "SQL Editor"  
4. Copiez-collez le contenu de `fix-column-types.sql`
5. Exécutez le script

**Option B: Via psql (si configuré)**
```bash
psql -h db.xkndddxqqlxqknbqtefv.supabase.co -U postgres -d postgres -f fix-column-types.sql
```

### 2. Vérifier la Correction

```bash
cd /Users/helenemounissamy/scanDune/CLEAN
node test-column-types.js
```

Résultat attendu : ✅ "Types de colonnes OK ! Le problème est résolu."

### 3. Retester l'API GMGN

```bash
cd /Users/helenemounissamy/scanDune/scripts
node -e "const { GMGNApiService } = require('./api-gmgn.js'); new GMGNApiService().processWalletComplete('2bdcq3CfFZfZ5e5RNMv4w3nTFHGzyJEM1cuFf8E4AQth')"
```

## 📋 Scripts de Correction Disponibles

- `fix-column-types.sql` - Corrige les types INTEGER → DECIMAL
- `test-column-types.js` - Teste si la correction a fonctionné
- `fix.sql` - Script de correction général (si déjà présent)

## 🎯 Après Correction

Une fois corrigé, toutes ces fonctionnalités marcheront :
- ✅ Scraper dune.com → Supabase
- ✅ API GMGN avec sauvegarde
- ✅ API Supabase "complete"
- ✅ Enrichissement batch des wallets

## 💡 Note

Cette erreur est normale lors de migrations de base de données. Le fix est simple et permanent une fois appliqué.
