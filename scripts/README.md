# Scripts de Collecte et Traitement - scanDune

Ce dossier contient tous les scripts Node.js pour la collecte et le traitement des données, séparés de l'infrastructure Supabase serverless.

## Scripts Disponibles

### 🔍 Collecte de Données

- **`dune-scraper.js`** - Script principal de scraping des données dune.com
  - Récupère les top wallets depuis Dune Analytics
  - Sauvegarde en JSON et upload automatique vers Supabase
  - Usage: `npm run dune-scraper`

- **`extract-dune-top-traders.js`** - Extracteur spécialisé pour les top traders
  - Usage: `npm run extract-dune`

### 🌐 APIs et Enrichissement

- **`api-gmgn.js`** - Interface avec l'API GMGN.ai
  - Récupération de données de wallets depuis GMGN
  - Usage: `npm run api-gmgn`

- **`complete-data-extractor.js`** - Extracteur de données complètes
  - Combine plusieurs sources de données
  - Usage: `npm run complete-data`

- **`coingecko-terminal-api.js`** - Interface avec CoinGecko Terminal
  - Test et utilisation de l'API CoinGecko
  - Usage: `npm run test-apis`

- **`gecko-api.js`** - Interface avec l'API CoinGecko standard

- **`gmgn.js`** - Utilitaires GMGN

- **`cielo-api.js`** + **`cielo.js`** - Interface avec l'API Cielo

## Installation

```bash
cd scripts/
npm install
```

## Configuration

Créez un fichier `.env` dans ce dossier avec :

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
COINGECKO_API_KEY=your_coingecko_key
# Autres clés API si nécessaire
```

## Utilisation

### Scraper Dune (Principal)
```bash
npm run dune-scraper
```

### Test des APIs
```bash
npm run test-apis
npm run api-gmgn
```

### Extraction complète
```bash
npm run complete-data
```

## Architecture

- **Scripts Node.js** (ce dossier) : Collecte et traitement de données
- **Supabase Edge Functions** (`../supabase/`) : APIs serverless et enrichissement
- **CLEAN/** (`../CLEAN/`) : Configuration et tests simples

## Notes

- Ces scripts fonctionnent avec l'infrastructure Supabase déployée
- Les données collectées sont automatiquement uploadées vers Supabase
- L'API "complete" est maintenant disponible via Supabase (`../supabase/functions/cielo-api/`)
