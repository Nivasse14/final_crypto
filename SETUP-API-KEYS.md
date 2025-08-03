# 🔑 Guide rapide: Configuration des clés API Supabase

## Étape 1: Récupérer les clés API

1. **Allez sur Supabase** : https://app.supabase.com/
2. **Sélectionnez votre projet** (celui avec l'URL `xkndddxqqlxqknbqtefv.supabase.co`)
3. **Dans le menu latéral, cliquez sur** : `Settings` → `API`
4. **Copiez les deux clés suivantes** :
   - `anon` / `public` key (longue chaîne commençant par `eyJ...`)
   - `service_role` key (longue chaîne commençant par `eyJ...`)

## Étape 2: Mettre à jour le fichier .env

Remplacez dans `/Users/helenemounissamy/scanDune/.env` :

```env
# AVANT (clés factices)
SUPABASE_ANON_KEY=VOTRE_VRAIE_ANON_KEY_ICI
SUPABASE_SERVICE_ROLE_KEY=VOTRE_VRAIE_SERVICE_ROLE_KEY_ICI

# APRÈS (vraies clés)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

## Étape 3: Tester la configuration

```bash
cd /Users/helenemounissamy/scanDune
node test-api-keys.js
```

## Étape 4: Créer les tables en base

1. **Allez dans Supabase** : https://app.supabase.com/
2. **Sélectionnez votre projet**
3. **Cliquez sur** : `SQL Editor` (dans le menu latéral)
4. **Copiez-collez le contenu du fichier** : `create-minimal.sql`
5. **Cliquez sur** : `Run` (ou `Ctrl+Enter`)

## Étape 5: Tester la sauvegarde en base

```bash
node test-database-save.js
```

## Étape 6: Tester le système complet

```bash
node test-complete-system.js
```

---

## 🚨 En cas de problème

### Erreur "Invalid API key"
- Vérifiez que vous avez bien copié les clés complètes (très longues)
- Vérifiez qu'il n'y a pas d'espace avant/après les clés
- Vérifiez que les clés correspondent au bon projet Supabase

### Erreur "relation does not exist"
- Exécutez le script `create-minimal.sql` dans le SQL Editor de Supabase
- Vérifiez que le script s'est exécuté sans erreur

### Erreur de longueur VARCHAR
- Le script `create-minimal.sql` corrige automatiquement ce problème
- Si l'erreur persiste, supprimez les tables et relancez le script

---

## 📋 Prochaines étapes après la configuration

1. **Déployer le Market Cap Risk Analyzer** sur Supabase
2. **Configurer le monitoring** des wallets alpha
3. **Mettre en place l'analyse automatique** des nouvelles données
4. **Optimiser les performances** avec des index avancés

---

*Une fois les clés configurées, tous les tests devraient passer et le système sera prêt pour la production!*
