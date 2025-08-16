# Solana Copy Trading ETL & API

Système ETL et API pour l'analyse de wallets Solana en vue de copy trading. Ce système ingère les données de trading, enrichit avec les prix temps réel (DexScreener + Jupiter), calcule des métriques avancées par période, et expose des endpoints pour filtrer et classer les meilleurs portefeuilles.

## 🎯 Fonctionnalités

### ETL Pipeline
- **Ingestion**: Données JSON de wallets Solana (structure Cielo API)
- **Enrichissement**: Prix temps réel via DexScreener (fallback Jupiter)
- **Calculs**: Métriques avancées 30j (profit factor, expectancy, drawdown, etc.)
- **Stockage**: PostgreSQL avec schéma optimisé pour les requêtes

### API Endpoints
- **`/wallets/top`**: Classement des meilleurs wallets avec filtres avancés
- **`/wallets/:address/positions`**: Positions actuelles et PnL non réalisés
- **`/wallets/:address/metrics`**: Métriques calculées par période
- **`/health`**: État du système et statistiques

### Métriques Calculées
- **Performance**: PnL 30j, ROI, winrate, profit factor
- **Risque**: Drawdown maximum, expectancy
- **Comportement**: Médiane temps de détention, ratio scalping
- **Exposition**: Répartition par market cap (nano → mega)
- **Score composite**: Copy trading score (0-100)

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Variables d'environnement configurées

### Setup
```bash
# Cloner et installer les dépendances
cd src/
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Exécuter les migrations de base de données
npm run migrate

# Build du projet
npm run build
```

## 🔧 Configuration

### Variables d'environnement (.env)
```bash
# Base de données PostgreSQL (REQUIS)
DATABASE_URL=postgresql://username:password@localhost:5432/copy_trading

# Port API (optionnel, défaut: 3000)
PORT=3000

# URL de l'API Cielo pour récupération des données
CIELO_API_URL=http://localhost:54321/functions/v1/cielo-api
```

### Schéma de base de données

Le système étend la table `wallet_registry` existante et ajoute :

- **`wallet_token_positions`**: Positions actuelles par wallet/token
- **`wallet_daily_metrics`**: Métriques quotidiennes agrégées
- **Colonnes supplémentaires** dans `wallet_registry` pour métriques 30j

## 📊 Utilisation

### 1. Démarrer l'API
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'API sera disponible sur `http://localhost:3000`

### 2. Exécuter l'ETL

#### Traiter un wallet depuis l'API Cielo
```bash
npx tsx src/cli/etl.ts process --wallet 5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1
```

#### Traiter depuis un fichier JSON
```bash
npx tsx src/cli/etl.ts process --file data/wallets.json --batch-size 25
```

#### Voir les statistiques
```bash
npx tsx src/cli/etl.ts stats
```

### 3. Utiliser l'API

#### Requête exemple: Top wallets
```bash
curl "http://localhost:3000/wallets/top?min_winrate=0.7&min_pf=1.8&min_trades=30&max_drawdown=500&min_unrealized_value=1000&cap_focus=mid,large"
```

#### Paramètres de filtrage disponibles:
- `min_winrate`: Winrate minimum (ex: 0.7 pour 70%)
- `min_pf`: Profit factor minimum (ex: 1.8)
- `min_expectancy`: Expectancy minimum en USD (ex: 100)
- `max_drawdown`: Drawdown maximum en USD (ex: 500)
- `min_trades`: Nombre minimum de trades (ex: 30)
- `cap_focus`: Focus market cap (nano,micro,low,mid,large,mega)
- `min_unrealized_value`: Valeur minimum positions non réalisées

#### Positions d'un wallet
```bash
curl "http://localhost:3000/wallets/5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/positions"
```

#### Métriques d'un wallet
```bash
curl "http://localhost:3000/wallets/5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/metrics?window=30d"
```

## 📈 Structure des données

### Format d'entrée (JSON)
```javascript
{
  "wallet_address": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  "pnl_fast": {
    "summary": {
      "tokens": [
        {
          "token_symbol": "BONK",
          "token_address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
          "total_buy_usd": 1000,
          "total_buy_amount": 50000000,
          "total_sell_usd": 1200,
          "total_sell_amount": 40000000,
          "holding_amount": 10000000,
          "hold_time": 1440,
          "num_swaps": 3,
          "pnl_usd": 200,
          "pnl_percentage": 20
        }
      ]
    }
  }
}
```

### Format de sortie API
```javascript
{
  "success": true,
  "count": 25,
  "data": [
    {
      "wallet_address": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
      "copy_trading_score": 87.5,
      "winrate_30d": 0.75,
      "profit_factor_30d": 2.4,
      "expectancy_usd_30d": 125.50,
      "pnl_30d": 3500,
      "roi_pct_30d": 23.5,
      "trades_30d": 45,
      "drawdown_max_usd_30d": 250,
      // ... autres métriques
    }
  ]
}
```

## 🔍 Métriques Détaillées

### Score Copy Trading (0-100)
- **30%** Profit Factor (0-3 clampé)
- **25%** Expectancy USD (winsorisé ±500)
- **20%** Winrate (40-90% clampé)
- **10%** Drawdown inverse (pénalise gros drawdowns)
- **10%** Score récence (EMA des PnL)
- **5%** Bonus/malus (honeypot rate, etc.)

### Calculs Principaux
```javascript
// Profit Factor
profit_factor = gross_profit_30d / gross_loss_abs_30d

// Expectancy
expectancy = (winrate * avg_win) - ((1-winrate) * avg_loss_abs)

// Position non réalisée
unrealized_pnl = holding_amount * (price_now - avg_cost_per_unit)

// Exposition par cap
cap_exposure_mid_pct = (trades_mid_cap / total_trades) * 100
```

## 🛠️ Architecture Technique

### Modules Principaux
- **`src/lib/prices.ts`**: Gestion des prix DexScreener + Jupiter
- **`src/lib/metrics.ts`**: Calculs des métriques de trading
- **`src/etl/index.ts`**: Pipeline ETL principal
- **`src/api/server.ts`**: Serveur Express API

### Gestion des Prix
- **Cache mémoire**: 60s TTL par défaut
- **Circuit breaker**: Protection contre les échecs d'API
- **Fallback**: DexScreener → Jupiter → none
- **Batch processing**: 20 tokens par batch avec délais

### Base de Données
- **PostgreSQL**: Optimisé pour requêtes analytiques
- **Index**: Copy trading score, winrate, profit factor
- **Upserts**: Gestion des mises à jour de positions

## 🧪 Tests

```bash
# Tests unitaires
npm run test:unit

# Tests complets
npm test

# Linting
npm run lint
```

## 📦 Déploiement

### Docker (recommandé)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables d'environnement production
```bash
DATABASE_URL=postgresql://prod_user:password@db.example.com:5432/copy_trading
PORT=3000
NODE_ENV=production
```

## 🎯 Objectif Final

Requête cible fonctionnelle:
```bash
curl "http://localhost:3000/wallets/top?min_winrate=0.7&min_pf=1.8&min_trades=30&max_drawdown=500&min_unrealized_value=1000&cap_focus=mid,large"
```

Retourne une liste ordonnée par `copy_trading_score` des wallets respectant tous les critères, prêts pour copy trading automatisé.

## 📞 Support

- Issues: GitHub Issues
- Documentation: `/docs` endpoint de l'API
- Health check: `/health` endpoint

---

**Version**: 1.0.0  
**License**: MIT  
**Auteur**: Copy Trading Team
