'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useWalletUpdates, useMarketData, useTradingSignals, useRiskAlerts } from '../lib/websocket-mock'
import { Activity, Wifi, WifiOff, TrendingUp, AlertTriangle, Bot, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

const RealTimeStatus: React.FC = () => {
  const { walletUpdates, isConnected: walletsConnected } = useWalletUpdates()
  const { priceUpdates, isConnected: marketConnected } = useMarketData()
  const { activeSignals, isConnected: signalsConnected } = useTradingSignals()
  const { criticalAlerts, isConnected: alertsConnected } = useRiskAlerts()

  const isFullyConnected = walletsConnected && marketConnected && signalsConnected && alertsConnected

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Status de connexion principal */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-2"
      >
        <Card className={`bg-white/10 backdrop-blur-md border ${isFullyConnected ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              {isFullyConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm font-medium">
                {isFullyConnected ? 'Connected' : 'Disconnected'}
              </span>
              <div className={`w-2 h-2 rounded-full ${isFullyConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alertes critiques */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-red-500/10 backdrop-blur-md border border-red-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <CardTitle className="text-sm">Critical Alerts</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {criticalAlerts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {criticalAlerts.slice(0, 2).map((alert, index) => (
                  <div key={index} className="text-xs text-red-300 truncate">
                    {alert.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Signaux actifs */}
      {activeSignals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-blue-500/10 backdrop-blur-md border border-blue-500/50">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <CardTitle className="text-sm">Active Signals</CardTitle>
                <Badge variant="default" className="text-xs">
                  {activeSignals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {activeSignals.slice(0, 2).map((signal, index) => (
                  <div key={index} className="text-xs text-blue-300 truncate">
                    {signal.type.toUpperCase()} {signal.symbol} ({signal.confidence}%)
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mises à jour récentes */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <CardTitle className="text-sm">Live Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {/* Mises à jour de portefeuilles */}
            {walletUpdates.length > 0 && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-300">
                  Wallet: ${walletUpdates[0].value_usd?.toFixed(2)}
                </span>
              </div>
            )}

            {/* Mises à jour de prix */}
            {priceUpdates.length > 0 && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-300">
                  {priceUpdates[0].symbol}: ${priceUpdates[0].price?.toFixed(4)}
                </span>
              </div>
            )}

            {/* Indicateur de fréquence de mise à jour */}
            <div className="text-xs text-gray-400 mt-2">
              Last update: {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mini statistiques */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="text-green-400 font-medium">{walletUpdates.length}</div>
                <div className="text-gray-400">Wallets</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-medium">{priceUpdates.length}</div>
                <div className="text-gray-400">Prices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default RealTimeStatus
