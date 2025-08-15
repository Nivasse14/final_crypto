import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
export interface Wallet {
  id?: number
  wallet_address: string
  total_pnl: number
  realized_pnl: number
  unrealized_pnl: number
  tx_count: number
  win_rate: number
  last_active: string
  scraped_at: string
  enriched?: boolean
  alpha_score?: number
  risk_score?: number
  social_score?: number
  ai_insights?: any
}

export interface JobStatus {
  id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
  results?: any
  error?: string
  created_at: string
  updated_at: string
}
