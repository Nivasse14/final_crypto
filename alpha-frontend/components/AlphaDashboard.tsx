'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet as WalletIcon, 
  Trophy, 
  Target,
  Zap,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Wallet } from '../lib/supabase'
import { formatters, alphaCalculators } from '../lib/utils'

interface AlphaDashboardProps {
  wallets: Wallet[]
  loading: boolean
}

export function AlphaDashboard({ wallets, loading }: AlphaDashboardProps) {
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'alpha' | 'risk'>('pnl')
  const [filterType, setFilterType] = useState<'all' | 'whales' | 'diamonds' | 'emerging'>('all')

  // Calculs des métriques principales
  const metrics = useMemo(() => {
    if (!wallets.length) return null

    const totalPnL = wallets.reduce((sum, w) => sum + w.total_pnl, 0)
    const avgWinRate = wallets.reduce((sum, w) => sum + w.win_rate, 0) / wallets.length
    const activeWallets = wallets.filter(w => 
      new Date(w.last_active).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
    
    const patterns = alphaCalculators.detectPatterns(wallets)
    
    return {
      totalPnL,
      avgWinRate,
      activeWallets,
      totalWallets: wallets.length,
      whalesCount: patterns.whales.length,
      diamondsCount: patterns.diamonds.length,
      emergingCount: patterns.emergingAlpha.length
    }
  }, [wallets])

  // Filtrage et tri des portefeuilles
  const filteredWallets = useMemo(() => {
    let filtered = [...wallets]

    // Filtrage par type
    if (filterType === 'whales') {
      filtered = filtered.filter(w => w.total_pnl > 1000000)
    } else if (filterType === 'diamonds') {
      filtered = filtered.filter(w => w.win_rate > 0.8 && w.tx_count > 100)
    } else if (filterType === 'emerging') {
      filtered = filtered.filter(w => 
        w.total_pnl > 50000 && 
        w.win_rate > 0.6 && 
        new Date(w.last_active).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      )
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return b.total_pnl - a.total_pnl
        case 'winRate':
          return b.win_rate - a.win_rate
        case 'alpha':
          return alphaCalculators.calculateAlphaScore(b) - alphaCalculators.calculateAlphaScore(a)
        case 'risk':
          return alphaCalculators.calculateRiskScore(a) - alphaCalculators.calculateRiskScore(b)
        default:
          return 0
      }
    })

    return filtered.slice(0, 50) // Top 50
  }, [wallets, sortBy, filterType])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-slate-800/50">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="PnL Total"
          value={formatters.formatPnL(metrics?.totalPnL || 0)}
          icon={DollarSign}
          trend="up"
          className="glass-card border-shine pulse-glow"
          iconClassName="bg-gradient-to-br from-emerald-500 to-green-600 text-white"
        />
        
        <MetricCard
          title="Taux de Réussite Moyen"
          value={formatters.formatWinRate(metrics?.avgWinRate || 0)}
          icon={Target}
          trend="up"
          className="glass-card border-shine"
          iconClassName="bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
        />
        
        <MetricCard
          title="Portefeuilles Actifs"
          value={`${metrics?.activeWallets || 0}/${metrics?.totalWallets || 0}`}
          icon={Activity}
          trend="stable"
          className="glass-card border-shine"
          iconClassName="bg-gradient-to-br from-purple-500 to-violet-600 text-white"
        />
        
        <MetricCard
          title="Alpha Détecté"
          value={`${metrics?.emergingCount || 0} signaux`}
          icon={Zap}
          trend="up"
          className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-orange-500/30"
        />
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'whales', 'diamonds', 'emerging'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
            >
              {type === 'all' && 'Tous'}
              {type === 'whales' && '🐋 Baleines'}
              {type === 'diamonds' && '💎 Diamants'}
              {type === 'emerging' && '🚀 Émergents'}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['pnl', 'winRate', 'alpha', 'risk'] as const).map((sort) => (
            <Button
              key={sort}
              variant={sortBy === sort ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy(sort)}
            >
              {sort === 'pnl' && 'PnL'}
              {sort === 'winRate' && 'Win Rate'}
              {sort === 'alpha' && 'Alpha Score'}
              {sort === 'risk' && 'Risque'}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des portefeuilles */}
      <div className="grid grid-cols-1 gap-4">
        {filteredWallets.map((wallet, index) => (
          <WalletCard key={wallet.wallet_address} wallet={wallet} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'stable'
  className?: string
  iconClassName?: string
}

function MetricCard({ title, value, icon: Icon, trend, className, iconClassName }: MetricCardProps) {
  return (
    <Card className={`${className} shadow-lg overflow-hidden transition-all duration-300 hover:translate-y-[-4px]`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
            <p className="text-3xl font-bold text-white mt-1 text-glow">{value}</p>
            <div className="mt-2">
              {trend === 'up' && (
                <span className="flex items-center text-xs text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> Augmentation
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center text-xs text-red-400">
                  <ArrowDownRight className="h-3 w-3 mr-1" /> Diminution
                </span>
              )}
              {trend === 'stable' && (
                <span className="flex items-center text-xs text-blue-400">
                  <Activity className="h-3 w-3 mr-1" /> Stable
                </span>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconClassName || 'bg-slate-800'}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WalletCardProps {
  wallet: Wallet
  rank: number
}

function WalletCard({ wallet, rank }: WalletCardProps) {
  const alphaScore = alphaCalculators.calculateAlphaScore(wallet)
  const riskScore = alphaCalculators.calculateRiskScore(wallet)
  
  const getRankBadge = (rank: number) => {
    if (rank <= 3) return { color: 'bg-yellow-500', icon: Trophy }
    if (rank <= 10) return { color: 'bg-purple-500', icon: TrendingUp }
    return { color: 'bg-slate-500', icon: WalletIcon }
  }

  const rankBadge = getRankBadge(rank)

  return (
    <Card className="glass-card hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          {/* Première colonne: Infos de base */}
          <div className="flex items-center space-x-4">
            <div className={`${rankBadge.color} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
              {rank <= 10 ? rank : <rankBadge.icon className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <code className="text-sm bg-slate-700/50 backdrop-blur-md px-3 py-1 rounded-full border border-slate-600/50">
                  {formatters.formatAddress(wallet.wallet_address)}
                </code>
                {wallet.enriched && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                    <Zap className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={alphaScore < 30 ? 'outline' : alphaScore < 70 ? 'secondary' : 'default'} 
                  className="text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                >
                  Alpha: {alphaScore.toFixed(0)}
                </Badge>
                <Badge 
                  variant={riskScore < 30 ? 'default' : riskScore < 70 ? 'secondary' : 'destructive'} 
                  className="text-xs font-medium"
                >
                  Risque: {riskScore.toFixed(0)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Deuxième colonne: Métriques */}
          <div className="flex items-center space-x-8">
            {/* PnL Total */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">PnL Total</p>
              <p className={`text-lg font-bold ${wallet.total_pnl >= 0 ? 'text-gradient-success' : 'text-red-400'}`}>
                {formatters.formatPnL(wallet.total_pnl)}
              </p>
            </div>

            {/* Win Rate */}
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30 mr-2">
                  <span className="text-lg font-bold text-white">{Math.round(wallet.win_rate * 100)}%</span>
                </div>
                <Target className="h-4 w-4 text-blue-400" />
              </div>
            </div>

            {/* Transactions */}
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400 mb-1">TX</p>
              <p className="text-base font-bold text-gray-300">
                {wallet.tx_count}
              </p>
            </div>

            {/* Dernière activité */}
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400 mb-1">Activité</p>
              <p className="text-sm text-gray-300">
                {formatters.timeAgo(wallet.last_active)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
