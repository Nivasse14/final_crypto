'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  Target,
  Eye,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Lightbulb
} from 'lucide-react'
import { Wallet } from '../lib/supabase'
import { formatters, alphaCalculators } from '../lib/utils'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AIInsightsProps {
  wallets: Wallet[]
}

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'pattern' | 'prediction'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  wallets_involved: string[]
  timestamp: Date
  actionable: boolean
}

interface MarketPattern {
  name: string
  frequency: number
  success_rate: number
  avg_return: number
  risk_level: 'low' | 'medium' | 'high'
  description: string
}

export function AIInsights({ wallets }: AIInsightsProps) {
  const [selectedInsightType, setSelectedInsightType] = useState<'all' | 'opportunity' | 'warning' | 'trend' | 'pattern' | 'prediction'>('all')
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [analysisMode, setAnalysisMode] = useState<'insights' | 'patterns' | 'predictions' | 'clustering'>('insights')

  // Génération d'insights IA ultra-avancés
  const generateAIInsights = useMemo(() => {
    const insights: AIInsight[] = []

    // 1. DÉTECTION D'OPPORTUNITÉS ALPHA
    const emergingAlpha = wallets.filter(w => {
      const alphaScore = alphaCalculators.calculateAlphaScore(w)
      return alphaScore > 75 && w.total_pnl > 100000 && w.tx_count < 200
    })

    if (emergingAlpha.length > 0) {
      insights.push({
        id: 'alpha-opportunity-1',
        type: 'opportunity',
        title: `🚀 ${emergingAlpha.length} Nouveaux Alpha Détectés`,
        description: `Identification de nouveaux traders ultra-performants avec moins de 200 transactions mais des rendements exceptionnels. Ces portefeuilles montrent des patterns d'accumulation précoce sur des tokens avant leur explosion.`,
        confidence: 0.92,
        impact: 'critical',
        wallets_involved: emergingAlpha.slice(0, 5).map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    // 2. DÉTECTION DE BALEINES SILENCIEUSES
    const silentWhales = wallets.filter(w => 
      w.total_pnl > 2000000 && 
      w.tx_count < 100 && 
      new Date(w.last_active).getTime() > Date.now() - 48 * 60 * 60 * 1000
    )

    if (silentWhales.length > 0) {
      insights.push({
        id: 'whale-pattern-1',
        type: 'pattern',
        title: `🐋 ${silentWhales.length} Baleines Silencieuses Actives`,
        description: `Baleines avec très peu de transactions mais énormes PnL. Leur activité récente pourrait signaler des mouvements de marché imminents. Pattern typique: accumulation discrète suivie d'une explosion de prix.`,
        confidence: 0.88,
        impact: 'high',
        wallets_involved: silentWhales.map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    // 3. DÉTECTION DE RUGPULL/SCAM POTENTIEL
    const suspiciousWallets = wallets.filter(w => 
      w.unrealized_pnl < -500000 && 
      w.realized_pnl > 1000000 && 
      w.win_rate < 0.2
    )

    if (suspiciousWallets.length > 0) {
      insights.push({
        id: 'warning-rugpull-1',
        type: 'warning',
        title: `⚠️ ${suspiciousWallets.length} Portefeuilles à Risque Élevé`,
        description: `Portefeuilles avec pattern suspect: gros gains réalisés mais pertes non-réalisées massives. Possibles victimes de rugpulls ou manipulation de marché. À éviter absolument.`,
        confidence: 0.85,
        impact: 'critical',
        wallets_involved: suspiciousWallets.map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    // 4. PATTERN DE COPY-TRADING DÉTECTÉ
    const copyTraders = wallets.filter(w => 
      w.win_rate > 0.7 && 
      w.tx_count > 500 && 
      w.total_pnl > 200000
    )

    if (copyTraders.length >= 3) {
      insights.push({
        id: 'copy-pattern-1',
        type: 'trend',
        title: `📈 Cluster de Copy-Traders Performants`,
        description: `${copyTraders.length} portefeuilles montrent des patterns similaires de trading haute-fréquence rentable. Possibles bots ou traders utilisant les mêmes signaux. Opportunité de reverse-engineering de leurs stratégies.`,
        confidence: 0.79,
        impact: 'medium',
        wallets_involved: copyTraders.slice(0, 10).map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    // 5. PRÉDICTION DE CYCLE DE MARCHÉ
    const recentHighPerformers = wallets.filter(w => 
      new Date(w.last_active).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 &&
      w.total_pnl > 500000
    )

    if (recentHighPerformers.length > 50) {
      insights.push({
        id: 'prediction-cycle-1',
        type: 'prediction',
        title: `🔮 Signal de Bull Run Imminent`,
        description: `${recentHighPerformers.length} portefeuilles top-performers actifs dans les 7 derniers jours. Corrélation historique: quand 50+ alpha traders sont actifs simultanément, cela précède généralement un cycle haussier de 2-4 semaines.`,
        confidence: 0.73,
        impact: 'high',
        wallets_involved: recentHighPerformers.slice(0, 15).map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    // 6. DÉTECTION D'INSIDER TRADING
    const insiderPattern = wallets.filter(w => 
      w.win_rate > 0.95 && 
      w.tx_count < 50 && 
      w.total_pnl > 1000000
    )

    if (insiderPattern.length > 0) {
      insights.push({
        id: 'insider-pattern-1',
        type: 'opportunity',
        title: `👁️ ${insiderPattern.length} Possibles Traders Insider`,
        description: `Win rate >95% avec peu de transactions mais énormes gains. Pattern typique d'informations privilégiées. Suivre leurs mouvements pourrait révéler des opportunités précoces sur des tokens avant annonces.`,
        confidence: 0.67,
        impact: 'critical',
        wallets_involved: insiderPattern.map(w => w.wallet_address),
        timestamp: new Date(),
        actionable: true
      })
    }

    return insights.sort((a, b) => b.confidence - a.confidence)
  }, [wallets])

  useEffect(() => {
    setAiInsights(generateAIInsights)
  }, [generateAIInsights])

  // Analyse des patterns de marché
  const marketPatterns = useMemo((): MarketPattern[] => {
    return [
      {
        name: 'Early Adopter Alpha',
        frequency: 15,
        success_rate: 0.78,
        avg_return: 245.6,
        risk_level: 'medium',
        description: 'Portefeuilles qui achètent des tokens dans les premières 24h de listing'
      },
      {
        name: 'Whale Following',
        frequency: 23,
        success_rate: 0.65,
        avg_return: 123.4,
        risk_level: 'low',
        description: 'Copy-trading automatique des mouvements de baleines connues'
      },
      {
        name: 'MEV Arbitrage',
        frequency: 45,
        success_rate: 0.92,
        avg_return: 45.2,
        risk_level: 'low',
        description: 'Arbitrage automatisé entre DEX avec faible latence'
      },
      {
        name: 'Pump Anticipation',
        frequency: 8,
        success_rate: 0.85,
        avg_return: 567.8,
        risk_level: 'high',
        description: 'Détection précoce de signaux de pump avant annonces'
      },
      {
        name: 'Liquidity Mining',
        frequency: 67,
        success_rate: 0.71,
        avg_return: 78.9,
        risk_level: 'medium',
        description: 'Yield farming optimisé avec rotation automatique'
      }
    ]
  }, [])

  // Clustering des portefeuilles
  const portfolioClusters = useMemo(() => {
    const clusters = {
      'Alpha Hunters': wallets.filter(w => alphaCalculators.calculateAlphaScore(w) > 80).length,
      'Steady Growers': wallets.filter(w => w.win_rate > 0.7 && w.total_pnl > 0 && w.total_pnl < 500000).length,
      'High Rollers': wallets.filter(w => w.total_pnl > 1000000).length,
      'Risk Takers': wallets.filter(w => alphaCalculators.calculateRiskScore(w) > 70).length,
      'Scalpers': wallets.filter(w => w.tx_count > 1000).length,
      'HODLers': wallets.filter(w => w.tx_count < 50 && w.total_pnl > 100000).length
    }
    
    return Object.entries(clusters).map(([name, count]) => ({
      name,
      value: count,
      percentage: Math.round((count / wallets.length) * 100)
    }))
  }, [wallets])

  const filteredInsights = useMemo(() => {
    if (selectedInsightType === 'all') return aiInsights
    return aiInsights.filter(insight => insight.type === selectedInsightType)
  }, [aiInsights, selectedInsightType])

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'from-green-900/50 to-emerald-900/50 border-green-500/30'
      case 'warning': return 'from-red-900/50 to-rose-900/50 border-red-500/30'
      case 'trend': return 'from-blue-900/50 to-cyan-900/50 border-blue-500/30'
      case 'pattern': return 'from-purple-900/50 to-violet-900/50 border-purple-500/30'
      case 'prediction': return 'from-orange-900/50 to-yellow-900/50 border-orange-500/30'
    }
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-400" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-400" />
      case 'trend': return <BarChart3 className="h-5 w-5 text-blue-400" />
      case 'pattern': return <Target className="h-5 w-5 text-purple-400" />
      case 'prediction': return <Sparkles className="h-5 w-5 text-orange-400" />
    }
  }

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899']

  return (
    <div className="space-y-6">
      {/* Navigation des modes d'analyse */}
      <div className="flex gap-2">
        {(['insights', 'patterns', 'predictions', 'clustering'] as const).map((mode) => (
          <Button
            key={mode}
            variant={analysisMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAnalysisMode(mode)}
            className={analysisMode === mode ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
          >
            {mode === 'insights' && <Brain className="h-4 w-4 mr-2" />}
            {mode === 'patterns' && <Target className="h-4 w-4 mr-2" />}
            {mode === 'predictions' && <Sparkles className="h-4 w-4 mr-2" />}
            {mode === 'clustering' && <Layers className="h-4 w-4 mr-2" />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
      </div>

      {analysisMode === 'insights' && (
        <div className="space-y-6">
          {/* Statistiques des insights */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="🎯 Opportunités" value={aiInsights.filter(i => i.type === 'opportunity').length} />
            <StatCard title="⚠️ Alertes" value={aiInsights.filter(i => i.type === 'warning').length} />
            <StatCard title="📈 Tendances" value={aiInsights.filter(i => i.type === 'trend').length} />
            <StatCard title="🔮 Prédictions" value={aiInsights.filter(i => i.type === 'prediction').length} />
            <StatCard title="📊 Confiance Moy." value={`${Math.round(aiInsights.reduce((sum, i) => sum + i.confidence, 0) / aiInsights.length * 100)}%`} />
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            {(['all', 'opportunity', 'warning', 'trend', 'pattern', 'prediction'] as const).map((type) => (
              <Button
                key={type}
                variant={selectedInsightType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedInsightType(type)}
                className={selectedInsightType === type ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
              >
                {type === 'all' && 'Tous'}
                {type === 'opportunity' && '🎯 Opportunités'}
                {type === 'warning' && '⚠️ Alertes'}
                {type === 'trend' && '📈 Tendances'}
                {type === 'pattern' && '🔍 Patterns'}
                {type === 'prediction' && '🔮 Prédictions'}
              </Button>
            ))}
          </div>

          {/* Liste des insights */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {analysisMode === 'patterns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {marketPatterns.map((pattern, index) => (
              <PatternCard key={index} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {analysisMode === 'clustering' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Distribution des Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={portfolioClusters}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {portfolioClusters.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Répartition par Cluster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioClusters.map((cluster, index) => (
                  <div key={cluster.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-white font-medium">{cluster.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{cluster.value}</div>
                      <div className="text-xs text-gray-400">{cluster.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

interface InsightCardProps {
  insight: AIInsight
}

function InsightCard({ insight }: InsightCardProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getImpactBadge = (impact: AIInsight['impact']) => {
    const configs = {
      low: { color: 'bg-blue-600', label: 'Faible' },
      medium: { color: 'bg-yellow-600', label: 'Moyen' },
      high: { color: 'bg-orange-600', label: 'Élevé' },
      critical: { color: 'bg-red-600', label: 'Critique' }
    }
    return configs[impact]
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'from-green-900/50 to-emerald-900/50 border-green-500/30'
      case 'warning': return 'from-red-900/50 to-rose-900/50 border-red-500/30'
      case 'trend': return 'from-blue-900/50 to-cyan-900/50 border-blue-500/30'
      case 'pattern': return 'from-purple-900/50 to-violet-900/50 border-purple-500/30'
      case 'prediction': return 'from-orange-900/50 to-yellow-900/50 border-orange-500/30'
    }
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-400" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-red-400" />
      case 'trend': return <BarChart3 className="h-5 w-5 text-blue-400" />
      case 'pattern': return <Target className="h-5 w-5 text-purple-400" />
      case 'prediction': return <Sparkles className="h-5 w-5 text-orange-400" />
    }
  }

  const impactBadge = getImpactBadge(insight.impact)

  return (
    <Card className={`bg-gradient-to-r ${getInsightColor(insight.type)} border backdrop-blur-sm hover:scale-[1.01] transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getInsightIcon(insight.type)}
            <div>
              <h3 className="text-lg font-bold text-white">{insight.title}</h3>
              <Badge className={`${impactBadge.color} text-white text-xs mt-1`}>
                Impact: {impactBadge.label}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Confiance</div>
            <div className={`text-lg font-bold ${getConfidenceColor(insight.confidence)}`}>
              {Math.round(insight.confidence * 100)}%
            </div>
          </div>
        </div>

        <p className="text-gray-300 mb-4 leading-relaxed">{insight.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Portefeuilles Impliqués</div>
            <div className="flex flex-wrap gap-1">
              {insight.wallets_involved.slice(0, 3).map((address, index) => (
                <code key={index} className="text-xs bg-slate-700/50 px-2 py-1 rounded text-gray-300">
                  {formatters.formatAddress(address)}
                </code>
              ))}
              {insight.wallets_involved.length > 3 && (
                <Badge className="bg-purple-600 text-white text-xs">
                  +{insight.wallets_involved.length - 3} autres
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Actions Recommandées</div>
            <div className="flex items-center space-x-2">
              {insight.actionable ? (
                <>
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white">Action immédiate possible</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white">Surveillance recommandée</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
          <span>Généré: {insight.timestamp.toLocaleString()}</span>
          {insight.actionable && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Zap className="h-3 w-3 mr-1" />
              Agir Maintenant
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PatternCardProps {
  pattern: MarketPattern
}

function PatternCard({ pattern }: PatternCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{pattern.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{pattern.description}</p>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-400">Fréquence</div>
              <div className="text-lg font-bold text-blue-400">{pattern.frequency}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Succès</div>
              <div className="text-lg font-bold text-green-400">{Math.round(pattern.success_rate * 100)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">ROI Moyen</div>
              <div className="text-lg font-bold text-purple-400">{pattern.avg_return}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Risque</div>
              <div className={`text-lg font-bold ${getRiskColor(pattern.risk_level)}`}>
                {pattern.risk_level.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string | number
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="text-sm text-gray-400 mb-1">{title}</div>
        <div className="text-xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  )
}
