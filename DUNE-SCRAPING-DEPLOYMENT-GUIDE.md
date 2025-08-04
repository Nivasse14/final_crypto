# 🚀 Guide de Déploiement - Serveur de Scraping Dune

## 📋 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Utilisateur   │───▶│  Supabase Edge   │───▶│  Serveur de     │
│                 │    │    Function      │    │   Scraping      │
│   (API Call)    │    │ (dune-scraper-   │    │  (Railway/      │
│                 │    │    trigger)      │    │   Render)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │    Supabase      │    │   Dune.com      │
                       │   Database       │    │   (Scraping)    │
                       │   (Résultats)    │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 🎯 Étapes de Déploiement

### Étape 1: Déployer le Serveur de Scraping

#### Option A: Railway.app (RECOMMANDÉ ⭐)

1. **Créer un compte Railway** : https://railway.app
2. **Nouvelle App** : "New Project" → "Deploy from GitHub repo"
3. **Sélectionner le dossier** : `scraping-server/`
4. **Variables d'environnement** :
   ```
   PORT=3001
   AUTH_TOKEN=your-super-secure-token-here-32-chars
   ```
5. **Deploy** automatique

#### Option B: Render.com (Gratuit)

1. **Créer un compte Render** : https://render.com
2. **New Web Service** → "Build and deploy from a Git repository"
3. **Configuration** :
   - **Root Directory** : `scraping-server`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. **Variables d'environnement** :
   ```
   PORT=3001
   AUTH_TOKEN=your-super-secure-token-here-32-chars
   ```

#### Option C: Digital Ocean App Platform

1. **Créer un compte DO** : https://digitalocean.com
2. **Apps** → "Create App" → GitHub
3. **Configuration** :
   - **Source Directory** : `scraping-server`
   - **Build Command** : `npm install`
   - **Run Command** : `npm start`

### Étape 2: Configurer Supabase

1. **Aller dans Supabase Dashboard** : https://supabase.com/dashboard
2. **Settings** → **Edge Functions** → **Environment Variables**
3. **Ajouter les variables** :
   ```
   SCRAPING_SERVER_URL=https://your-app.railway.app
   SCRAPING_SERVER_TOKEN=your-super-secure-token-here-32-chars
   ```

### Étape 3: Tester l'API

```bash
# Test complet
./test-dune-scraper-api.sh
```

## 📡 Utilisation de l'API

### Démarrer un scraping
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/start"
```

### Vérifier le statut
```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-scraper-trigger/status?job_id=JOB_ID"
```

## 💰 Coûts Estimés

| Service | Plan Gratuit | Plan Payant | Recommandation |
|---------|--------------|-------------|----------------|
| **Railway** | 5$/mois crédit | 5-15$/mois | ⭐ BEST |
| **Render** | 750h/mois | 7$/mois | 💚 Gratuit |
| **Digital Ocean** | 200$/crédit | 5$/mois | 💙 Stable |
| **Heroku** | ❌ | 7$/mois | ⚠️ Plus cher |

## 🔧 Scripts Utiles

```bash
# Déploiement automatique Railway
./deploy-scraping-server.sh

# Test du serveur local
cd scraping-server && npm run test

# Test de l'API Supabase
./test-dune-scraper-api.sh
```

## 🛡️ Sécurité

- ✅ Authentification par token Bearer
- ✅ Variables d'environnement chiffrées
- ✅ CORS configuré
- ⚠️ Rate limiting recommandé en production

## 🐛 Résolution de Problèmes

### Erreur "Puppeteer not found"
```bash
# Sur le serveur, installer les dépendances système
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libxss1 fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
```

### Timeout lors du scraping
- Augmenter le timeout dans `page.goto()`
- Réduire le nombre de pages scrapées simultanément
- Ajouter des délais entre les pages

### Détection de bot
- Utiliser différents User-Agents
- Ajouter des délais aléatoires
- Utiliser des proxies rotatifs

## 📊 Monitoring

Le serveur expose les métriques suivantes :
- Statut des jobs en temps réel
- Nombre de wallets récupérés
- Durée d'exécution
- Erreurs et échecs

## 🔄 Prochaines Améliorations

- [ ] Interface web de monitoring
- [ ] Notifications Slack/Discord
- [ ] Scheduling automatique
- [ ] Cache Redis pour les résultats
- [ ] API rate limiting
- [ ] Logs centralisés
