'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { 
  Search,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap
} from 'lucide-react'
import { Wallet } from '../lib/supabase'
import { formatters, alphaCalculators } from '../lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface WalletAnalyzerProps {
  wallets: Wallet[]
}

export function WalletAnalyzer({ wallets }: WalletAnalyzerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'overview' | 'patterns' | 'comparison'>('overview')

  const filteredWallets = useMemo(() => {
    return wallets.filter(w => 
      w.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20)
  }, [wallets, searchTerm])

  const analysis = useMemo(() => {
    if (!wallets.length) return null

    // Distribution des PnL
    const pnlDistribution = [
      { range: '< 0', count: wallets.filter(w => w.total_pnl < 0).length },
      { range: '0-10K', count: wallets.filter(w => w.total_pnl >= 0 && w.total_pnl < 10000).length },
      { range: '10K-100K', count: wallets.filter(w => w.total_pnl >= 10000 && w.total_pnl < 100000).length },
      { range: '100K-1M', count: wallets.filter(w => w.total_pnl >= 100000 && w.total_pnl < 1000000).length },
      { range: '> 1M', count: wallets.filter(w => w.total_pnl >= 1000000).length }
    ]

    // Corrélation Win Rate vs PnL
    const correlation = wallets.map(w => ({
      winRate: w.win_rate * 100,
      pnl: w.total_pnl,
      alphaScore: alphaCalculators.calculateAlphaScore(w)
    }))

    // Patterns détectés
    const patterns = alphaCalculators.detectPatterns(wallets)

    return {
      pnlDistribution,
      correlation,
      patterns
    }
  }, [wallets])

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          {(['overview', 'patterns', 'comparison'] as const).map((mode) => (
            <Button
              key={mode}
              variant={analysisMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAnalysisMode(mode)}
              className={analysisMode === mode ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
            >
              {mode === 'overview' && <BarChart3 className="h-4 w-4 mr-2" />}
              {mode === 'patterns' && <Target className="h-4 w-4 mr-2" />}
              {mode === 'comparison' && <PieChart className="h-4 w-4 mr-2" />}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un portefeuille..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64 bg-slate-800 border-slate-600"
          />
        </div>
      </div>

      {analysisMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution des PnL */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Distribution des PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis?.pnlDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Corrélation Win Rate vs PnL */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Win Rate vs PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysis?.correlation?.slice(0, 50)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="winRate" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {analysisMode === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patterns détectés */}
          <PatternCard
            title="🐋 Baleines"
            count={analysis?.patterns.whales.length || 0}
            description="Portefeuilles avec PnL > 1M$"
            color="from-blue-900 to-blue-700"
            wallets={analysis?.patterns.whales || []}
          />
          
          <PatternCard
            title="💎 Diamants"
            count={analysis?.patterns.diamonds.length || 0}
            description="Win Rate > 80% et 100+ tx"
            color="from-purple-900 to-purple-700"
            wallets={analysis?.patterns.diamonds || []}
          />
          
          <PatternCard
            title="🚀 Alpha Émergent"
            count={analysis?.patterns.emergingAlpha.length || 0}
            description="Nouveaux performants actifs"
            color="from-green-900 to-green-700"
            wallets={analysis?.patterns.emergingAlpha || []}
          />
          
          <PatternCard
            title="⚡ Scalpers"
            count={analysis?.patterns.scalpers.length || 0}
            description="500+ transactions rentables"
            color="from-yellow-900 to-yellow-700"
            wallets={analysis?.patterns.scalpers || []}
          />
          
          <PatternCard
            title="⚠️ Risqués"
            count={analysis?.patterns.riskyPlayers.length || 0}
            description="PnL non réalisé < -100K$"
            color="from-red-900 to-red-700"
            wallets={analysis?.patterns.riskyPlayers || []}
          />
        </div>
      )}

      {analysisMode === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liste des portefeuilles */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Portefeuilles</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {filteredWallets.map((wallet) => (
                    <div
                      key={wallet.wallet_address}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedWallet?.wallet_address === wallet.wallet_address
                          ? 'bg-purple-600/30 border border-purple-500'
                          : 'bg-slate-700/50 hover:bg-slate-700'
                      }`}
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <div className="flex justify-between items-center">
                        <code className="text-sm">{formatters.formatAddress(wallet.wallet_address)}</code>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-400">
                            {formatters.formatPnL(wallet.total_pnl)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatters.formatWinRate(wallet.win_rate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analyse détaillée */}
            {selectedWallet && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Analyse Détaillée</CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletDetailedAnalysis wallet={selectedWallet} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface PatternCardProps {
  title: string
  count: number
  description: string
  color: string
  wallets: Wallet[]
}

function PatternCard({ title, count, description, color, wallets }: PatternCardProps) {
  const topWallet = wallets[0]
  
  return (
    <Card className={`bg-gradient-to-br ${color} border-slate-600`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <Badge className="bg-white/20 text-white">
            {count}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">{description}</p>
        
        {topWallet && (
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Top Performer</div>
            <code className="text-sm text-white">{formatters.formatAddress(topWallet.wallet_address)}</code>
            <div className="text-sm font-bold text-green-400 mt-1">
              {formatters.formatPnL(topWallet.total_pnl)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface WalletDetailedAnalysisProps {
  wallet: Wallet
}

function WalletDetailedAnalysis({ wallet }: WalletDetailedAnalysisProps) {
  const alphaScore = alphaCalculators.calculateAlphaScore(wallet)
  const riskScore = alphaCalculators.calculateRiskScore(wallet)
  
  const metrics = [
    { label: 'PnL Total', value: formatters.formatPnL(wallet.total_pnl), color: wallet.total_pnl >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'PnL Réalisé', value: formatters.formatPnL(wallet.realized_pnl), color: wallet.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'PnL Non Réalisé', value: formatters.formatPnL(wallet.unrealized_pnl), color: wallet.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Win Rate', value: formatters.formatWinRate(wallet.win_rate), color: 'text-blue-400' },
    { label: 'Transactions', value: wallet.tx_count.toString(), color: 'text-gray-300' },
    { label: 'Alpha Score', value: alphaScore.toFixed(1), color: 'text-purple-400' },
    { label: 'Score de Risque', value: riskScore.toFixed(1), color: riskScore < 30 ? 'text-green-400' : riskScore < 70 ? 'text-yellow-400' : 'text-red-400' }
  ]

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 p-4 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Adresse du Portefeuille</div>
        <code className="text-white break-all">{wallet.wallet_address}</code>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-slate-900/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
            <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Dernière Activité</div>
        <div className="text-white">{formatters.timeAgo(wallet.last_active)}</div>
      </div>

      {wallet.enriched && wallet.ai_insights && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <div className="text-sm font-bold text-purple-400">Insights IA</div>
          </div>
          <div className="text-sm text-gray-300">{JSON.stringify(wallet.ai_insights)}</div>
        </div>
      )}
    </div>
  )
}
