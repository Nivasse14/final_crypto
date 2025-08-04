# Serveur de Scraping Dune Analytics

Serveur Express.js pour effectuer le scraping des données Dune Analytics avec Puppeteer.

## 🚀 Déploiement rapide

### Option 1: Railway.app (RECOMMANDÉ)

1. **Fork le repo sur GitHub**
2. **Connecter à Railway** : https://railway.app
3. **Variables d'environnement** :
   ```
   PORT=3001
   AUTH_TOKEN=your-secure-token-here
   ```
4. **Deploy** automatiquement depuis GitHub

### Option 2: Render.com

1. **Fork le repo sur GitHub**
2. **Créer un nouveau service** sur https://render.com
3. **Build Command** : `npm install`
4. **Start Command** : `npm start`
5. **Variables d'environnement** :
   ```
   PORT=3001
   AUTH_TOKEN=your-secure-token-here
   ```

### Option 3: Digital Ocean App Platform

1. **Fork le repo sur GitHub**
2. **Créer une nouvelle app** sur DigitalOcean
3. **Configuration** :
   - Runtime: Node.js
   - Build: `npm install`
   - Run: `npm start`

## 🔧 Installation locale

```bash
cd scraping-server
npm install
npm start
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Démarrer le scraping
```bash
POST /api/start-scraping
Authorization: Bearer your-token

{
  "jobId": "job_123",
  "url": "https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3",
  "callback_url": "https://your-webhook-url.com/webhook"
}
```

### Vérifier le statut
```bash
GET /api/job-status/job_123
Authorization: Bearer your-token
```

## 🌐 Configuration Supabase

Mettre à jour les variables d'environnement dans Supabase :

```bash
SCRAPING_SERVER_URL=https://your-app.railway.app
SCRAPING_SERVER_TOKEN=your-secure-token
```

## 🔒 Sécurité

- Authentification par token Bearer
- Rate limiting recommandé en production
- Logs de sécurité

## 📦 Dépendances

- **Express** : Serveur web
- **Puppeteer** : Contrôle du navigateur
- **Puppeteer-extra** : Plugins anti-détection
- **Stealth Plugin** : Éviter la détection de bot
