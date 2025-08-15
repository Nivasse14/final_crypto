'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Target,
  Activity,
  Gauge,
  AlertCircle
} from 'lucide-react'
// Import non utilisé supprimé

interface RiskMetric {
  id: string
  name: string
  value: number
  threshold: number
  status: 'safe' | 'warning' | 'danger'
  description: string
  recommendation: string
}

interface RiskScenario {
  id: string
  name: string
  probability: number
  impact: number
  riskScore: number
  description: string
  mitigation: string[]
}

interface SimpleWallet {
  id: string
  address: string
  value_usd: number
}

interface RiskProps {
  wallets: SimpleWallet[]
}

export default function RiskManagement({ wallets }: RiskProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d')

  const riskMetrics = useMemo((): RiskMetric[] => {
    const portfolioValue = wallets.reduce((sum, w) => sum + Math.abs(w.value_usd || 0), 0)
    const totalPnL = wallets.reduce((sum, w) => sum + (w.value_usd || 0), 0)
    const avgWinRate = 0.65 // Valeur fictive puisque SimpleWallet n'a pas win_rate
    
    // Calcul de la volatilité basée sur les PnL
    const portfolioVolatility = portfolioValue > 0 ? Math.abs(totalPnL / portfolioValue * 100) : 0
    
    // Métriques de risque calculées
    return [
      {
        id: 'volatility',
        name: 'Volatilité du Portfolio',
        value: portfolioVolatility,
        threshold: 15,
        status: portfolioVolatility > 20 ? 'danger' : portfolioVolatility > 15 ? 'warning' : 'safe',
        description: 'Mesure la fluctuation des prix du portfolio',
        recommendation: portfolioVolatility > 15 ? 'Diversifier les positions' : 'Niveau acceptable'
      },
      {
        id: 'winrate',
        name: 'Taux de Réussite Moyen',
        value: avgWinRate,
        threshold: 60,
        status: avgWinRate < 40 ? 'danger' : avgWinRate < 60 ? 'warning' : 'safe',
        description: 'Pourcentage moyen de trades gagnants',
        recommendation: avgWinRate < 60 ? 'Améliorer la sélection' : 'Performance solide'
      },
      {
        id: 'concentration',
        name: 'Risque de Concentration',
        value: 75,
        threshold: 60,
        status: 'warning',
        description: 'Pourcentage des actifs dans les 5 plus gros holdings',
        recommendation: 'Réduire l\'exposition aux positions dominantes'
      },
      {
        id: 'liquidity',
        name: 'Risque de Liquidité',
        value: 85,
        threshold: 70,
        status: 'safe',
        description: 'Capacité à convertir rapidement en cash',
        recommendation: 'Liquidité suffisante'
      }
    ]
  }, [wallets])

  const scenarios = useMemo((): RiskScenario[] => {
    return [
      {
        id: 'market_crash',
        name: 'Crash du Marché Crypto',
        probability: 25,
        impact: 60,
        riskScore: 15,
        description: 'Chute massive du marché crypto (-50% ou plus)',
        mitigation: [
          'Hedging via options ou futures',
          'Stop-loss automatiques',
          'Diversification vers stablecoins'
        ]
      },
      {
        id: 'whale_dump',
        name: 'Vente Massive Whale',
        probability: 40,
        impact: 30,
        riskScore: 12,
        description: 'Liquidation importante par une whale sur vos tokens',
        mitigation: [
          'Surveillance des mouvements whales',
          'Alertes de volume anormal',
          'Position sizing adaptatif'
        ]
      },
      {
        id: 'defi_exploit',
        name: 'Exploit de Protocole DeFi',
        probability: 15,
        impact: 80,
        riskScore: 12,
        description: 'Hack ou exploit sur un protocole utilisé',
        mitigation: [
          'Audit des protocoles utilisés',
          'Diversification cross-chain',
          'Insurance protocols'
        ]
      },
      {
        id: 'regulation',
        name: 'Changement Réglementaire',
        probability: 30,
        impact: 25,
        riskScore: 7.5,
        description: 'Nouvelles régulations défavorables',
        mitigation: [
          'Veille réglementaire',
          'Diversification géographique',
          'Compliance proactive'
        ]
      }
    ].sort((a, b) => b.riskScore - a.riskScore)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'danger': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'danger': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 15) return 'text-red-500'
    if (score >= 10) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            🛡️ Risk Management
          </h2>
          <p className="text-gray-400">
            Surveillance et gestion des risques en temps réel
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Activity className="h-4 w-4 mr-2" />
          Recalculer
        </Button>
      </div>

      <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="1d">24H</TabsTrigger>
          <TabsTrigger value="7d">7J</TabsTrigger>
          <TabsTrigger value="30d">30J</TabsTrigger>
          <TabsTrigger value="90d">90J</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          {/* Métriques de Risque */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {riskMetrics.map((metric: RiskMetric) => (
              <Card key={metric.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-gray-300">
                      {metric.name}
                    </CardTitle>
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.value.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-400">
                        / {metric.threshold}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {metric.description}
                    </p>
                    <Badge 
                      variant={metric.status === 'safe' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {metric.recommendation}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scénarios de Risque */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Scénarios de Risque
              </CardTitle>
              <CardDescription>
                Analyse des risques potentiels et stratégies de mitigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario: RiskScenario) => (
                  <div 
                    key={scenario.id}
                    className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">
                          {scenario.name}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {scenario.description}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getRiskColor(scenario.riskScore)} border-current`}
                      >
                        Score: {scenario.riskScore}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="text-sm text-gray-300">
                          Probabilité: {scenario.probability}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-red-400" />
                        <span className="text-sm text-gray-300">
                          Impact: {scenario.impact}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-300 mb-2">
                        Stratégies de Mitigation:
                      </h5>
                      <ul className="space-y-1">
                        {scenario.mitigation.map((strategy: string, index: number) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start">
                            <span className="text-green-400 mr-2">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Rapides */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <Gauge className="h-5 w-5 mr-2 text-blue-400" />
                Actions de Gestion des Risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alertes Stop-Loss
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Hedge Portfolio
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Rebalancer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
