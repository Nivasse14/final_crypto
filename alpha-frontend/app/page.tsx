'use client'

import { useState, useEffect } from 'react'
import { AlphaDashboard } from '../components/AlphaDashboard'
import { WalletAnalyzer } from '../components/WalletAnalyzer'
import { TradingSignals } from '../components/TradingSignals'
import { SocialTradingHub } from '../components/SocialTradingHub'
import { AIInsights } from '../components/AIInsights'
import MarketIntelligence from '../components/MarketIntelligence'
import RiskManagement from '../components/RiskManagement'
import AutomatedStrategyEngine from '../components/AutomatedStrategyEngine'
import RealTimeStatus from '../components/RealTimeStatus'
import ExecutiveDashboard from '../components/ExecutiveDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  Users, 
  Brain, 
  Shield, 
  Bot, 
  BarChart3, 
  Crown, 
  ChevronDown, 
  Search,
  Bell,
  Wallet as WalletIcon
} from 'lucide-react'
import { api } from '../lib/utils'
import { Wallet, supabase } from '../lib/supabase'

export default function Home() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Charger les portefeuilles au démarrage
  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wallet_registry')
        .select('*')
        .order('total_pnl', { ascending: false })
        .limit(500)

      if (error) throw error
      setWallets(data || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erreur lors du chargement des portefeuilles:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCompleteWorkflow = async () => {
    try {
      const result = await api.startCompleteWorkflow()
      setActiveJob(result.jobId)
      
      // Polling pour vérifier le statut
      const checkStatus = setInterval(async () => {
        const status = await api.getJobStatus(result.jobId)
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(checkStatus)
          setActiveJob(null)
          if (status.status === 'completed') {
            await loadWallets() // Recharger les données
          }
        }
      }, 5000)
    } catch (error) {
      console.error('Erreur lors du lancement du workflow:', error)
    }
  }

  const enrichAllWallets = async () => {
    const enrichPromises = wallets.slice(0, 10).map(w => 
      api.enrichWallet(w.wallet_address).catch(e => console.error(e))
    )
    await Promise.all(enrichPromises)
    await loadWallets()
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background avec animation */}
      <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900"></div>
      
      {/* Orbes décoratifs avec animation */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-purple-800/10 filter blur-3xl opacity-30 animate-float"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] rounded-full bg-indigo-800/10 filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-pink-700/5 filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      
      {/* Statut temps réel */}
      <RealTimeStatus />
      
      {/* Header ultra-premium avec glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-purple-800/30 bg-black/40 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 group">
                <div className="relative">
                  <Zap className="h-8 w-8 text-purple-400 transition-all duration-300 group-hover:scale-110 group-hover:text-purple-300" />
                  <div className="absolute inset-0 bg-purple-500/30 rounded-full filter blur-xl scale-150 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>
                <h1 className="text-2xl font-bold text-gradient text-glow transition-all duration-300">
                  Alpha Hunter
                </h1>
              </div>
              <div className="text-sm glass px-2.5 py-1 rounded-full border border-purple-500/20">
                <span className="text-gradient-success font-semibold">{wallets.length}</span>
                <span className="text-gray-300 ml-1">portefeuilles analysés</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Icônes de navigation */}
              <div className="hidden md:flex items-center space-x-1 mr-4">
                <button className="p-2 rounded-full hover:bg-purple-500/10 transition-colors">
                  <Bell className="h-5 w-5 text-gray-400 hover:text-purple-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-purple-500/10 transition-colors">
                  <Search className="h-5 w-5 text-gray-400 hover:text-purple-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-purple-500/10 transition-colors">
                  <WalletIcon className="h-5 w-5 text-gray-400 hover:text-purple-400" />
                </button>
              </div>
              
              {/* Boutons d'action */}
              <Button
                onClick={enrichAllWallets}
                variant="outline"
                size="sm"
                className="border-purple-600/50 text-purple-300 hover:bg-purple-600/20 hover:border-purple-500 transition-all duration-300"
              >
                <Brain className="h-4 w-4 mr-2" />
                <span>Enrichir IA</span>
              </Button>
              
              <Button
                onClick={startCompleteWorkflow}
                disabled={activeJob !== null}
                className="button-premium"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 to-pink-600/80 opacity-100 group-hover:opacity-100 transition-opacity z-[-1]"></div>
                {activeJob ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                <span>{activeJob ? 'Mise à jour...' : 'Mettre à jour'}</span>
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-xs text-gray-400 mt-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 pulse-glow"></div>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      {/* Navigation par onglets premium */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-9 glass border-shine border border-purple-800/20 shadow-lg p-1 rounded-full max-w-4xl mx-auto">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analyzer" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Analyzer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="signals" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Signaux</span>
              </TabsTrigger>
              <TabsTrigger 
                value="social" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
              <TabsTrigger 
                value="market" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Market</span>
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger 
                value="automation" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Auto</span>
              </TabsTrigger>
              <TabsTrigger 
                value="executive" 
                className="flex items-center justify-center space-x-1.5 rounded-full px-4 py-2.5 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-700/70 data-[state=active]:to-purple-600/70 data-[state=active]:text-white"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Elite</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-r from-purple-900/20 to-pink-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <AlphaDashboard wallets={wallets} loading={loading} />
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-indigo-900/20 to-purple-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <WalletAnalyzer wallets={wallets} />
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-r from-blue-900/20 to-purple-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <TradingSignals wallets={wallets} />
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-purple-900/20 to-indigo-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <SocialTradingHub wallets={wallets} />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-r from-pink-900/20 to-purple-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <AIInsights wallets={wallets} />
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-violet-900/20 to-indigo-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <MarketIntelligence wallets={wallets.map(w => ({ 
                id: String(w.id || ''), 
                address: w.wallet_address || '', 
                value_usd: w.total_pnl || 0 
              }))} />
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-r from-blue-900/20 to-violet-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <RiskManagement wallets={wallets.map(w => ({ 
                id: String(w.id || ''), 
                address: w.wallet_address || '', 
                value_usd: w.total_pnl || 0 
              }))} />
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-purple-900/20 to-blue-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <AutomatedStrategyEngine />
            </div>
          </TabsContent>
          
          <TabsContent value="executive" className="space-y-8 fade-in">
            <div className="relative">
              <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-r from-pink-900/20 to-purple-900/10 blur-3xl opacity-30 rounded-full -z-10"></div>
              <ExecutiveDashboard wallets={wallets.map(w => ({ 
                id: String(w.id || ''), 
                address: w.wallet_address || '', 
                value_usd: w.total_pnl || 0 
              }))} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer premium */}
      <footer className="mt-16 border-t border-purple-800/20 py-8 px-6 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Zap className="h-6 w-6 text-purple-400 mr-2" />
              <span className="text-gradient text-xl font-bold">Alpha Hunter</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 mb-6 md:mb-0">
              <div className="text-sm text-center md:text-left">
                <h4 className="text-white font-medium mb-2">Modules</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Dashboard</li>
                  <li>Wallet Analysis</li>
                  <li>Trading Signals</li>
                </ul>
              </div>
              
              <div className="text-sm text-center md:text-left">
                <h4 className="text-white font-medium mb-2">Ressources</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Documentation</li>
                  <li>API</li>
                  <li>Support</li>
                </ul>
              </div>
              
              <div className="text-sm text-center md:text-left">
                <h4 className="text-white font-medium mb-2">À propos</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Notre équipe</li>
                  <li>Technologie</li>
                  <li>Partenaires</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="p-2 rounded-full hover:bg-purple-500/10 transition-all">
                <svg className="h-5 w-5 text-gray-400 hover:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </button>
              <button className="p-2 rounded-full hover:bg-purple-500/10 transition-all">
                <svg className="h-5 w-5 text-gray-400 hover:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </button>
              <button className="p-2 rounded-full hover:bg-purple-500/10 transition-all">
                <svg className="h-5 w-5 text-gray-400 hover:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-purple-800/10 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Alpha Hunter. Tous droits réservés.</p>
            <div className="mt-2 flex justify-center space-x-4">
              <span className="hover:text-purple-400 cursor-pointer">Conditions d'utilisation</span>
              <span className="hover:text-purple-400 cursor-pointer">Confidentialité</span>
              <span className="hover:text-purple-400 cursor-pointer">Mentions légales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
