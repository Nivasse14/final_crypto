'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Crown, Star, Trophy, Target, Zap, Users, Brain, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

interface ExecutiveDashboardProps {
  wallets: {
    id: string
    address: string
    value_usd: number
    [key: string]: unknown
  }[]
}

interface EliteMetric {
  id: string
  name: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
  description: string
}

interface AlphaOpportunity {
  id: string
  title: string
  type: 'exclusive' | 'whale_move' | 'alpha_leak' | 'insider_signal'
  confidence: number
  potential_return: number
  time_sensitivity: 'immediate' | 'short' | 'medium'
  description: string
  requirements: string[]
}

interface EliteStrategy {
  id: string
  name: string
  tier: 'legendary' | 'elite' | 'alpha'
  roi: number
  risk_score: number
  exclusivity: string
  description: string
  unlock_requirements: string[]
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ wallets }) => {
  const [eliteMetrics, setEliteMetrics] = useState<EliteMetric[]>([])
  const [alphaOpportunities, setAlphaOpportunities] = useState<AlphaOpportunity[]>([])
  const [eliteStrategies, setEliteStrategies] = useState<EliteStrategy[]>([])
  const [wealth_tier, setWealthTier] = useState<string>('emerging_alpha')
  const [exclusivity_score, setExclusivityScore] = useState<number>(0)

  useEffect(() => {
    const generateEliteInsights = () => {
      const metrics: EliteMetric[] = [
      {
        id: '1',
        name: 'Alpha Generation',
        value: '+147.3%',
        change: 23.7,
        icon: <Crown className="w-6 h-6" />,
        color: 'from-yellow-400 to-yellow-600',
        description: 'Exclusive alpha beyond market returns'
      },
      {
        id: '2',
        name: 'Whale Influence',
        value: '8.7/10',
        change: 12.3,
        icon: <Star className="w-6 h-6" />,
        color: 'from-purple-400 to-purple-600',
        description: 'Market influence and network effect'
      },
      {
        id: '3',
        name: 'Elite Network',
        value: '2,847',
        change: 156,
        icon: <Users className="w-6 h-6" />,
        color: 'from-blue-400 to-blue-600',
        description: 'High-net-worth connections'
      },
      {
        id: '4',
        name: 'Insider Score',
        value: '94.2%',
        change: 8.9,
        icon: <Brain className="w-6 h-6" />,
        color: 'from-green-400 to-green-600',
        description: 'Access to insider information'
      },
      {
        id: '5',
        name: 'Wealth Velocity',
        value: '$12.7M/mo',
        change: 67.8,
        icon: <Zap className="w-6 h-6" />,
        color: 'from-red-400 to-red-600',
        description: 'Capital deployment speed'
      },
      {
        id: '6',
        name: 'Market Domination',
        value: '0.003%',
        change: 245.6,
        icon: <Trophy className="w-6 h-6" />,
        color: 'from-orange-400 to-orange-600',
        description: 'Global wealth percentile'
      }
    ]

    const opportunities: AlphaOpportunity[] = [
      {
        id: '1',
        title: 'Pre-IPO Token Allocation',
        type: 'exclusive',
        confidence: 97,
        potential_return: 2400,
        time_sensitivity: 'immediate',
        description: 'Exclusive access to Layer-2 protocol token before public announcement',
        requirements: ['$1M+ minimum', 'KYC verification', 'Signed NDA']
      },
      {
        id: '2',
        title: 'Whale Accumulation Signal',
        type: 'whale_move',
        confidence: 89,
        potential_return: 180,
        time_sensitivity: 'short',
        description: 'Top 5 whale wallets accumulating specific DeFi token',
        requirements: ['Elite tier membership', 'Quick execution capability']
      },
      {
        id: '3',
        title: 'Protocol Insider Information',
        type: 'alpha_leak',
        confidence: 94,
        potential_return: 420,
        time_sensitivity: 'immediate',
        description: 'Major DEX planning surprise token burn announcement',
        requirements: ['Verified trader status', 'High-frequency trading setup']
      },
      {
        id: '4',
        title: 'Institutional Flow Reversal',
        type: 'insider_signal',
        confidence: 76,
        potential_return: 67,
        time_sensitivity: 'medium',
        description: 'BlackRock preparing major crypto allocation reversal',
        requirements: ['Professional network access', 'Institutional grade tools']
      }
    ]

    const strategies: EliteStrategy[] = [
      {
        id: '1',
        name: 'Godmode Alpha Strategy',
        tier: 'legendary',
        roi: 2847,
        risk_score: 15,
        exclusivity: 'Top 50 traders globally',
        description: 'Ultra-exclusive strategy combining insider flows, whale tracking, and AI predictions',
        unlock_requirements: ['$50M+ portfolio', '10+ years experience', 'Network verification']
      },
      {
        id: '2',
        name: 'Whale Shadow Protocol',
        tier: 'elite',
        roi: 847,
        risk_score: 25,
        exclusivity: 'Top 500 traders',
        description: 'Mirror and amplify whale movements with predictive algorithms',
        unlock_requirements: ['$10M+ portfolio', 'Elite tier status', 'Proven track record']
      },
      {
        id: '3',
        name: 'Alpha Genesis Engine',
        tier: 'alpha',
        roi: 347,
        risk_score: 35,
        exclusivity: 'Top 2000 traders',
        description: 'Generate alpha through exclusive data feeds and insider networks',
        unlock_requirements: ['$1M+ portfolio', 'Alpha tier status', 'Technical expertise']
      }
    ]

    // Calcul du tier de richesse
    const totalValue = wallets.reduce((sum, w) => sum + w.value_usd, 0)
    let tier = 'emerging_alpha'
    if (totalValue > 50000000) tier = 'godmode'
    else if (totalValue > 10000000) tier = 'legendary'
    else if (totalValue > 1000000) tier = 'elite'
    else if (totalValue > 100000) tier = 'alpha'

    // Score d'exclusivité
    const exclusivity = Math.min(100, (totalValue / 1000000) * 5 + Math.random() * 20)

    setEliteMetrics(metrics)
    setAlphaOpportunities(opportunities)
    setEliteStrategies(strategies)
    setWealthTier(tier)
    setExclusivityScore(exclusivity)
    }

    generateEliteInsights()
  }, [wallets])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'godmode': return 'from-yellow-400 via-yellow-500 to-yellow-600'
      case 'legendary': return 'from-purple-400 via-purple-500 to-purple-600'
      case 'elite': return 'from-blue-400 via-blue-500 to-blue-600'
      case 'alpha': return 'from-green-400 via-green-500 to-green-600'
      default: return 'from-gray-400 via-gray-500 to-gray-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'godmode': return <Crown className="w-8 h-8" />
      case 'legendary': return <Star className="w-8 h-8" />
      case 'elite': return <Trophy className="w-8 h-8" />
      case 'alpha': return <Target className="w-8 h-8" />
      default: return <Activity className="w-8 h-8" />
    }
  }

  const getOpportunityColor = (type: string) => {
    switch (type) {
      case 'exclusive': return 'border-yellow-500 bg-yellow-500/10'
      case 'whale_move': return 'border-purple-500 bg-purple-500/10'
      case 'alpha_leak': return 'border-red-500 bg-red-500/10'
      case 'insider_signal': return 'border-blue-500 bg-blue-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-8">
      {/* Elite Status Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className={`bg-gradient-to-r ${getTierColor(wealth_tier)} p-1`}>
          <div className="bg-black/80 backdrop-blur-xl rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-full">
                  {getTierIcon(wealth_tier)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white capitalize">
                    {wealth_tier.replace('_', ' ')} Trader
                  </h1>
                  <p className="text-white/80">Exclusivity Score: {exclusivity_score.toFixed(1)}/100</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  Top 0.00{Math.max(1, Math.floor(100 - exclusivity_score))}%
                </div>
                <div className="text-white/80">Global Wealth Rank</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Elite Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eliteMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${metric.color}`}>
                    {metric.icon}
                  </div>
                  <Badge className={`bg-gradient-to-r ${metric.change >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white">{metric.name}</h3>
                  <div className="text-3xl font-bold text-white">{metric.value}</div>
                  <p className="text-sm text-gray-400">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alpha Opportunities */}
      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span>Exclusive Alpha Opportunities</span>
            <Badge className="bg-yellow-500 text-black">PREMIUM</Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Ultra-exclusive opportunities for elite traders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alphaOpportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${getOpportunityColor(opportunity.type)} backdrop-blur-sm`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-white text-lg">{opportunity.title}</h4>
                  <p className="text-gray-300 text-sm">{opportunity.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    +{opportunity.potential_return}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {opportunity.confidence}% confidence
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="capitalize text-white border-white/30">
                  {opportunity.type.replace('_', ' ')}
                </Badge>
                <Badge variant={opportunity.time_sensitivity === 'immediate' ? 'destructive' : 'secondary'}>
                  {opportunity.time_sensitivity}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-400">Requirements:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {opportunity.requirements.map((req, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Target className="w-3 h-3" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                      style={{ width: `${opportunity.confidence}%` }}
                    />
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700"
                >
                  Access Alpha
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Elite Strategies */}
      <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Brain className="w-6 h-6 text-purple-400" />
            <span>Elite Strategy Vault</span>
            <Badge className="bg-purple-500 text-white">EXCLUSIVE</Badge>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Legendary strategies for the ultra-wealthy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eliteStrategies.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`p-6 rounded-lg bg-gradient-to-br ${getTierColor(strategy.tier)} bg-opacity-20 border border-white/20 hover:border-white/40 transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`bg-gradient-to-r ${getTierColor(strategy.tier)} text-white capitalize`}>
                    {strategy.tier}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">+{strategy.roi}%</div>
                    <div className="text-xs text-gray-400">Expected ROI</div>
                  </div>
                </div>

                <h4 className="font-bold text-white text-lg mb-2">{strategy.name}</h4>
                <p className="text-gray-300 text-sm mb-4">{strategy.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Risk Score:</span>
                    <span className="text-white">{strategy.risk_score}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Exclusivity:</span>
                    <span className="text-white">{strategy.exclusivity}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-xs text-gray-400">Unlock Requirements:</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {strategy.unlock_requirements.slice(0, 2).map((req, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-white/10 to-white/20 text-white border border-white/30 hover:from-white/20 hover:to-white/30"
                  size="sm"
                >
                  Unlock Strategy
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExecutiveDashboard
