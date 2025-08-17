# 🔧 Guide d'exécution de la migration - Métriques Achat/Vente

## ⚠️ Migration manuelle requise

L'API Supabase ne permet pas d'exécuter les commandes `ALTER TABLE` avec la clé anon. 
Vous devez exécuter la migration manuellement dans le SQL Editor de Supabase.

## 📋 Étapes d'exécution

### 1. Ouvrir Supabase Dashboard
- Aller sur https://supabase.com/dashboard
- Sélectionner votre projet

### 2. Ouvrir le SQL Editor
- Dans le menu gauche, cliquer sur "SQL Editor"
- Cliquer sur "New query"

### 3. Copier et exécuter le SQL
Copier le contenu suivant et l'exécuter :

```sql
-- Migration pour ajouter les métriques d'achat et de vente depuis l'API Cielo
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les nouvelles colonnes métriques d'achat et de vente
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS minimum_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS maximum_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_buy_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_buy_count INTEGER DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS average_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS minimum_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS maximum_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_sell_amount_usd NUMERIC(20,8) DEFAULT NULL;
ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_sell_count INTEGER DEFAULT NULL;

-- Vérification des nouvelles colonnes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'wallet_registry' 
AND column_name IN (
  'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
  'total_buy_amount_usd', 'total_buy_count',
  'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
  'total_sell_amount_usd', 'total_sell_count'
)
ORDER BY column_name;
```

### 4. Vérifier l'exécution
Après exécution, vous devriez voir :
- 10 nouvelles colonnes ajoutées à la table `wallet_registry`
- Un résultat de vérification montrant les 10 colonnes

## 🚀 Test après migration

Une fois la migration exécutée, testez l'enrichissement complet :

```bash
node enrich-cielo-metrics.js test ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
```

Vous devriez maintenant voir toutes les métriques d'achat/vente enregistrées !

## 📊 Métriques ajoutées

### Métriques d'achat :
- `average_buy_amount_usd` : Montant moyen d'achat en USD
- `minimum_buy_amount_usd` : Montant minimum d'achat en USD  
- `maximum_buy_amount_usd` : Montant maximum d'achat en USD
- `total_buy_amount_usd` : Montant total d'achat en USD
- `total_buy_count` : Nombre total d'achats

### Métriques de vente :
- `average_sell_amount_usd` : Montant moyen de vente en USD
- `minimum_sell_amount_usd` : Montant minimum de vente en USD
- `maximum_sell_amount_usd` : Montant maximum de vente en USD  
- `total_sell_amount_usd` : Montant total de vente en USD
- `total_sell_count` : Nombre total de ventes

## 🎯 Résultat attendu

Après migration et test, vous devriez avoir :
- **27 métriques totales** au lieu de 22
- Toutes les nouvelles métriques d'achat/vente enregistrées
- Système d'enrichissement Cielo complet à 100%
