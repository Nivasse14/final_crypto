const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeEmptyColumns() {
  console.log('🔍 ANALYSE COMPLÈTE DES COLONNES VIDES')
  console.log('=====================================\n')

  try {
    // 1. Récupérer un échantillon de wallets enrichis
    console.log('📊 Step 1: Récupération des wallets enrichis...')
    
    const { data: wallets, error: walletsError } = await supabase
      .from('wallet_registry')
      .select(`
        wallet_address,
        dexscreener_tokens_with_market_cap,
        dexscreener_micro_cap_count,
        dexscreener_low_cap_count,
        dexscreener_middle_cap_count,
        dexscreener_large_cap_count,
        dexscreener_mega_cap_count,
        dexscreener_unknown_cap_count,
        dexscreener_total_analyzed_count,
        enriched_total_pnl_usd,
        enriched_winrate,
        enriched_total_trades,
        enriched_roi_percentage,
        enriched_portfolio_value_usd,
        enriched_portfolio_tokens,
        dexscreener_enriched_portfolio_tokens,
        dexscreener_enriched_pnl_tokens,
        dexscreener_tokens_with_price_data,
        dexscreener_average_reliability_score,
        copy_trading_score,
        pnl_30d,
        trade_count_30d,
        winrate_30d,
        roi_pct_30d,
        cielo_complete_data,
        last_processed_at
      `)
      .not('cielo_complete_data', 'is', null)
      .not('dexscreener_tokens_with_market_cap', 'is', null)
      .gt('dexscreener_tokens_with_market_cap', 0)
      .order('last_processed_at', { ascending: false })
      .limit(10)

    if (walletsError) {
      console.error('❌ Erreur récupération wallets:', walletsError)
      return
    }

    console.log(`✅ Trouvé ${wallets.length} wallets enrichis\n`)

    // 2. Analyser les colonnes vides
    const emptyColumns = []
    const columnsToAnalyze = [
      'dexscreener_micro_cap_count',
      'dexscreener_low_cap_count', 
      'dexscreener_middle_cap_count',
      'dexscreener_large_cap_count',
      'dexscreener_mega_cap_count',
      'dexscreener_unknown_cap_count',
      'dexscreener_total_analyzed_count',
      'copy_trading_score',
      'pnl_30d',
      'trade_count_30d',
      'winrate_30d',
      'roi_pct_30d'
    ]

    console.log('📊 Step 2: Analyse des colonnes vides...')
    columnsToAnalyze.forEach(column => {
      const emptyCount = wallets.filter(w => w[column] === null || w[column] === 0).length
      const filledCount = wallets.filter(w => w[column] !== null && w[column] !== 0).length
      
      console.log(`   ${column}: ${filledCount}/${wallets.length} rempli (${emptyCount} vides)`)
      
      if (emptyCount > filledCount) {
        emptyColumns.push(column)
      }
    })

    console.log(`\n❌ Colonnes principalement vides: ${emptyColumns.join(', ')}\n`)

    // 3. Analyser les données disponibles pour calculs
    console.log('📊 Step 3: Analyse des données disponibles pour calculs...')
    
    for (const wallet of wallets.slice(0, 3)) {
      console.log(`\n🔍 Wallet: ${wallet.wallet_address}`)
      console.log(`   - dexscreener_tokens_with_market_cap: ${wallet.dexscreener_tokens_with_market_cap}`)
      console.log(`   - Colonnes market cap détaillées:`)
      console.log(`     • micro: ${wallet.dexscreener_micro_cap_count || 'null'}`)
      console.log(`     • low: ${wallet.dexscreener_low_cap_count || 'null'}`)
      console.log(`     • middle: ${wallet.dexscreener_middle_cap_count || 'null'}`)
      console.log(`     • large: ${wallet.dexscreener_large_cap_count || 'null'}`)
      console.log(`     • mega: ${wallet.dexscreener_mega_cap_count || 'null'}`)
      console.log(`     • unknown: ${wallet.dexscreener_unknown_cap_count || 'null'}`)

      // Analyser les données brutes cielo_complete_data
      if (wallet.cielo_complete_data) {
        const data = wallet.cielo_complete_data
        
        console.log(`   - Données brutes disponibles:`)
        console.log(`     • Portfolio enrichi: ${data.enriched_portfolio ? 'OUI' : 'NON'}`)
        console.log(`     • PnL enrichi: ${data.enriched_pnl ? 'OUI' : 'NON'}`)
        
        if (data.enriched_portfolio?.enriched_tokens) {
          const portfolioTokens = data.enriched_portfolio.enriched_tokens
          const portfolioWithMarketCap = portfolioTokens.filter(t => 
            t.dexscreener_data?.financial_data?.market_cap
          )
          console.log(`     • Portfolio tokens avec market cap: ${portfolioWithMarketCap.length}/${portfolioTokens.length}`)
        }
        
        if (data.enriched_pnl?.enriched_tokens) {
          const pnlTokens = data.enriched_pnl.enriched_tokens
          const pnlWithMarketCap = pnlTokens.filter(t => 
            t.dexscreener_data?.financial_data?.market_cap
          )
          console.log(`     • PnL tokens avec market cap: ${pnlWithMarketCap.length}/${pnlTokens.length}`)
        }

        if (data.extracted_data?.enhanced_stats) {
          const stats = data.extracted_data.enhanced_stats
          console.log(`     • Enhanced stats Cielo:`)
          console.log(`       - total_pnl_usd: ${stats.total_pnl_usd}`)
          console.log(`       - winrate: ${stats.winrate}`)
          console.log(`       - total_trades: ${stats.total_trades}`)
          console.log(`       - roi_percentage: ${stats.roi_percentage}`)
        }
      }
    }

    // 4. Identifier les calculs à effectuer
    console.log(`\n📋 Step 4: Plan de remplissage des colonnes vides`)
    console.log('================================================')
    
    console.log(`\n🔧 CALCULS NÉCESSAIRES:`)
    
    if (emptyColumns.includes('dexscreener_micro_cap_count')) {
      console.log(`✅ 1. Calcul des métriques market cap détaillées à partir de cielo_complete_data`)
      console.log(`   - Analyser chaque token enrichi`)
      console.log(`   - Categoriser selon les seuils: micro (<1M), low (1M-10M), middle (10M-100M), large (100M-1B), mega (>1B)`)
      console.log(`   - Mettre à jour les colonnes dexscreener_*_cap_count`)
    }

    if (emptyColumns.includes('copy_trading_score')) {
      console.log(`✅ 2. Calcul du copy_trading_score composite (0-100)`)
      console.log(`   - Basé sur: winrate, total_pnl_usd, total_trades, roi_percentage`)
      console.log(`   - Algorithme: score = (winrate*30 + pnl_score*25 + trade_activity*20 + roi_score*25)`)
    }

    if (emptyColumns.includes('pnl_30d')) {
      console.log(`✅ 3. Calcul des métriques 30 jours`)
      console.log(`   - Analyser les données PnL des 30 derniers jours`)
      console.log(`   - Calculer: pnl_30d, trade_count_30d, winrate_30d, roi_pct_30d`)
    }

    console.log(`\n🚀 PRÊT POUR LE REMPLISSAGE AUTOMATIQUE`)

    return {
      walletsCount: wallets.length,
      emptyColumns,
      sampleWallets: wallets.slice(0, 3).map(w => w.wallet_address)
    }

  } catch (error) {
    console.error('❌ Erreur analyse:', error)
  }
}

analyzeEmptyColumns().then(result => {
  if (result) {
    console.log(`\n✅ Analyse terminée - ${result.walletsCount} wallets analysés`)
    console.log(`❌ ${result.emptyColumns.length} types de colonnes vides identifiées`)
    console.log(`🎯 Prêt pour le remplissage automatique`)
  }
}).catch(error => {
  console.error('❌ Erreur:', error)
})
