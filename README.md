# 🚀 scanDune - Architecture Hybride Serverless + Scripts

Système de monitoring et analyse des wallets Solana avec architecture hybride : **Edge Functions Supabase serverless** + **Scripts Node.js locaux**.

## 📁 Structure du Projet

```
scanDune/
├── CLEAN/              # 🎯 Configuration simple & tests API 
│   ├── README.md       # Guide ultra-simple
│   ├── test.js         # Test de l'API Supabase
│   ├── fix.sql         # Scripts de correction DB
│   ├── .env            # Config Supabase
│   └── package.json    # Dépendances minimales
│
├── scripts/            # 🔧 Scripts Node.js de collecte/traitement
│   ├── dune-scraper.js # Scraping des données dune.com
│   ├── api-gmgn.js     # Interface GMGN.ai
│   ├── complete-data-extractor.js
│   ├── coingecko-terminal-api.js
│   └── README.md       # Documentation des scripts
│
└── supabase/           # ☁️ Infrastructure serverless
    └── functions/
        ├── cielo-api/           # API "complete" (remplace serveur local)
        ├── wallet-enrichment/   # Enrichissement batch des wallets
        └── system-monitoring/   # Monitoring & dashboard
```

## 🎯 Utilisation Rapide

### 1. Test de l'API Supabase
```bash
cd CLEAN/
npm install
npm test    # Teste l'API serverless
```

### 2. Collecte de données Dune
```bash
cd scripts/
npm install
npm run dune-scraper    # Scrappe dune.com et upload vers Supabase
```

### 3. APIs disponibles
- **API Complete** : `https://your-project.supabase.co/functions/v1/cielo-api/complete/{address}`
- **Monitoring** : `https://your-project.supabase.co/functions/v1/system-monitoring/dashboard`
- **Enrichissement** : `https://your-project.supabase.co/functions/v1/wallet-enrichment/batch-process`

## 🔄 Workflow Typique

1. **Collecte** → `scripts/dune-scraper.js` récupère les top wallets
2. **Stockage** → Upload automatique vers Supabase
3. **Enrichissement** → Edge Function traite par batch
4. **API** → Données disponibles via `cielo-api`
5. **Monitoring** → Dashboard via `system-monitoring`

## ⚙️ Configuration

### CLEAN/.env (API Tests)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
```

### scripts/.env (Collecte de données)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key
COINGECKO_API_KEY=your_key_optional
```

## 🎯 Avantages de cette Architecture

- **Serverless** : APIs auto-scalables sur Supabase
- **Scripts Node.js** : Flexibilité pour scraping/traitement complexe
- **Simplicité** : Dossier CLEAN/ pour tests rapides
- **Monitoring** : Dashboard temps réel
- **Coûts** : Pay-per-use, pas de serveur à maintenir

## 🔧 Scripts Disponibles

### Collecte de Données
- `npm run dune-scraper` - Scraper dune.com principal
- `npm run extract-dune` - Extracteur spécialisé top traders
- `npm run complete-data` - Extraction complète multi-sources

### APIs et Tests
- `npm run api-gmgn` - Test interface GMGN
- `npm run test-apis` - Test CoinGecko et autres APIs
- `npm test` (depuis CLEAN/) - Test API Supabase

## 📊 Edge Functions Déployées

1. **cielo-api** - API complète remplaçant le serveur local
2. **wallet-enrichment** - Enrichissement par batch des wallets
3. **system-monitoring** - Monitoring et gestion du système

## 🎯 Migration Terminée

✅ **APIs serverless** déployées sur Supabase  
✅ **Scripts de collecte** organisés et fonctionnels  
✅ **Base de données** migrée avec schéma étendu  
✅ **Monitoring** et dashboard disponibles  
✅ **Tests** validés et documentés  

Le système est maintenant **100% opérationnel** avec une architecture hybride optimale !
