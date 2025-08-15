'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Bot, Zap, TrendingUp, Settings, Play, Pause, Activity, Brain, Target, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

interface AutomatedStrategyEngineProps {
  wallets?: {
    id: string
    address: string
    value_usd: number
    [key: string]: unknown
  }[]
}

interface TradingStrategy {
  id: string
  name: string
  type: 'momentum' | 'mean_reversion' | 'arbitrage' | 'trend_following' | 'ai_ml'
  status: 'active' | 'paused' | 'stopped'
  performance: {
    total_return: number
    win_rate: number
    sharpe_ratio: number
    max_drawdown: number
    trades_count: number
  }
  config: {
    risk_limit: number
    position_size: number
    stop_loss: number
    take_profit: number
  }
  description: string
  created_at: Date
  last_trade: Date | null
}

interface StrategySignal {
  id: string
  strategy_id: string
  type: 'buy' | 'sell' | 'hold'
  token: string
  confidence: number
  entry_price: number
  target_price: number
  stop_loss: number
  timestamp: Date
  executed: boolean
  pnl?: number
}

interface AutomationRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
  priority: 'low' | 'medium' | 'high'
  description: string
}

interface PerformanceData {
  date: string
  total_pnl: number
  alpha_momentum: number
  arbitrage: number
  whale_ai: number
}

const AutomatedStrategyEngine: React.FC<AutomatedStrategyEngineProps> = ({ wallets = [] }) => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([])
  const [signals, setSignals] = useState<StrategySignal[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [isEngineRunning, setIsEngineRunning] = useState(true)

  useEffect(() => {
    initializeEngine()
    const interval = setInterval(updateStrategies, 5000) // Update every 5s
    return () => clearInterval(interval)
  }, [])

  const initializeEngine = () => {
    const strategiesData: TradingStrategy[] = [
      {
        id: '1',
        name: 'Alpha Momentum Hunter',
        type: 'momentum',
        status: 'active',
        performance: {
          total_return: 47.8,
          win_rate: 73.2,
          sharpe_ratio: 2.4,
          max_drawdown: 8.1,
          trades_count: 124
        },
        config: {
          risk_limit: 5,
          position_size: 10,
          stop_loss: 3,
          take_profit: 12
        },
        description: 'AI-powered momentum strategy targeting breakouts',
        created_at: new Date('2024-01-15'),
        last_trade: new Date()
      },
      {
        id: '2',
        name: 'DeFi Arbitrage Master',
        type: 'arbitrage',
        status: 'active',
        performance: {
          total_return: 23.4,
          win_rate: 89.1,
          sharpe_ratio: 3.2,
          max_drawdown: 2.3,
          trades_count: 567
        },
        config: {
          risk_limit: 2,
          position_size: 15,
          stop_loss: 1,
          take_profit: 3
        },
        description: 'Cross-DEX arbitrage opportunities scanner',
        created_at: new Date('2024-02-01'),
        last_trade: new Date(Date.now() - 300000)
      },
      {
        id: '3',
        name: 'Whale Following AI',
        type: 'ai_ml',
        status: 'active',
        performance: {
          total_return: 61.3,
          win_rate: 67.8,
          sharpe_ratio: 2.1,
          max_drawdown: 12.5,
          trades_count: 89
        },
        config: {
          risk_limit: 8,
          position_size: 20,
          stop_loss: 5,
          take_profit: 18
        },
        description: 'ML model tracking whale wallet movements',
        created_at: new Date('2024-01-20'),
        last_trade: new Date(Date.now() - 600000)
      },
      {
        id: '4',
        name: 'Mean Reversion Pro',
        type: 'mean_reversion',
        status: 'paused',
        performance: {
          total_return: 15.7,
          win_rate: 71.4,
          sharpe_ratio: 1.8,
          max_drawdown: 6.2,
          trades_count: 203
        },
        config: {
          risk_limit: 4,
          position_size: 8,
          stop_loss: 4,
          take_profit: 8
        },
        description: 'Statistical arbitrage on overbought/oversold conditions',
        created_at: new Date('2024-01-10'),
        last_trade: new Date(Date.now() - 3600000)
      }
    ]

    const signalsData: StrategySignal[] = [
      {
        id: '1',
        strategy_id: '1',
        type: 'buy',
        token: 'ARB',
        confidence: 87,
        entry_price: 1.23,
        target_price: 1.38,
        stop_loss: 1.19,
        timestamp: new Date(),
        executed: false
      },
      {
        id: '2',
        strategy_id: '2',
        type: 'buy',
        token: 'UNI',
        confidence: 94,
        entry_price: 7.45,
        target_price: 7.68,
        stop_loss: 7.37,
        timestamp: new Date(Date.now() - 120000),
        executed: true,
        pnl: 2.3
      },
      {
        id: '3',
        strategy_id: '3',
        type: 'sell',
        token: 'MATIC',
        confidence: 76,
        entry_price: 0.82,
        target_price: 0.76,
        stop_loss: 0.86,
        timestamp: new Date(Date.now() - 300000),
        executed: false
      }
    ]

    const rulesData: AutomationRule[] = [
      {
        id: '1',
        name: 'High Volatility Protection',
        condition: 'volatility > 50%',
        action: 'reduce_position_size_by_50%',
        enabled: true,
        priority: 'high',
        description: 'Automatically reduce positions during high volatility'
      },
      {
        id: '2',
        name: 'Whale Movement Alert',
        condition: 'whale_transfer > $10M',
        action: 'pause_momentum_strategies',
        enabled: true,
        priority: 'medium',
        description: 'Pause momentum strategies when large transfers detected'
      },
      {
        id: '3',
        name: 'Profit Taking',
        condition: 'daily_pnl > 25%',
        action: 'take_profit_50%',
        enabled: true,
        priority: 'medium',
        description: 'Automatically take profits on exceptional days'
      }
    ]

    const performance = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      total_pnl: 100 + Math.sin(i * 0.2) * 20 + Math.random() * 15,
      alpha_momentum: 100 + Math.sin(i * 0.3) * 25 + Math.random() * 10,
      arbitrage: 100 + Math.cos(i * 0.1) * 10 + Math.random() * 5,
      whale_ai: 100 + Math.sin(i * 0.4) * 30 + Math.random() * 12
    }))

    setStrategies(strategiesData)
    setSignals(signalsData)
    setAutomationRules(rulesData)
    setPerformanceData(performance)
  }

  const updateStrategies = () => {
    // Simulation de mises à jour en temps réel
    setSignals(prev => prev.map(signal => ({
      ...signal,
      confidence: Math.max(50, Math.min(99, signal.confidence + (Math.random() - 0.5) * 10))
    })))
  }

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === strategyId) {
        const newStatus = strategy.status === 'active' ? 'paused' : 'active'
        return { ...strategy, status: newStatus }
      }
      return strategy
    }))
  }

  const executeSignal = (signalId: string) => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        return { ...signal, executed: true, pnl: Math.random() * 5 - 1 }
      }
      return signal
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'stopped': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'momentum': return <Rocket className="w-4 h-4" />
      case 'arbitrage': return <Zap className="w-4 h-4" />
      case 'ai_ml': return <Brain className="w-4 h-4" />
      case 'mean_reversion': return <Target className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-2xl font-bold">Automated Strategy Engine</h2>
          <p className="text-muted-foreground">AI-powered trading automation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm">{isEngineRunning ? 'Running' : 'Stopped'}</span>
          </div>
          <Button 
            onClick={() => setIsEngineRunning(!isEngineRunning)}
            variant={isEngineRunning ? 'destructive' : 'default'}
            size="sm"
          >
            {isEngineRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isEngineRunning ? 'Pause' : 'Start'} Engine
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Strategies</p>
                <p className="text-2xl font-bold text-green-600">
                  {strategies.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Bot className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Signals</p>
                <p className="text-2xl font-bold text-blue-600">
                  {signals.filter(s => !s.executed).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-2xl font-bold text-purple-600">
                  +{strategies.reduce((sum, s) => sum + s.performance.total_return, 0).toFixed(1)}%
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
                <p className="text-sm text-muted-foreground">Automation Rules</p>
                <p className="text-2xl font-bold text-orange-600">
                  {automationRules.filter(r => r.enabled).length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strategies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="signals">Live Signals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(strategy.type)}
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(strategy.status)}>
                        {strategy.status}
                      </Badge>
                    </div>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Total Return</div>
                        <div className="text-lg font-bold text-green-600">+{strategy.performance.total_return}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                        <div className="text-lg font-bold">{strategy.performance.win_rate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                        <div className="text-lg font-bold">{strategy.performance.sharpe_ratio}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Max Drawdown</div>
                        <div className="text-lg font-bold text-red-600">-{strategy.performance.max_drawdown}%</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {strategy.performance.trades_count} trades
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStrategy(strategy.id)
                        }}
                        variant={strategy.status === 'active' ? 'destructive' : 'default'}
                      >
                        {strategy.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <div className="space-y-3">
            {signals.map((signal, index) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  signal.type === 'buy' ? 'border-l-green-500' :
                  signal.type === 'sell' ? 'border-l-red-500' : 'border-l-gray-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={signal.type === 'buy' ? 'default' : signal.type === 'sell' ? 'destructive' : 'secondary'}>
                            {signal.type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{signal.token}</span>
                          <Badge variant="outline" className="text-xs">
                            {signal.confidence}% confidence
                          </Badge>
                          {signal.executed && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Executed
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Entry: </span>
                            <span className="font-medium">${signal.entry_price}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target: </span>
                            <span className="font-medium">${signal.target_price}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stop: </span>
                            <span className="font-medium">${signal.stop_loss}</span>
                          </div>
                        </div>
                        {signal.pnl !== undefined && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">P&L: </span>
                            <span className={`text-sm font-medium ${signal.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {signal.pnl >= 0 ? '+' : ''}{signal.pnl.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-2">
                          {signal.timestamp.toLocaleTimeString()}
                        </div>
                        {!signal.executed && (
                          <Button 
                            size="sm" 
                            onClick={() => executeSignal(signal.id)}
                            className="text-xs"
                          >
                            Execute
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance Comparison</CardTitle>
              <CardDescription>Historical performance of all strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="alpha_momentum" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="arbitrage" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="whale_ai" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="total_pnl" stroke="#f59e0b" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="space-y-3">
            {automationRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.priority === 'high' ? 'destructive' : rule.priority === 'medium' ? 'default' : 'secondary'}>
                            {rule.priority}
                          </Badge>
                          <Badge variant={rule.enabled ? 'default' : 'outline'}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex gap-4 text-xs">
                          <span><strong>Condition:</strong> {rule.condition}</span>
                          <span><strong>Action:</strong> {rule.action}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setAutomationRules(prev => prev.map(r => 
                            r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                          ))
                        }}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AutomatedStrategyEngine
