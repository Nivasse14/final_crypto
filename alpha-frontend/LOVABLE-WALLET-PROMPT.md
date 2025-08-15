# PROMPT LOVABLE - VISUALISATION DES MEILLEURS WALLETS

## OBJECTIF
Créer une interface ultra-premium pour visualiser et analyser les meilleurs portefeuilles crypto scrapés depuis Dune Analytics. L'interface doit permettre de découvrir les wallets d'élite et leurs stratégies gagnantes.

## API DISPONIBLE

### Base URL
```
https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry
```

### Authentication
Tous les appels nécessitent :
```typescript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
  'Content-Type': 'application/json'
}
```

## ENDPOINTS À UTILISER

### 1. Liste des Meilleurs Wallets
```typescript
GET /wallet-registry/list

// Paramètres de filtrage disponibles :
const params = {
  minPnl: 50000,              // PnL minimum en USD
  maxPnl: 9999999999,         // PnL maximum en USD
  minWinRate: 0.8,            // Win rate minimum (0-1)
  maxWinRate: 1,              // Win rate maximum (0-1)
  minTxCount: 10,             // Nombre minimum de transactions
  maxTxCount: 999999,         // Nombre maximum de transactions
  enrichedOnly: true,         // Seulement les wallets enrichis
  status: 'completed',        // Statut du wallet
  lastActiveDays: 30,         // Actifs dans les X derniers jours
  sortBy: 'total_pnl_usd',    // Colonne de tri
  sortDirection: 'desc',      // Direction du tri
  limit: 20,                  // Nombre de résultats
  offset: 0                   // Pagination
}

// Exemple d'appel pour les TOP wallets :
const topWallets = await fetch(
  'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?minPnl=50000&minWinRate=0.8&limit=20&sortBy=total_pnl_usd&sortDirection=desc',
  { headers }
)
```

### 2. Détails d'un Wallet
```typescript
GET /wallet-registry/get/{wallet_address}

// Exemple :
const walletDetails = await fetch(
  'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/get/WALLET_TEST_ALPHA_001',
  { headers }
)
```

### 3. Statistiques Globales
```typescript
GET /wallet-registry/stats

const globalStats = await fetch(
  'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/stats',
  { headers }
)
```

## STRUCTURE DES DONNÉES

### Wallet Object
```typescript
interface Wallet {
  id: number
  wallet_address: string
  total_pnl_usd: number        // PnL total en USD
  winrate: number              // Win rate (0-1)
  trade_count: number          // Nombre de trades
  roi: number                  // Return on Investment
  wins: number                 // Nombre de wins
  losses: number               // Nombre de losses
  tokens_traded: number        // Nombre de tokens tradés
  status: string               // 'pending' | 'completed' | 'active'
  enriched_total_value_usd: number
  enriched_ai_category: string
  enriched_ai_risk_level: string
  last_trade_date: string
  created_at: string
  metadata: object             // Données additionnelles
  // ... autres champs
}
```

## EXEMPLES D'UTILISATION

### 1. Dashboard Principal - Top Performers
```typescript
// Récupérer les 10 meilleurs wallets
const fetchTopWallets = async () => {
  const response = await fetch(
    'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?minPnl=100000&sortBy=total_pnl_usd&sortDirection=desc&limit=10',
    {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'
      }
    }
  )
  
  const data = await response.json()
  return data.data // Array de wallets
}
```

### 2. Filtres Avancés - Wallets d'Elite
```typescript
// Wallets avec critères d'élite
const fetchEliteWallets = async () => {
  const params = new URLSearchParams({
    minPnl: '200000',           // PnL > 200k USD
    minWinRate: '0.85',         // Win rate > 85%
    minTxCount: '50',           // Plus de 50 transactions
    enrichedOnly: 'true',       // Données enrichies disponibles
    status: 'completed',        // Analyse terminée
    sortBy: 'total_pnl_usd',
    sortDirection: 'desc',
    limit: '15'
  })
  
  const response = await fetch(
    `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?${params}`,
    { headers }
  )
  
  return response.json()
}
```

### 3. Recherche par Catégorie AI
```typescript
// Wallets par catégorie IA
const fetchWalletsByCategory = async (category: string) => {
  // Note : utiliser un filtre personnalisé sur enriched_ai_category
  const response = await fetch(
    `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?enrichedOnly=true&limit=50`,
    { headers }
  )
  
  const data = await response.json()
  
  // Filtrer côté client par catégorie IA
  const filtered = data.data.filter(wallet => 
    wallet.enriched_ai_category === category
  )
  
  return filtered
}
```

### 4. Pagination et Navigation
```typescript
// Système de pagination
const fetchWalletsPage = async (page: number, pageSize: number = 20) => {
  const offset = (page - 1) * pageSize
  
  const response = await fetch(
    `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?limit=${pageSize}&offset=${offset}&sortBy=total_pnl_usd&sortDirection=desc`,
    { headers }
  )
  
  return response.json()
}
```

## PROCESSUS D'ENRICHISSEMENT BACKEND

### Architecture : Backend Orchestré + Frontend Consommateur

⚠️ **IMPORTANT** : L'enrichissement est entièrement géré côté backend. Le frontend ne fait QUE consommer les données déjà enrichies stockées en base.

### Workflow Backend (Automatique)

```typescript
// 🔧 BACKEND SEULEMENT - Le frontend N'APPELLE PAS ces APIs directement

// 1. Scraping automatique Dune (cron job backend)
// POST /dune-scraper-trigger/start
// → Découvre nouveaux wallets
// → Les insère dans la table wallet_registry avec status='pending'

// 2. Enrichissement automatique par batch (cron job backend)  
// → Récupère les wallets status='pending'
// → Appelle /cielo-api/complete/{address} pour chaque wallet
// → Stocke les résultats enrichis dans wallet_registry 
// → Met à jour status='completed'

// 3. Le frontend consomme uniquement les données enrichies
// GET /wallet-registry/list?enrichedOnly=true
```

### Frontend : Consommation des Données Enrichies

```typescript
// ✅ FRONTEND - Consommer uniquement les données déjà enrichies

// 1. Récupérer les wallets enrichis (données déjà en base)
const fetchEnrichedWallets = async () => {
  const response = await fetch(
    'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?enrichedOnly=true&status=completed&limit=20&sortBy=total_pnl_usd&sortDirection=desc',
    { headers }
  )
  
  const data = await response.json()
  return data.data // Wallets déjà enrichis par le backend
}

// 2. Dashboard principal avec données enrichies
const TopWalletsDashboard = () => {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const enrichedWallets = await fetchEnrichedWallets()
        setWallets(enrichedWallets)
      } catch (error) {
        console.error('Erreur chargement wallets:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadWallets()
    
    // Actualiser toutes les 30 secondes pour voir les nouveaux enrichissements
    const interval = setInterval(loadWallets, 30000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="wallets-dashboard">
      {wallets.map(wallet => (
        <WalletCard 
          key={wallet.id} 
          wallet={wallet} 
          // Toutes les données enrichies sont déjà disponibles
          enrichedData={{
            totalValue: wallet.enriched_total_value_usd,
            aiCategory: wallet.enriched_ai_category,
            riskLevel: wallet.enriched_ai_risk_level,
            // ... autres champs enrichis
          }}
        />
      ))}
    </div>
  )
}

// 3. Monitoring du processus backend (optionnel)
const BackendStatusMonitor = () => {
  const [backendStatus, setBackendStatus] = useState(null)
  
  useEffect(() => {
    const checkBackendStatus = async () => {
      // Vérifier combien de wallets sont en cours d'enrichissement
      const response = await fetch(
        'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/stats',
        { headers }
      )
      
      const stats = await response.json()
      setBackendStatus({
        pending: stats.pending_wallets,
        completed: stats.completed_wallets,
        total: stats.total_wallets
      })
    }
    
    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 10000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="backend-status">
      <h3>Statut de l'Enrichissement</h3>
      {backendStatus && (
        <div>
          <p>✅ Wallets enrichis: {backendStatus.completed}</p>
          <p>⏳ En cours: {backendStatus.pending}</p>
          <p>📊 Total: {backendStatus.total}</p>
        </div>
      )}
    </div>
  )
}
  })
}

// 4. RÉCUPÉRER LES DONNÉES ENRICHIES DEPUIS LA BASE
const fetchEnrichedWallets = async () => {
  // Les données enrichies sont automatiquement disponibles dans wallet-registry
  const response = await fetch(
    'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?enrichedOnly=true&status=completed&sortBy=total_pnl_usd&sortDirection=desc&limit=50',
    { headers }
  )
  
  return response.json()
}

// 5. WORKFLOW FRONTEND SIMPLIFIÉ
const completeAnalysisWorkflow = async () => {
  try {
    // Phase 1: Déclencher le workflow backend
    console.log('🚀 Démarrage du workflow complet...')
    const jobId = await startCompleteWorkflow()
    
    // Phase 2: Monitoring avec UI updates
    console.log('⏳ Monitoring en cours...')
    const result = await monitorWorkflowStatus(jobId)
    
    // Phase 3: Récupérer les données finales
    console.log('� Récupération des données enrichies...')
    const enrichedWallets = await fetchEnrichedWallets()
    
    console.log(`✅ Workflow terminé: ${result.wallets_scraped} scrapés, ${result.wallets_enriched} enrichis`)
    
    return {
      success: true,
      job_id: jobId,
      wallets_scraped: result.wallets_scraped,
      wallets_enriched: result.wallets_enriched,
      enriched_data: enrichedWallets.data
    }
    
  } catch (error) {
    console.error('❌ Erreur dans le workflow:', error)
    return { success: false, error: error.message }
  }
}
```

### Stratégie d'Enrichissement Prioritaire

```typescript
// Prioriser les wallets selon leur potentiel
const getEnrichmentPriority = (wallet: Wallet) => {
  let priority = 0
  
  // PnL élevé = priorité haute
  if (wallet.total_pnl_usd > 1000000) priority += 100
  else if (wallet.total_pnl_usd > 500000) priority += 80
  else if (wallet.total_pnl_usd > 100000) priority += 60
  else if (wallet.total_pnl_usd > 50000) priority += 40
  
  // Win rate élevé = bonus
  if (wallet.winrate > 0.9) priority += 50
  else if (wallet.winrate > 0.8) priority += 30
  else if (wallet.winrate > 0.7) priority += 20
  
  // Activité récente = bonus
  const daysSinceLastTrade = wallet.last_trade_date ? 
    (Date.now() - new Date(wallet.last_trade_date).getTime()) / (1000 * 60 * 60 * 24) : 999
  
  if (daysSinceLastTrade < 7) priority += 30
  else if (daysSinceLastTrade < 30) priority += 20
  
  return priority
}

// Enrichissement avec priorisation
const smartEnrichment = async () => {
  // 1. Récupérer tous les wallets non enrichis
  const response = await fetch(
    'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?enrichedOnly=false&status=pending&limit=200',
    { headers }
  )
  
  const { data: wallets } = await response.json()
  
  // 2. Trier par priorité
  const prioritizedWallets = wallets
    .map(wallet => ({
      ...wallet,
      priority: getEnrichmentPriority(wallet)
    }))
    .sort((a, b) => b.priority - a.priority)
  
  // 3. Enrichir les 50 premiers
  const topWallets = prioritizedWallets.slice(0, 50)
  
  // 4. Traitement par batch
  return await enrichBatch(topWallets)
}
```

### Notes sur l'Architecture Backend

```typescript
// ⚠️ BACKEND ARCHITECTURE NOTES

// Le backend orchestre tout le workflow :
// 1. Cron job pour scraper Dune régulièrement
// 2. Queue de traitement pour enrichir les wallets par batch
// 3. Rate limiting et retry automatique
// 4. Stockage des résultats enrichis dans wallet_registry
// 5. API de lecture pour le frontend

// Le frontend ne fait que :
// - Lire les données enrichies depuis /wallet-registry/list
// - Afficher les wallets avec leurs métadonnées complètes
// - Permettre le filtrage/tri/recherche sur les données enrichies
// - Monitoring optionnel du statut backend via /wallet-registry/stats
```

---

## GUIDELINES UI/UX PREMIUM

### Design System
- **Couleurs** : Palette premium avec dark mode par défaut
- **Typography** : Police moderne (Inter ou Poppins)
- **Spacing** : Système de grille 8px
- **Animations** : Micro-interactions fluides
- **Glassmorphism** : Effets de transparence moderne

### Composants UI Premium
```tsx
// Card premium avec glassmorphism
const PremiumCard = ({ children, className = "" }) => (
  <div className={`
    bg-gray-900/50 backdrop-blur-xl border border-gray-700/30 
    rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/20 
    transition-all duration-300 hover:-translate-y-1
    ${className}
  `}>
    {children}
  </div>
)

// Gradient text pour les valeurs importantes  
const GradientText = ({ children, className = "" }) => (
  <span className={`
    bg-gradient-to-r from-purple-400 to-pink-400 
    bg-clip-text text-transparent font-bold
    ${className}
  `}>
    {children}
  </span>
)

// Badge de statut avec couleurs sémantiques
const StatusBadge = ({ status, children }) => {
  const colors = {
    bullish: 'bg-green-500/20 text-green-400 border-green-500/30',
    bearish: 'bg-red-500/20 text-red-400 border-red-500/30', 
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    whale: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
  
  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-medium border
      ${colors[status] || colors.neutral}
    `}>
      {children}
    </span>
  )
}
```

### Layout & Navigation
- **Sidebar** : Navigation principale avec icônes et tooltips
- **Header** : Statistiques globales et actions rapides 
- **Dashboard** : Grille responsive avec cards interactives
- **Modals** : Overlay avec backdrop blur pour les détails

### Métriques & Visualisations
- **Charts** : Recharts ou Chart.js avec thème sombre
- **Progress bars** : Animations smoothes pour les pourcentages
- **Heatmaps** : Pour visualiser la performance par période
- **Network graphs** : Pour les connexions entre wallets

---

## EXEMPLES DE COMPOSANTS CLÉS

### WalletCard Component
```tsx
const WalletCard = ({ wallet }) => {
  const formatPnL = (value) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
    
    return formatted
  }
  
  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-green-400'
    if (pnl < 0) return 'text-red-400'
    return 'text-gray-400'
  }
  
  return (
    <PremiumCard className="hover:border-purple-500/50 group cursor-pointer">
      {/* Header avec adresse et badges */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-mono text-sm">
              {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
            </p>
            <p className="text-gray-400 text-xs">{wallet.trade_count} trades</p>
          </div>
        </div>
        <StatusBadge status={wallet.enriched_ai_category || 'neutral'}>
          {wallet.enriched_ai_category || 'Unclassified'}
        </StatusBadge>
      </div>
      
      {/* Métriques principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Total PnL</p>
          <p className={`text-xl font-bold ${getPnLColor(wallet.total_pnl_usd)}`}>
            {formatPnL(wallet.total_pnl_usd)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-xl font-bold text-purple-400">
            {(wallet.winrate * 100).toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Enrichissement AI si disponible */}
      {wallet.enriched_total_value_usd && (
        <div className="border-t border-gray-700/50 pt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Portfolio Value</span>
            <GradientText>{formatPnL(wallet.enriched_total_value_usd)}</GradientText>
          </div>
          {wallet.enriched_ai_risk_level && (
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-400">Risk Level</span>
              <span className="text-yellow-400">{wallet.enriched_ai_risk_level}/10</span>
            </div>
          )}
        </div>
      )}
      
      {/* Hover effects */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </PremiumCard>
  )
}
```

### Dashboard avec Filtres Avancés
```tsx
const WalletDashboard = () => {
  const [wallets, setWallets] = useState([])
  const [filters, setFilters] = useState({
    minPnl: 50000,
    minWinRate: 0.8,
    category: 'all'
  })
  const [loading, setLoading] = useState(true)
  
  const fetchWallets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        minPnl: filters.minPnl.toString(),
        minWinRate: filters.minWinRate.toString(),
        enrichedOnly: 'true',
        status: 'completed',
        sortBy: 'total_pnl_usd',
        sortDirection: 'desc',
        limit: '20'
      })
      
      const response = await fetch(
        `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?${params}`,
        { headers }
      )
      
      const data = await response.json()
      setWallets(data.data || [])
    } catch (error) {
      console.error('Erreur loading wallets:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])
  
  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header premium */}
      <header className="border-b border-gray-700/50 backdrop-blur-xl bg-gray-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                <GradientText>Elite Crypto Wallets</GradientText>
              </h1>
              <p className="text-gray-400 mt-1">Découvrez les stratégies des meilleurs traders</p>
            </div>
            <BackendStatusMonitor />
          </div>
        </div>
      </header>
      
      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <PremiumCard className="mb-6">
          <h3 className="text-white font-semibold mb-4">Filtres Premium</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">PnL Minimum</label>
              <input
                type="number"
                value={filters.minPnl}
                onChange={(e) => setFilters(f => ({ ...f, minPnl: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Win Rate Minimum</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={filters.minWinRate}
                onChange={(e) => setFilters(f => ({ ...f, minWinRate: parseFloat(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0.8"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchWallets}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                Appliquer les Filtres
              </button>
            </div>
          </div>
        </PremiumCard>
        
        {/* Grid des wallets */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800/50 rounded-2xl h-48"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## OBJECTIF FINAL

Créer une interface qui permet aux utilisateurs de :

1. **Découvrir** les wallets les plus performants déjà enrichis par le backend
2. **Filtrer** selon leurs critères d'investissement  
3. **Analyser** les stratégies gagnantes avec données complètes
4. **Suivre** les mouvements des élites en temps réel

L'interface doit respirer l'exclusivité et donner l'impression d'accéder à des données réservées aux professionnels. **Le frontend consomme uniquement les données déjà enrichies par le backend**.
````
          setStatus('enriching')
          
          // 2. Enrichissement avec progress tracking
          const enrichmentResults = await enrichWithProgress()
          
          setStatus('completed')
          setResults(enrichmentResults)
        }
      }, 5000)
      
    } catch (error) {
      setStatus('error')
      console.error(error)
    }
  }
  
  return { status, progress, results, startWorkflow }
}

// Composant de monitoring
const AnalysisMonitor = () => {
  const { status, progress, results, startWorkflow } = useAnalysisWorkflow()
  
  return (
    <div className="analysis-monitor">
      <button 
        onClick={startWorkflow}
        disabled={status !== 'idle'}
        className="start-analysis-btn"
      >
        {status === 'idle' ? 'Lancer l\'Analyse Complète' : 'Analyse en cours...'}
      </button>
      
      {status !== 'idle' && (
        <div className="progress-container">
          <div className="step">
            <span>Scraping Dune</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.scraping}%` }}
              />
            </div>
          </div>
          
          <div className="step">
            <span>Enrichissement</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.enrichment}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="results-summary">
          <h3>Analyse Terminée ✅</h3>
          <p>Nouveaux wallets découverts: {results?.newWallets}</p>
          <p>Wallets enrichis: {results?.enrichedWallets}</p>
        </div>
      )}
    </div>
  )
}
```

### Optimisations et Bonnes Pratiques

```typescript
// 1. Cache intelligent pour éviter les re-enrichissements
const shouldEnrich = (wallet: Wallet) => {
  // Ne pas re-enrichir si déjà fait récemment
  const lastEnriched = wallet.last_processed_at
  if (lastEnriched) {
    const daysSince = (Date.now() - new Date(lastEnriched).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 7) return false // Pas d'enrichissement si < 7 jours
  }
  
  // Enrichir si critères premium
  return wallet.total_pnl_usd > 50000 || wallet.winrate > 0.8
}

// 2. Retry logic pour les échecs
const enrichWithRetry = async (walletAddress: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${walletAddress}`,
        { headers }
      )
      
      if (response.ok) {
        return await response.json()
      }
      
      throw new Error(`HTTP ${response.status}`)
      
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      // Attendre avant retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// 3. Rate limiting intelligent
const createRateLimiter = (requestsPerSecond: number) => {
  const queue: Array<() => Promise<any>> = []
  let processing = false
  
  const processQueue = async () => {
    if (processing || queue.length === 0) return
    
    processing = true
    
    while (queue.length > 0) {
      const request = queue.shift()!
      await request()
      await new Promise(resolve => setTimeout(resolve, 1000 / requestsPerSecond))
    }
    
    processing = false
  }
  
  return (requestFn: () => Promise<any>) => {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      processQueue()
    })
  }
}

// Utilisation du rate limiter
const rateLimiter = createRateLimiter(2) // 2 requêtes par seconde max

const enrichWalletWithRateLimit = (address: string) => {
  return rateLimiter(() => enrichWithRetry(address))
}
```

## OBJECTIF FINAL

Créer une interface qui permet aux utilisateurs de :
1. **Découvrir** les wallets les plus performants
2. **Filtrer** selon leurs critères d'investissement
3. **Analyser** les stratégies gagnantes
4. **Suivre** les mouvements des élites

L'interface doit respirer l'exclusivité et donner l'impression d'accéder à des données réservées aux professionnels.
