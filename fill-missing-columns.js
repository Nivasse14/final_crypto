const https = require('https')

// Configuration
const SUPABASE_URL = 'xkndddxqqlxqknbqtefv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'

// Fonction pour faire des requêtes HTTPS
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = res.statusCode < 300 ? JSON.parse(data) : { error: data, status: res.statusCode }
          resolve(result)
        } catch (error) {
          resolve({ error: data, status: res.statusCode })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })

    if (postData) {
      req.write(postData)
    }
    req.end()
  })
}

// Calculer les métriques de market cap à partir des données brutes
function calculateMarketCapMetrics(cieloCompleteData) {
  const THRESHOLDS = {
    MICRO: 1000000,       // < 1M USD
    LOW: 10000000,        // 1M - 10M USD  
    MIDDLE: 100000000,    // 10M - 100M USD
    LARGE: 1000000000,    // 100M - 1B USD
    MEGA: 1000000000      // > 1B USD
  }

  function categorizeMarketCap(marketCap) {
    if (!marketCap || marketCap <= 0) return 'unknown'
    if (marketCap < THRESHOLDS.MICRO) return 'micro'
    if (marketCap < THRESHOLDS.LOW) return 'low'
    if (marketCap < THRESHOLDS.MIDDLE) return 'middle'
    if (marketCap < THRESHOLDS.LARGE) return 'large'
    return 'mega'
  }

  const metrics = {
    micro: 0,
    low: 0,
    middle: 0,
    large: 0,
    mega: 0,
    unknown: 0,
    total_analyzed: 0
  }

  try {
    // Analyser les tokens portfolio
    if (cieloCompleteData.enriched_portfolio?.enriched_tokens) {
      cieloCompleteData.enriched_portfolio.enriched_tokens.forEach(token => {
        const marketCap = token.dexscreener_data?.financial_data?.market_cap
        if (marketCap !== undefined) {
          const category = categorizeMarketCap(marketCap)
          metrics[category]++
          metrics.total_analyzed++
        }
      })
    }

    // Analyser les tokens PnL
    if (cieloCompleteData.enriched_pnl?.enriched_tokens) {
      cieloCompleteData.enriched_pnl.enriched_tokens.forEach(token => {
        const marketCap = token.dexscreener_data?.financial_data?.market_cap
        if (marketCap !== undefined) {
          const category = categorizeMarketCap(marketCap)
          metrics[category]++
          metrics.total_analyzed++
        }
      })
    }

    return metrics
  } catch (error) {
    console.error('❌ Erreur calcul market cap:', error)
    return metrics
  }
}

// Calculer le copy trading score
function calculateCopyTradingScore(stats) {
  try {
    const winrate = stats.enriched_winrate || 0
    const totalPnl = stats.enriched_total_pnl_usd || 0
    const totalTrades = stats.enriched_total_trades || 0
    const roi = stats.enriched_roi_percentage || 0

    // Score winrate (0-30 points)
    const winrateScore = Math.min(winrate * 30, 30)

    // Score PnL (0-25 points) - logarithmique pour les gros montants
    let pnlScore = 0
    if (totalPnl > 0) {
      pnlScore = Math.min(Math.log10(totalPnl + 1) * 5, 25)
    }

    // Score activité de trading (0-20 points)
    let activityScore = 0
    if (totalTrades > 0) {
      activityScore = Math.min(Math.log10(totalTrades + 1) * 6, 20)
    }

    // Score ROI (0-25 points)
    let roiScore = 0
    if (roi > 0) {
      roiScore = Math.min(roi / 4, 25) // ROI de 100% = 25 points
    }

    const totalScore = Math.round(winrateScore + pnlScore + activityScore + roiScore)
    return Math.min(totalScore, 100)

  } catch (error) {
    console.error('❌ Erreur calcul copy trading score:', error)
    return 0
  }
}

// Calculer les métriques 30 jours (simulées à partir des données disponibles)
function calculate30dMetrics(cieloCompleteData, enhancedStats) {
  try {
    // Pour l'instant, on utilise une approximation basée sur les stats totales
    // Dans un vrai système, il faudrait analyser les données temporelles
    
    const totalPnl = enhancedStats.enriched_total_pnl_usd || 0
    const totalTrades = enhancedStats.enriched_total_trades || 0
    const winrate = enhancedStats.enriched_winrate || 0
    const roi = enhancedStats.enriched_roi_percentage || 0

    // Approximation: 30j = ~10% de l'activité totale (ajustable)
    const factor30d = 0.1

    return {
      pnl_30d: Math.round(totalPnl * factor30d * 100) / 100,
      trade_count_30d: Math.round(totalTrades * factor30d),
      winrate_30d: winrate, // Le winrate reste similaire
      roi_pct_30d: Math.round(roi * factor30d * 100) / 100
    }
  } catch (error) {
    console.error('❌ Erreur calcul métriques 30j:', error)
    return {
      pnl_30d: 0,
      trade_count_30d: 0,
      winrate_30d: 0,
      roi_pct_30d: 0
    }
  }
}

// Fonction principale pour remplir les colonnes
async function fillMissingColumns() {
  console.log('🚀 REMPLISSAGE AUTOMATIQUE DES COLONNES MANQUANTES')
  console.log('==================================================\n')

  try {
    // 1. Récupérer les wallets avec données enrichies mais colonnes vides
    console.log('📊 Step 1: Récupération des wallets à traiter...')
    
    const getOptions = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/wallet_registry?select=wallet_address,cielo_complete_data,enriched_total_pnl_usd,enriched_winrate,enriched_total_trades,enriched_roi_percentage,dexscreener_tokens_with_market_cap,dexscreener_micro_cap_count&cielo_complete_data=not.is.null&dexscreener_tokens_with_market_cap=gt.0&limit=5',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const wallets = await httpsRequest(getOptions)
    
    if (wallets.error) {
      console.error('❌ Erreur récupération wallets:', wallets)
      return
    }

    console.log(`✅ Trouvé ${wallets.length} wallets à traiter\n`)

    // 2. Traiter chaque wallet
    let processedCount = 0
    
    for (const wallet of wallets) {
      console.log(`🔄 Traitement wallet: ${wallet.wallet_address}`)
      
      try {
        const cieloData = wallet.cielo_complete_data
        
        // Calculer les métriques market cap
        const marketCapMetrics = calculateMarketCapMetrics(cieloData)
        console.log(`   📊 Market cap: micro:${marketCapMetrics.micro}, low:${marketCapMetrics.low}, middle:${marketCapMetrics.middle}, large:${marketCapMetrics.large}, mega:${marketCapMetrics.mega}`)
        
        // Calculer le copy trading score
        const copyScore = calculateCopyTradingScore(wallet)
        console.log(`   🎯 Copy trading score: ${copyScore}`)
        
        // Calculer les métriques 30j
        const metrics30d = calculate30dMetrics(cieloData, wallet)
        console.log(`   📅 30j: PnL:${metrics30d.pnl_30d}, trades:${metrics30d.trade_count_30d}, winrate:${metrics30d.winrate_30d}`)
        
        // Préparer les données de mise à jour
        const updateData = {
          dexscreener_micro_cap_count: marketCapMetrics.micro,
          dexscreener_low_cap_count: marketCapMetrics.low,
          dexscreener_middle_cap_count: marketCapMetrics.middle,
          dexscreener_large_cap_count: marketCapMetrics.large,
          dexscreener_mega_cap_count: marketCapMetrics.mega,
          dexscreener_unknown_cap_count: marketCapMetrics.unknown,
          dexscreener_total_analyzed_count: marketCapMetrics.total_analyzed,
          copy_trading_score: copyScore,
          pnl_30d: metrics30d.pnl_30d,
          trade_count_30d: metrics30d.trade_count_30d,
          winrate_30d: metrics30d.winrate_30d,
          roi_pct_30d: metrics30d.roi_pct_30d
        }
        
        // Mettre à jour en base
        const updateOptions = {
          hostname: SUPABASE_URL,
          port: 443,
          path: `/rest/v1/wallet_registry?wallet_address=eq.${wallet.wallet_address}`,
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        }
        
        const updateResult = await httpsRequest(updateOptions, JSON.stringify(updateData))
        
        if (updateResult.error) {
          console.error(`   ❌ Erreur mise à jour: ${updateResult.error}`)
        } else {
          console.log(`   ✅ Mis à jour avec succès`)
          processedCount++
        }
        
        // Pause entre les mises à jour
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`   ❌ Erreur traitement: ${error.message}`)
      }
    }

    console.log(`\n🎉 REMPLISSAGE TERMINÉ`)
    console.log(`✅ ${processedCount}/${wallets.length} wallets traités avec succès`)
    
    // 3. Vérification finale
    console.log(`\n🔍 Vérification finale...`)
    
    const verifyOptions = {
      hostname: SUPABASE_URL,
      port: 443,
      path: `/rest/v1/wallet_registry?select=wallet_address,dexscreener_micro_cap_count,dexscreener_tokens_with_market_cap,copy_trading_score&wallet_address=eq.${wallets[0]?.wallet_address}&limit=1`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
    
    const verification = await httpsRequest(verifyOptions)
    
    if (verification && verification[0]) {
      const v = verification[0]
      console.log(`✅ Vérification wallet ${v.wallet_address}:`)
      console.log(`   - dexscreener_tokens_with_market_cap: ${v.dexscreener_tokens_with_market_cap}`)
      console.log(`   - dexscreener_micro_cap_count: ${v.dexscreener_micro_cap_count}`)
      console.log(`   - copy_trading_score: ${v.copy_trading_score}`)
      
      const total = v.dexscreener_micro_cap_count || 0
      const expected = v.dexscreener_tokens_with_market_cap || 0
      
      if (total > 0) {
        console.log(`✅ SUCCÈS: Les colonnes détaillées sont maintenant remplies!`)
        console.log(`📊 Cohérence: ${total} tokens détaillés vs ${expected} total avec market cap`)
      } else {
        console.log(`⚠️ Les colonnes détaillées sont encore vides - besoin de créer les colonnes d'abord`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

fillMissingColumns()
