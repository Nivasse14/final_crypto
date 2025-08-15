'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Users,
  Copy,
  Share2,
  Trophy,
  Zap,
  Heart,
  UserPlus
} from 'lucide-react'
import { Wallet } from '../lib/supabase'
import { formatters, alphaCalculators } from '../lib/utils'

interface SocialTradingHubProps {
  wallets: Wallet[]
}

interface TraderProfile {
  wallet: Wallet
  followers: number
  following: number
  likes: number
  shareCount: number
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  reputation: number
  streak: number
}

export function SocialTradingHub({ wallets }: SocialTradingHubProps) {
  const [selectedTier, setSelectedTier] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'diamond'>('all')
  const [sortBy, setSortBy] = useState<'reputation' | 'pnl' | 'followers' | 'streak'>('reputation')
  const [followedWallets, setFollowedWallets] = useState<Set<string>>(new Set())

  const getTierBadge = (tier: TraderProfile['tier']) => {
    const configs = {
      bronze: { color: 'bg-orange-600', icon: '🥉', label: 'Bronze' },
      silver: { color: 'bg-gray-500', icon: '🥈', label: 'Silver' },
      gold: { color: 'bg-yellow-500', icon: '🥇', label: 'Gold' },
      diamond: { color: 'bg-purple-600', icon: '💎', label: 'Diamond' }
    }
    return configs[tier]
  }

  // Création des profils de traders sociaux
  const traderProfiles = useMemo(() => {
    return wallets.map(wallet => {
      const alphaScore = alphaCalculators.calculateAlphaScore(wallet)
      const riskScore = alphaCalculators.calculateRiskScore(wallet)
      
      // Simulation des métriques sociales
      const baseFollowers = Math.floor(alphaScore * 10 + wallet.total_pnl / 10000)
      const followers = Math.max(0, baseFollowers + Math.floor(Math.random() * 1000))
      const following = Math.floor(Math.random() * 500) + 50
      const likes = Math.floor(followers * 2.5 + Math.random() * 1000)
      const shareCount = Math.floor(likes * 0.3)
      
      // Calcul du tier basé sur les performances
      let tier: TraderProfile['tier'] = 'bronze'
      if (alphaScore > 90 && wallet.total_pnl > 1000000) tier = 'diamond'
      else if (alphaScore > 75 && wallet.total_pnl > 500000) tier = 'gold'
      else if (alphaScore > 60 && wallet.total_pnl > 100000) tier = 'silver'
      
      // Score de réputation combiné
      const reputation = Math.floor(
        alphaScore * 0.4 + 
        (Math.min(100, riskScore) * -0.2) + 
        (followers / 100) * 0.2 + 
        (wallet.win_rate * 100) * 0.3 + 
        Math.random() * 20
      )
      
      const streak = Math.floor(Math.random() * 30) + 1

      return {
        wallet,
        followers,
        following,
        likes,
        shareCount,
        tier,
        reputation: Math.max(0, Math.min(100, reputation)),
        streak
      }
    }).sort((a, b) => b.reputation - a.reputation).slice(0, 100)
  }, [wallets])

  const filteredProfiles = useMemo(() => {
    let filtered = traderProfiles
    
    if (selectedTier !== 'all') {
      filtered = filtered.filter(profile => profile.tier === selectedTier)
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reputation': return b.reputation - a.reputation
        case 'pnl': return b.wallet.total_pnl - a.wallet.total_pnl
        case 'followers': return b.followers - a.followers
        case 'streak': return b.streak - a.streak
        default: return 0
      }
    })
  }, [traderProfiles, selectedTier, sortBy])

  const topTraders = useMemo(() => {
    return traderProfiles.slice(0, 10)
  }, [traderProfiles])

  const handleFollow = (walletAddress: string) => {
    setFollowedWallets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(walletAddress)) {
        newSet.delete(walletAddress)
      } else {
        newSet.add(walletAddress)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Top Traders du Moment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topTraders.slice(0, 5).map((profile, index) => (
              <TopTraderCard key={profile.wallet.wallet_address} profile={profile} rank={index + 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques communautaires */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="👥 Traders Actifs" value={traderProfiles.length} />
        <StatCard title="💎 Traders Diamond" value={traderProfiles.filter(p => p.tier === 'diamond').length} />
        <StatCard title="🔥 Moy. Réputation" value={Math.floor(traderProfiles.reduce((sum, p) => sum + p.reputation, 0) / traderProfiles.length)} />
        <StatCard title="📈 Suivi Total" value={followedWallets.size} />
      </div>

      {/* Filtres et tri */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'diamond', 'gold', 'silver', 'bronze'] as const).map((tier) => (
            <Button
              key={tier}
              variant={selectedTier === tier ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTier(tier)}
              className={selectedTier === tier ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
            >
              {tier === 'all' && 'Tous'}
              {tier === 'diamond' && '💎 Diamond'}
              {tier === 'gold' && '🥇 Gold'}
              {tier === 'silver' && '🥈 Silver'}
              {tier === 'bronze' && '🥉 Bronze'}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['reputation', 'pnl', 'followers', 'streak'] as const).map((sort) => (
            <Button
              key={sort}
              variant={sortBy === sort ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy(sort)}
            >
              {sort === 'reputation' && 'Réputation'}
              {sort === 'pnl' && 'PnL'}
              {sort === 'followers' && 'Followers'}
              {sort === 'streak' && 'Streak'}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des traders */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProfiles.map((profile, index) => (
          <TraderProfileCard 
            key={profile.wallet.wallet_address} 
            profile={profile} 
            rank={index + 1}
            isFollowed={followedWallets.has(profile.wallet.wallet_address)}
            onFollow={() => handleFollow(profile.wallet.wallet_address)}
          />
        ))}
      </div>

      {/* Section Copy Trading */}
      <CopyTradingSection followedWallets={Array.from(followedWallets)} allProfiles={traderProfiles} />
    </div>
  )
}

interface TopTraderCardProps {
  profile: TraderProfile
  rank: number
}

function TopTraderCard({ profile, rank }: TopTraderCardProps) {
  const getTierBadge = (tier: TraderProfile['tier']) => {
    const configs = {
      bronze: { color: 'bg-orange-600', icon: '🥉', label: 'Bronze' },
      silver: { color: 'bg-gray-500', icon: '🥈', label: 'Silver' },
      gold: { color: 'bg-yellow-500', icon: '🥇', label: 'Gold' },
      diamond: { color: 'bg-purple-600', icon: '💎', label: 'Diamond' }
    }
    return configs[tier]
  }

  const tierBadge = getTierBadge(profile.tier)
  
  return (
    <Card className="bg-slate-800/50 border-slate-600 hover:border-purple-500/50 transition-all">
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-2">
          <Badge className={`${tierBadge.color} text-white`}>
            {tierBadge.icon} #{rank}
          </Badge>
        </div>
        <code className="text-xs text-gray-400 block mb-2">
          {formatters.formatAddress(profile.wallet.wallet_address)}
        </code>
        <div className="text-lg font-bold text-green-400 mb-1">
          {formatters.formatPnL(profile.wallet.total_pnl)}
        </div>
        <div className="text-sm text-purple-400">
          Réputation: {profile.reputation}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {profile.followers} followers
        </div>
      </CardContent>
    </Card>
  )
}

interface TraderProfileCardProps {
  profile: TraderProfile
  rank: number
  isFollowed: boolean
  onFollow: () => void
}

function TraderProfileCard({ profile, rank, isFollowed, onFollow }: TraderProfileCardProps) {
  const getTierBadge = (tier: TraderProfile['tier']) => {
    const configs = {
      bronze: { color: 'bg-orange-600', icon: '🥉', label: 'Bronze' },
      silver: { color: 'bg-gray-500', icon: '🥈', label: 'Silver' },
      gold: { color: 'bg-yellow-500', icon: '🥇', label: 'Gold' },
      diamond: { color: 'bg-purple-600', icon: '💎', label: 'Diamond' }
    }
    return configs[tier]
  }

  const tierBadge = getTierBadge(profile.tier)
  const alphaScore = alphaCalculators.calculateAlphaScore(profile.wallet)
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">#{rank}</div>
              <Badge className={`${tierBadge.color} text-white text-xs`}>
                {tierBadge.icon} {tierBadge.label}
              </Badge>
            </div>
            
            <div>
              <code className="text-sm bg-slate-700 px-2 py-1 rounded">
                {formatters.formatAddress(profile.wallet.wallet_address)}
              </code>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{profile.followers}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Heart className="h-4 w-4" />
                  <span>{profile.likes}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Share2 className="h-4 w-4" />
                  <span>{profile.shareCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm text-gray-400">PnL Total</p>
              <p className={`text-lg font-bold ${profile.wallet.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatters.formatPnL(profile.wallet.total_pnl)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Réputation</p>
              <p className="text-lg font-bold text-purple-400">
                {profile.reputation}/100
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-lg font-bold text-blue-400">
                {formatters.formatWinRate(profile.wallet.win_rate)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Alpha Score</p>
              <p className="text-lg font-bold text-yellow-400">
                {alphaScore.toFixed(1)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Streak</p>
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-orange-400" />
                <span className="text-lg font-bold text-orange-400">{profile.streak}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={onFollow}
                variant={isFollowed ? 'default' : 'outline'}
                size="sm"
                className={isFollowed ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
              >
                {isFollowed ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Suivi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Suivre
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CopyTradingSectionProps {
  followedWallets: string[]
  allProfiles: TraderProfile[]
}

function CopyTradingSection({ followedWallets, allProfiles }: CopyTradingSectionProps) {
  const followedProfiles = allProfiles.filter(profile => 
    followedWallets.includes(profile.wallet.wallet_address)
  )

  if (followedProfiles.length === 0) {
    return null
  }

  const totalPnL = followedProfiles.reduce((sum, profile) => sum + profile.wallet.total_pnl, 0)
  const avgWinRate = followedProfiles.reduce((sum, profile) => sum + profile.wallet.win_rate, 0) / followedProfiles.length

  return (
    <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Copy className="h-6 w-6 text-green-400" />
          Portfolio de Copy Trading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Traders Suivis</div>
            <div className="text-2xl font-bold text-white">{followedProfiles.length}</div>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">PnL Combiné</div>
            <div className="text-2xl font-bold text-green-400">{formatters.formatPnL(totalPnL)}</div>
          </div>
          <div className="bg-black/20 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Win Rate Moyen</div>
            <div className="text-2xl font-bold text-blue-400">{formatters.formatWinRate(avgWinRate)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {followedProfiles.map(profile => (
            <Badge key={profile.wallet.wallet_address} className="bg-green-600 text-white">
              {formatters.formatAddress(profile.wallet.wallet_address)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: number
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
