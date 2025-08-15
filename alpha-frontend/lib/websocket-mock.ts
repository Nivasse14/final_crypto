// Mock WebSocket hooks pour le développement
import { useState, useEffect } from 'react'

interface WebSocketMessage {
  type: 'wallet_update' | 'market_data' | 'trading_signal' | 'risk_alert' | 'system_status'
  data: Record<string, unknown>
  timestamp: number
}

interface UseWebSocketReturn {
  isConnected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: Record<string, unknown>) => void
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

interface WalletUpdate {
  id: string
  address: string
  value_usd: number
  timestamp: number
}

interface MarketDataPoint {
  symbol: string
  price: number
  change_24h: number
  volume: number
  timestamp: number
}

interface TradingSignal {
  id: string
  type: 'buy' | 'sell' | 'hold'
  symbol: string
  confidence: number
  timestamp: number
  status: 'active' | 'executed' | 'expired'
}

interface RiskAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
}

// Mock implementation for development
export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  
  useEffect(() => {
    // Simulate connection
    setTimeout(() => setIsConnected(true), 1000)
    
    // Generate mock messages
    const interval = setInterval(() => {
      const mockMessage: WebSocketMessage = {
        type: 'market_data',
        data: {
          symbol: 'ETH',
          price: 2000 + Math.random() * 100,
          change_24h: Math.random() * 10 - 5,
          volume: 1000000 + Math.random() * 500000,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }
      setLastMessage(mockMessage)
    }, 3000)

    return () => clearInterval(interval)
  }, [url])

  const sendMessage = (message: Record<string, unknown>) => {
    console.log('Mock WebSocket message sent:', message)
  }

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connectionStatus: isConnected ? 'connected' : 'connecting'
  }
}

export const useWalletUpdates = () => {
  const { isConnected } = useWebSocket('mock://localhost')
  const [walletUpdates] = useState<WalletUpdate[]>([
    {
      id: '1',
      address: '0x123...abc',
      value_usd: 50000 + Math.random() * 10000,
      timestamp: Date.now()
    }
  ])

  return {
    walletUpdates,
    isConnected,
    connectionStatus: isConnected ? 'connected' : 'connecting' as const
  }
}

export const useMarketData = () => {
  const { isConnected } = useWebSocket('mock://localhost')
  const [priceUpdates] = useState<MarketDataPoint[]>([
    {
      symbol: 'ETH',
      price: 2000 + Math.random() * 100,
      change_24h: Math.random() * 10 - 5,
      volume: 1000000,
      timestamp: Date.now()
    }
  ])

  return {
    marketData: {},
    priceUpdates,
    isConnected,
    subscribeToSymbol: () => {},
    unsubscribeFromSymbol: () => {}
  }
}

export const useTradingSignals = () => {
  const { isConnected } = useWebSocket('mock://localhost')
  const [activeSignals] = useState<TradingSignal[]>([
    {
      id: '1',
      type: 'buy',
      symbol: 'ARB',
      confidence: 85,
      timestamp: Date.now(),
      status: 'active'
    }
  ])

  return {
    signals: [],
    activeSignals,
    isConnected,
    executeSignal: () => {},
    dismissSignal: () => {}
  }
}

export const useRiskAlerts = () => {
  const { isConnected } = useWebSocket('mock://localhost')
  const [criticalAlerts] = useState<RiskAlert[]>([
    {
      id: '1',
      type: 'volatility',
      severity: 'high',
      message: 'High volatility detected in portfolio',
      timestamp: Date.now()
    }
  ])

  return {
    alerts: [],
    criticalAlerts,
    isConnected
  }
}
