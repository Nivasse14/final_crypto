const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMarketCapIssue() {
  console.log('🔍 DEBUG: Investigating market cap metrics issue...\n')

  try {
    // 1. Vérifier les colonnes existantes dans wallet_registry
    console.log('📋 Step 1: Checking existing columns in wallet_registry table...')
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('wallet_registry')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error fetching table info:', tableError)
      return
    }
    
    if (tableInfo && tableInfo.length > 0) {
      const columns = Object.keys(tableInfo[0])
      console.log(`✅ Found ${columns.length} columns in wallet_registry`)
      
      // Chercher les colonnes liées aux market cap
      const marketCapColumns = columns.filter(col => 
        col.includes('market_cap') || 
        col.includes('dexscreener') ||
        col.includes('cap_count')
      )
      
      console.log('\n📊 Market cap related columns found:')
      marketCapColumns.forEach(col => console.log(`   - ${col}`))
      
      // Chercher spécifiquement les nouvelles colonnes
      const newColumns = [
        'dexscreener_micro_cap_count',
        'dexscreener_low_cap_count', 
        'dexscreener_middle_cap_count',
        'dexscreener_large_cap_count',
        'dexscreener_mega_cap_count',
        'dexscreener_unknown_cap_count',
        'dexscreener_total_analyzed_count'
      ]
      
      console.log('\n🔍 Checking for new market cap columns:')
      newColumns.forEach(col => {
        const exists = columns.includes(col)
        console.log(`   ${exists ? '✅' : '❌'} ${col}`)
      })
    }

    // 2. Vérifier les données d'un wallet spécifique
    console.log('\n📊 Step 2: Checking specific wallet data...')
    
    const testWallet = '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'
    
    const { data: walletData, error: walletError } = await supabase
      .from('wallet_registry')
      .select('wallet_address, dexscreener_tokens_with_market_cap, dexscreener_micro_cap_count, dexscreener_low_cap_count, dexscreener_middle_cap_count, dexscreener_large_cap_count, dexscreener_mega_cap_count, dexscreener_unknown_cap_count, last_processed_at')
      .eq('wallet_address', testWallet)
      .single()
    
    if (walletError) {
      console.error('❌ Error fetching wallet data:', walletError)
    } else if (walletData) {
      console.log(`✅ Wallet data for ${testWallet}:`)
      console.log(`   - dexscreener_tokens_with_market_cap: ${walletData.dexscreener_tokens_with_market_cap}`)
      console.log(`   - dexscreener_micro_cap_count: ${walletData.dexscreener_micro_cap_count}`)
      console.log(`   - dexscreener_low_cap_count: ${walletData.dexscreener_low_cap_count}`)
      console.log(`   - dexscreener_middle_cap_count: ${walletData.dexscreener_middle_cap_count}`)
      console.log(`   - dexscreener_large_cap_count: ${walletData.dexscreener_large_cap_count}`)
      console.log(`   - dexscreener_mega_cap_count: ${walletData.dexscreener_mega_cap_count}`)
      console.log(`   - dexscreener_unknown_cap_count: ${walletData.dexscreener_unknown_cap_count}`)
      console.log(`   - last_processed_at: ${walletData.last_processed_at}`)
      
      // Calculer la somme des détails
      const totalDetailed = (walletData.dexscreener_micro_cap_count || 0) +
                           (walletData.dexscreener_low_cap_count || 0) +
                           (walletData.dexscreener_middle_cap_count || 0) +
                           (walletData.dexscreener_large_cap_count || 0) +
                           (walletData.dexscreener_mega_cap_count || 0) +
                           (walletData.dexscreener_unknown_cap_count || 0)
      
      console.log(`\n🧮 Calculated totals:`)
      console.log(`   - Sum of detailed counts: ${totalDetailed}`)
      console.log(`   - Total with market cap: ${walletData.dexscreener_tokens_with_market_cap}`)
      console.log(`   - Difference: ${(walletData.dexscreener_tokens_with_market_cap || 0) - totalDetailed}`)
      
      if (totalDetailed === 0 && walletData.dexscreener_tokens_with_market_cap > 0) {
        console.log('\n⚠️  ISSUE IDENTIFIED: New columns exist but are empty!')
        console.log('   This suggests the columns were created but data has not been migrated yet.')
      }
    }

    // 3. Vérifier le code de calcul dans la fonction Supabase
    console.log('\n🔍 Step 3: Checking if calculation function exists in deployed code...')
    
    // 4. Vérifier les données brutes pour comprendre la source des 39 tokens
    console.log('\n📊 Step 4: Analyzing raw data to understand the 39 tokens...')
    
    const { data: rawData, error: rawError } = await supabase
      .from('wallet_registry')
      .select('cielo_complete_data')
      .eq('wallet_address', testWallet)
      .single()
    
    if (rawError) {
      console.error('❌ Error fetching raw data:', rawError)
    } else if (rawData?.cielo_complete_data) {
      const completeData = rawData.cielo_complete_data
      
      // Analyser les données enrichies
      let totalTokensWithMarketCap = 0
      let portfolioTokensWithMarketCap = 0
      let pnlTokensWithMarketCap = 0
      
      // Portfolio tokens
      if (completeData.enriched_portfolio?.enriched_tokens) {
        portfolioTokensWithMarketCap = completeData.enriched_portfolio.enriched_tokens.filter(
          t => t.dexscreener_data?.financial_data?.market_cap
        ).length
      }
      
      // PnL tokens  
      if (completeData.enriched_pnl?.enriched_tokens) {
        pnlTokensWithMarketCap = completeData.enriched_pnl.enriched_tokens.filter(
          t => t.dexscreener_data?.financial_data?.market_cap
        ).length
      }
      
      totalTokensWithMarketCap = portfolioTokensWithMarketCap + pnlTokensWithMarketCap
      
      console.log(`✅ Raw data analysis:`)
      console.log(`   - Portfolio tokens with market cap: ${portfolioTokensWithMarketCap}`)
      console.log(`   - PnL tokens with market cap: ${pnlTokensWithMarketCap}`)
      console.log(`   - Total tokens with market cap: ${totalTokensWithMarketCap}`)
      
      // Analyser les types de market cap
      const marketCapTypes = { micro: 0, low: 0, middle: 0, large: 0, mega: 0, unknown: 0 }
      
      const categorizeMarketCap = (marketCap) => {
        if (!marketCap || marketCap <= 0) return 'unknown'
        if (marketCap < 1000000) return 'micro'      // < 1M
        if (marketCap < 10000000) return 'low'       // 1M - 10M  
        if (marketCap < 100000000) return 'middle'   // 10M - 100M
        if (marketCap < 1000000000) return 'large'   // 100M - 1B
        return 'mega'                                // > 1B
      }
      
      // Analyser portfolio tokens
      if (completeData.enriched_portfolio?.enriched_tokens) {
        completeData.enriched_portfolio.enriched_tokens.forEach(token => {
          const marketCap = token.dexscreener_data?.financial_data?.market_cap
          if (marketCap) {
            const category = categorizeMarketCap(marketCap)
            marketCapTypes[category]++
          }
        })
      }
      
      // Analyser PnL tokens
      if (completeData.enriched_pnl?.enriched_tokens) {
        completeData.enriched_pnl.enriched_tokens.forEach(token => {
          const marketCap = token.dexscreener_data?.financial_data?.market_cap
          if (marketCap) {
            const category = categorizeMarketCap(marketCap)
            marketCapTypes[category]++
          }
        })
      }
      
      console.log(`\n📊 Market cap breakdown from raw data:`)
      console.log(`   - Micro cap (< 1M): ${marketCapTypes.micro}`)
      console.log(`   - Low cap (1M-10M): ${marketCapTypes.low}`)
      console.log(`   - Middle cap (10M-100M): ${marketCapTypes.middle}`)
      console.log(`   - Large cap (100M-1B): ${marketCapTypes.large}`)
      console.log(`   - Mega cap (> 1B): ${marketCapTypes.mega}`)
      console.log(`   - Unknown: ${marketCapTypes.unknown}`)
      
      const calculatedTotal = Object.values(marketCapTypes).reduce((a, b) => a + b, 0)
      console.log(`   - Calculated total: ${calculatedTotal}`)
    }

    // 5. Résumé et recommendations
    console.log('\n📋 SUMMARY AND RECOMMENDATIONS:')
    console.log('=====================================')
    
    const { data: columnCheck, error: colError } = await supabase
      .from('wallet_registry')
      .select('dexscreener_micro_cap_count')
      .limit(1)
    
    if (colError && colError.message.includes('column')) {
      console.log('❌ ISSUE: New market cap columns do not exist in database')
      console.log('✅ SOLUTION: Need to run the migration SQL to create the columns')
      console.log('📝 ACTION: Execute the migration-dexscreener-caps.sql file')
    } else if (columnCheck) {
      console.log('✅ New market cap columns exist in database')
      console.log('❌ ISSUE: Columns exist but data is not populated')
      console.log('✅ SOLUTION: Need to re-process a wallet to populate the new columns')
      console.log('📝 ACTION: Call the Edge Function again to trigger the calculation')
    }

  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugMarketCapIssue()
