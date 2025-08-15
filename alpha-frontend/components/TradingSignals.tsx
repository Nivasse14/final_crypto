'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  Bell,
  Eye,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react'
import { Wallet } from '../lib/supabase'
import { formatters, alphaCalculators } from '../lib/utils'

interface TradingSignalsProps {
  wallets: Wallet[]
}

interface Signal {
  id: string
  type: 'buy' | 'sell' | 'watch' | 'alert'
  wallet: Wallet
  strength: number
  reason: string
  timestamp: Date
  confidence: number
}

export function TradingSignals({ wallets }: TradingSignalsProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [selectedSignalType, setSelectedSignalType] = useState<'all' | 'buy' | 'sell' | 'watch' | 'alert'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Génération des signaux avancés
  const generateSignals = useMemo(() => {
    const newSignals: Signal[] = []

    wallets.forEach(wallet => {
      const alphaScore = alphaCalculators.calculateAlphaScore(wallet)
      const riskScore = alphaCalculators.calculateRiskScore(wallet)
      
      // Signal ACHAT - Alpha émergent
      if (alphaScore > 70 && riskScore < 50 && wallet.win_rate > 0.7 && wallet.total_pnl > 100000) {
        newSignals.push({
          id: `buy-${wallet.wallet_address}`,
          type: 'buy',
          wallet,
          strength: Math.min(95, alphaScore),
          reason: `Alpha Score: ${alphaScore.toFixed(1)} | Win Rate: ${formatters.formatWinRate(wallet.win_rate)} | Faible risque`,
          timestamp: new Date(),
          confidence: 0.85
        })
      }

      // Signal SURVEILLANCE - Baleine active
      if (wallet.total_pnl > 1000000 && new Date(wallet.last_active).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
        newSignals.push({
          id: `watch-${wallet.wallet_address}`,
          type: 'watch',
          wallet,
          strength: 80,
          reason: `Baleine active (${formatters.formatPnL(wallet.total_pnl)}) | Dernière activité: ${formatters.timeAgo(wallet.last_active)}`,
          timestamp: new Date(),
          confidence: 0.9
        })
      }

      // Signal ALERTE - Changement de comportement
      if (wallet.unrealized_pnl < -50000 && wallet.realized_pnl > 500000) {
        newSignals.push({
          id: `alert-${wallet.wallet_address}`,
          type: 'alert',
          wallet,
          strength: 70,
          reason: `Perte non réalisée importante: ${formatters.formatPnL(wallet.unrealized_pnl)} | Gains réalisés: ${formatters.formatPnL(wallet.realized_pnl)}`,
          timestamp: new Date(),
          confidence: 0.75
        })
      }

      // Signal VENTE - Risque élevé
      if (riskScore > 80 && wallet.unrealized_pnl < -100000) {
        newSignals.push({
          id: `sell-${wallet.wallet_address}`,
          type: 'sell',
          wallet,
          strength: Math.min(90, riskScore),
          reason: `Risque élevé: ${riskScore.toFixed(1)} | Pertes importantes non réalisées`,
          timestamp: new Date(),
          confidence: 0.7
        })
      }

      // Signal SURVEILLANCE - Nouveau performant
      if (wallet.tx_count < 50 && wallet.win_rate > 0.8 && wallet.total_pnl > 50000) {
        newSignals.push({
          id: `watch-new-${wallet.wallet_address}`,
          type: 'watch',
          wallet,
          strength: 75,
          reason: `Nouveau trader prometteur | ${wallet.tx_count} tx | Win Rate: ${formatters.formatWinRate(wallet.win_rate)}`,
          timestamp: new Date(),
          confidence: 0.65
        })
      }
    })

    return newSignals.sort((a, b) => b.strength - a.strength).slice(0, 50)
  }, [wallets])

  useEffect(() => {
    setSignals(generateSignals)
  }, [generateSignals])

  // Auto-refresh des signaux
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setSignals(generateSignals)
    }, 30000) // Refresh toutes les 30 secondes

    return () => clearInterval(interval)
  }, [autoRefresh, generateSignals])

  const filteredSignals = useMemo(() => {
    if (selectedSignalType === 'all') return signals
    return signals.filter(signal => signal.type === selectedSignalType)
  }, [signals, selectedSignalType])

  const signalStats = useMemo(() => {
    const stats = {
      buy: signals.filter(s => s.type === 'buy').length,
      sell: signals.filter(s => s.type === 'sell').length,
      watch: signals.filter(s => s.type === 'watch').length,
      alert: signals.filter(s => s.type === 'alert').length,
      highConfidence: signals.filter(s => s.confidence > 0.8).length,
      avgStrength: signals.reduce((sum, s) => sum + s.strength, 0) / signals.length || 0
    }
    return stats
  }, [signals])

  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'sell': return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'watch': return <Eye className="h-4 w-4 text-blue-400" />
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getSignalColor = (type: Signal['type']) => {
    switch (type) {
      case 'buy': return 'from-green-900/50 to-emerald-900/50 border-green-500/30'
      case 'sell': return 'from-red-900/50 to-rose-900/50 border-red-500/30'
      case 'watch': return 'from-blue-900/50 to-cyan-900/50 border-blue-500/30'
      case 'alert': return 'from-yellow-900/50 to-orange-900/50 border-yellow-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistiques des signaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title="🟢 Achat" value={signalStats.buy} color="text-green-400" />
        <StatCard title="🔴 Vente" value={signalStats.sell} color="text-red-400" />
        <StatCard title="👁️ Surveillance" value={signalStats.watch} color="text-blue-400" />
        <StatCard title="⚠️ Alertes" value={signalStats.alert} color="text-yellow-400" />
        <StatCard title="🎯 Haute Confiance" value={signalStats.highConfidence} color="text-purple-400" />
        <StatCard title="📊 Force Moyenne" value={`${signalStats.avgStrength.toFixed(1)}%`} color="text-gray-400" />
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'buy', 'sell', 'watch', 'alert'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedSignalType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSignalType(type)}
              className={selectedSignalType === type ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
            >
              {type === 'all' && 'Tous'}
              {type === 'buy' && '🟢 Achat'}
              {type === 'sell' && '🔴 Vente'}
              {type === 'watch' && '👁️ Watch'}
              {type === 'alert' && '⚠️ Alerte'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-600' : 'border-green-600 text-green-400'}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>

          <div className="text-sm text-gray-400">
            {filteredSignals.length} signaux • Mis à jour: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Liste des signaux */}
      <div className="space-y-4">
        {filteredSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Aucun signal trouvé</h3>
            <p className="text-gray-500">Les signaux apparaîtront ici basés sur l'analyse des portefeuilles.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  color: string
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="text-xs text-gray-400 mb-1">{title}</div>
        <div className={`text-lg font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

interface SignalCardProps {
  signal: Signal
}

function SignalCard({ signal }: SignalCardProps) {
  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-400'
    if (strength >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Très élevée'
    if (confidence >= 0.6) return 'Élevée'
    if (confidence >= 0.4) return 'Moyenne'
    return 'Faible'
  }

  const getSignalIcon = (type: Signal['type']) => {
    switch (type) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'sell': return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'watch': return <Eye className="h-4 w-4 text-blue-400" />
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getSignalColor = (type: Signal['type']) => {
    switch (type) {
      case 'buy': return 'from-green-900/50 to-emerald-900/50 border-green-500/30'
      case 'sell': return 'from-red-900/50 to-rose-900/50 border-red-500/30'
      case 'watch': return 'from-blue-900/50 to-cyan-900/50 border-blue-500/30'
      case 'alert': return 'from-yellow-900/50 to-orange-900/50 border-yellow-500/30'
    }
  }

  return (
    <Card className={`bg-gradient-to-r ${getSignalColor(signal.type)} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {getSignalIcon(signal.type)}
              <Badge className={`${signal.type === 'buy' ? 'bg-green-600' : signal.type === 'sell' ? 'bg-red-600' : signal.type === 'watch' ? 'bg-blue-600' : 'bg-yellow-600'} text-white`}>
                {signal.type.toUpperCase()}
              </Badge>
              <code className="text-sm bg-slate-700/50 px-2 py-1 rounded">
                {formatters.formatAddress(signal.wallet.wallet_address)}
              </code>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">PnL</p>
              <p className={`text-lg font-bold ${signal.wallet.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatters.formatPnL(signal.wallet.total_pnl)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-lg font-bold text-blue-400">
                {formatters.formatWinRate(signal.wallet.win_rate)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Force</p>
              <p className={`text-lg font-bold ${getStrengthColor(signal.strength)}`}>
                {signal.strength.toFixed(1)}%
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Confiance</p>
              <p className="text-sm font-bold text-purple-400">
                {getConfidenceText(signal.confidence)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Horodatage</p>
              <div className="flex items-center space-x-1 text-sm text-gray-300">
                <Clock className="h-3 w-3" />
                <span>{signal.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-black/20 rounded-lg">
          <p className="text-sm text-gray-300">{signal.reason}</p>
        </div>
      </CardContent>
    </Card>
  )
}
