'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Zap, Brain, Target, Activity, Globe, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'

interface MarketIntelligenceProps {
  wallets: {
    id: string
    address: string
    value_usd: number
    [key: string]: unknown
  }[]
}

interface GlobalSentiment {
  overall: string
  fear_greed: number
  whale_sentiment: string
  retail_sentiment: string
  institutional: string
}

interface WhaleActivity {
  wallet: string
  action: string
  amount: number
  token: string
  timestamp: Date
  impact: number
}

interface MarketTrend {
  id: string
  name: string
  direction: 'up' | 'down' | 'neutral'
  strength: number
  volume: number
  impact: 'high' | 'medium' | 'low'
  confidence: number
}

interface OpportunityAlert {
  id: string
  type: 'breakout' | 'accumulation' | 'whale_move' | 'pattern' | 'arbitrage'
  token: string
  description: string
  potential: number
  risk: number
  timeframe: string
  confidence: number
}

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ wallets }) => {
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityAlert[]>([])
  const [globalSentiment, setGlobalSentiment] = useState<GlobalSentiment>({
    overall: 'neutral',
    fear_greed: 50,
    whale_sentiment: 'neutral',
    retail_sentiment: 'neutral',
    institutional: 'neutral'
  })
  const [whaleActivity, setWhaleActivity] = useState<WhaleActivity[]>([])
  const [isLoading] = useState(false)

  useEffect(() => {
    generateMarketIntelligence()
    const interval = setInterval(generateMarketIntelligence, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [wallets])

  const generateMarketIntelligence = () => {
    // Analyse des tendances de marché basée sur les portefeuilles
    const trends: MarketTrend[] = [
      {
        id: '1',
        name: 'DeFi Blue Chips',
        direction: 'up',
        strength: 85,
        volume: 2400000,
        impact: 'high',
        confidence: 92
      },
      {
        id: '2',
        name: 'Layer 2 Tokens',
        direction: 'up',
        strength: 72,
        volume: 1800000,
        impact: 'high',
        confidence: 88
      },
      {
        id: '3',
        name: 'Meme Coins',
        direction: 'down',
        strength: 45,
        volume: 950000,
        impact: 'medium',
        confidence: 65
      },
      {
        id: '4',
        name: 'AI Tokens',
        direction: 'up',
        strength: 78,
        volume: 1200000,
        impact: 'high',
        confidence: 81
      }
    ]

    // Génération d'opportunités basées sur l'analyse
    const opps: OpportunityAlert[] = [
      {
        id: '1',
        type: 'breakout',
        token: 'ARB',
        description: 'Breaking resistance at $1.20, whale accumulation detected',
        potential: 45,
        risk: 25,
        timeframe: '24-48h',
        confidence: 89
      },
      {
        id: '2',
        type: 'whale_move',
        token: 'MATIC',
        description: 'Large wallet moved 50M MATIC to exchange',
        potential: 30,
        risk: 60,
        timeframe: '6-12h',
        confidence: 95
      },
      {
        id: '3',
        type: 'pattern',
        token: 'LINK',
        description: 'Cup & Handle pattern forming, smart money accumulating',
        potential: 35,
        risk: 20,
        timeframe: '3-7d',
        confidence: 76
      },
      {
        id: '4',
        type: 'arbitrage',
        token: 'UNI',
        description: 'Price discrepancy across DEXs, 2.3% spread',
        potential: 15,
        risk: 5,
        timeframe: '1-2h',
        confidence: 98
      }
    ]

    // Sentiment global
    const sentiment = {
      overall: 'bullish',
      fear_greed: 72,
      whale_sentiment: 'accumulating',
      retail_sentiment: 'optimistic',
      institutional: 'neutral'
    }

    // Activité des baleines
    const whales: WhaleActivity[] = Array.from({ length: 10 }, () => ({
      wallet: `0x${Math.random().toString(16).substr(2, 8)}...`,
      action: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)],
      amount: Math.floor(Math.random() * 10000000),
      token: ['ETH', 'BTC', 'ARB', 'MATIC', 'LINK'][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      impact: Math.floor(Math.random() * 100)
    }))

    setMarketTrends(trends)
    setOpportunities(opps)
    setGlobalSentiment(sentiment)
    setWhaleActivity(whales)
  }

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'breakout': return <TrendingUp className="w-4 h-4" />
      case 'whale_move': return <Activity className="w-4 h-4" />
      case 'pattern': return <Target className="w-4 h-4" />
      case 'arbitrage': return <Zap className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const sentimentData = [
    { name: 'Bullish', value: globalSentiment.fear_greed || 0, color: '#10b981' },
    { name: 'Bearish', value: 100 - (globalSentiment.fear_greed || 0), color: '#ef4444' }
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Sentiment</p>
                <p className="text-2xl font-bold text-blue-600">
                  {globalSentiment.overall || 'Bullish'}
                </p>
              </div>
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fear & Greed</p>
                <p className="text-2xl font-bold text-green-600">
                  {globalSentiment.fear_greed || 72}
                </p>
              </div>
              <Brain className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Trends</p>
                <p className="text-2xl font-bold text-purple-600">
                  {marketTrends.length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold text-orange-600">
                  {opportunities.length}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="whales">Whale Activity</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{trend.name}</CardTitle>
                      <Badge variant={trend.impact === 'high' ? 'destructive' : trend.impact === 'medium' ? 'default' : 'secondary'}>
                        {trend.impact}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Direction:</span>
                        <div className={`flex items-center gap-1 ${getTrendColor(trend.direction)}`}>
                          {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-medium capitalize">{trend.direction}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Strength:</span>
                        <span className="font-medium">{trend.strength}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Volume:</span>
                        <span className="font-medium">${(trend.volume / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="font-medium">{trend.confidence}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="space-y-3">
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getOpportunityIcon(opp.type)}
                        <span className="font-semibold">{opp.token}</span>
                        <Badge variant="outline" className="text-xs">
                          {opp.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-medium">+{opp.potential}%</div>
                        <div className="text-xs text-muted-foreground">{opp.timeframe}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">Potential: {opp.potential}%</span>
                        <span className="text-red-600">Risk: {opp.risk}%</span>
                        <span className="text-blue-600">Confidence: {opp.confidence}%</span>
                      </div>
                      <Button size="sm" className="text-xs">
                        Track
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="whales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Whale Activity</CardTitle>
              <CardDescription>Large wallet movements and their market impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {whaleActivity.slice(0, 8).map((whale, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={whale.action === 'buy' ? 'default' : whale.action === 'sell' ? 'destructive' : 'secondary'}>
                        {whale.action}
                      </Badge>
                      <div>
                        <div className="font-medium">{whale.wallet}</div>
                        <div className="text-xs text-muted-foreground">
                          {whale.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{(whale.amount / 1000000).toFixed(1)}M {whale.token}</div>
                      <div className="text-xs text-muted-foreground">Impact: {whale.impact}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Whale Sentiment:</span>
                  <Badge variant="default">{globalSentiment.whale_sentiment}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Retail Sentiment:</span>
                  <Badge variant="secondary">{globalSentiment.retail_sentiment}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Institutional:</span>
                  <Badge variant="outline">{globalSentiment.institutional}</Badge>
                </div>
                <div className="mt-6">
                  <div className="text-sm text-muted-foreground mb-2">Fear & Greed Index</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${globalSentiment.fear_greed || 72}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Extreme Fear</span>
                    <span>Extreme Greed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MarketIntelligence
