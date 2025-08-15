import { Wallet } from './supabase'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilitaire pour combiner les classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types pour l'API
interface JobParams {
  targetCount?: number
  timeframe?: string
}

// Interface pour les patterns détectés
interface DetectedPatterns {
  whales: Wallet[]
  diamonds: Wallet[]
  scalpers: Wallet[]
  riskyPlayers: Wallet[]
  emergingAlpha: Wallet[]
}

// Utilitaires pour l'API backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = {
  // Jobs de scraping
  async startJob(params?: JobParams) {
    const response = await fetch(`${API_BASE}/start-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    })
    return response.json()
  },

  async getJobStatus(jobId: string) {
    const response = await fetch(`${API_BASE}/job-status/${jobId}`)
    return response.json()
  },

  async getJobResults(jobId: string) {
    const response = await fetch(`${API_BASE}/job-results/${jobId}`)
    return response.json()
  },

  // Workflow complet
  async startCompleteWorkflow(params?: JobParams) {
    const response = await fetch(`${API_BASE}/complete-workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    })
    return response.json()
  },

  // Enrichissement IA
  async enrichWallet(walletAddress: string) {
    const response = await fetch(`${API_BASE}/enrich-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress })
    })
    return response.json()
  },

  // Données enrichies
  async getEnrichedData() {
    const response = await fetch(`${API_BASE}/enriched-data`)
    return response.json()
  }
}

// Utilitaires de formatage
export const formatters = {
  formatPnL(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  },

  formatWinRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`
  },

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  },

  timeAgo(date: string): string {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}j`
    if (diffHours > 0) return `${diffHours}h`
    return 'Maintenant'
  }
}

// Calculateurs d'alpha et scores
export const alphaCalculators = {
  calculateAlphaScore(wallet: Wallet): number {
    const pnlWeight = 0.3
    const winRateWeight = 0.3
    const volumeWeight = 0.2
    const consistencyWeight = 0.2

    const pnlScore = Math.min(wallet.total_pnl / 1000000, 1) * 100
    const winRateScore = wallet.win_rate * 100
    const volumeScore = Math.min(wallet.tx_count / 1000, 1) * 100
    const consistencyScore = wallet.unrealized_pnl > 0 ? 80 : 40

    return (
      pnlScore * pnlWeight +
      winRateScore * winRateWeight +
      volumeScore * volumeWeight +
      consistencyScore * consistencyWeight
    )
  },

  calculateRiskScore(wallet: Wallet): number {
    const volatilityFactor = Math.abs(wallet.unrealized_pnl) / Math.max(wallet.total_pnl, 1)
    const txFrequency = wallet.tx_count / 30 // transactions par jour estimées
    
    let riskScore = 50 // baseline
    
    if (volatilityFactor > 0.5) riskScore += 30
    if (txFrequency > 50) riskScore += 20
    if (wallet.win_rate < 0.3) riskScore += 25
    
    return Math.min(riskScore, 100)
  },

  detectPatterns(wallets: Wallet[]): DetectedPatterns {
    const patterns = {
      whales: wallets.filter(w => w.total_pnl > 1000000),
      diamonds: wallets.filter(w => w.win_rate > 0.8 && w.tx_count > 100),
      scalpers: wallets.filter(w => w.tx_count > 500 && w.total_pnl > 0),
      riskyPlayers: wallets.filter(w => w.unrealized_pnl < -100000),
      emergingAlpha: wallets.filter(w => 
        w.total_pnl > 50000 && 
        w.win_rate > 0.6 && 
        new Date(w.last_active).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      )
    }
    
    return patterns
  }
}
