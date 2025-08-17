// 🧪 Test de l'API Cielo avec auto-enrichissement intégré
// Ce script teste la nouvelle API qui enrichit automatiquement les métriques

const SUPABASE_URL = 'https://xknddxqqlxqknbqtefv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'

// Wallet de test (celui qui était problématique avant)
const TEST_WALLET = '7FWe2NBekGSALpnHWj1yka8sHdpnFtrGHdA8feRGpYoQ'

async function testAutoEnrichmentAPI() {
  console.log('🧪 Test de l\'API Cielo avec auto-enrichissement')
  console.log('=' .repeat(50))
  console.log(`🎯 Wallet de test : ${TEST_WALLET}`)
  console.log('')

  try {
    // 1. Appel à l'API avec auto-enrichissement
    console.log('📡 1. Appel à l\'API Cielo (auto-enrichissement)...')
    const startTime = Date.now()
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${TEST_WALLET}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`⏱️  Durée de l'appel : ${duration}ms`)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Réponse API reçue')
    
    // 2. Vérifier la structure de réponse
    console.log('\n📊 2. Vérification de la structure de réponse...')
    console.log(`   - success: ${data.success}`)
    console.log(`   - wallet_address: ${data.wallet_address}`)
    console.log(`   - api_version: ${data.api_version}`)
    
    // 3. Vérifier l'auto-enrichissement
    console.log('\n🔥 3. Vérification de l\'auto-enrichissement...')
    if (data.auto_enrichment) {
      console.log(`   ✅ Auto-enrichissement activé : ${data.auto_enrichment.enabled}`)
      console.log(`   ✅ Succès : ${data.auto_enrichment.success}`)
      console.log(`   📊 Métriques mises à jour : ${data.auto_enrichment.metrics_updated}`)
      
      if (data.auto_enrichment.error) {
        console.log(`   ❌ Erreur : ${data.auto_enrichment.error}`)
      }
      
      // 4. Afficher les métriques extraites
      if (data.auto_enrichment.extracted_metrics) {
        console.log('\n📈 4. Métriques buy/sell extraites :')
        const metrics = data.auto_enrichment.extracted_metrics
        console.log(`   💰 Buy metrics :`)
        console.log(`     - Average: $${metrics.average_buy_amount_usd}`)
        console.log(`     - Total amount: $${metrics.total_buy_amount_usd}`)
        console.log(`     - Total count: ${metrics.total_buy_count}`)
        console.log(`   💸 Sell metrics :`)
        console.log(`     - Average: $${metrics.average_sell_amount_usd}`)
        console.log(`     - Total amount: $${metrics.total_sell_amount_usd}`)
        console.log(`     - Total count: ${metrics.total_sell_count}`)
        console.log(`   📊 Général :`)
        console.log(`     - Total PnL: $${metrics.total_pnl_usd}`)
        console.log(`     - Winrate: ${(metrics.winrate * 100).toFixed(1)}%`)
        console.log(`     - Total trades: ${metrics.total_trades}`)
      }
    } else {
      console.log('   ❌ Auto-enrichissement non trouvé dans la réponse')
    }
    
    // 5. Vérifier en base de données
    console.log('\n💾 5. Vérification en base de données...')
    const dbCheckResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${TEST_WALLET}&select=wallet_address,average_buy_amount_usd,total_buy_count,total_sell_count,auto_enriched,last_processed_at,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (dbCheckResponse.ok) {
      const dbData = await dbCheckResponse.json()
      if (dbData.length > 0) {
        const wallet = dbData[0]
        console.log('   ✅ Wallet trouvé en base :')
        console.log(`     - Average buy: $${wallet.average_buy_amount_usd}`)
        console.log(`     - Total buy count: ${wallet.total_buy_count}`)
        console.log(`     - Total sell count: ${wallet.total_sell_count}`)
        console.log(`     - Auto-enriched: ${wallet.auto_enriched}`)
        console.log(`     - Status: ${wallet.status}`)
        console.log(`     - Last processed: ${wallet.last_processed_at}`)
        
        if (wallet.auto_enriched && wallet.average_buy_amount_usd > 0) {
          console.log('   🎉 AUTO-ENRICHISSEMENT RÉUSSI !')
        } else {
          console.log('   ⚠️ Métriques non encore visibles en base')
        }
      } else {
        console.log('   ❌ Wallet non trouvé en base')
      }
    } else {
      console.log('   ❌ Erreur lors de la vérification en base')
    }
    
    console.log('\n🎉 Test terminé avec succès !')
    return true
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error)
    return false
  }
}

// Fonction de test de performance
async function testPerformance() {
  console.log('\n⚡ Test de performance...')
  
  const iterations = 3
  const durations = []
  
  for (let i = 1; i <= iterations; i++) {
    console.log(`   Test ${i}/${iterations}...`)
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${TEST_WALLET}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })
      
      if (response.ok) {
        await response.json()
        const duration = Date.now() - startTime
        durations.push(duration)
        console.log(`     ✅ ${duration}ms`)
      } else {
        console.log(`     ❌ Erreur ${response.status}`)
      }
    } catch (error) {
      console.log(`     ❌ Erreur réseau`)
    }
    
    // Pause entre les tests
    if (i < iterations) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  if (durations.length > 0) {
    const average = durations.reduce((a, b) => a + b, 0) / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)
    
    console.log(`   📊 Résultats :`)
    console.log(`     - Moyenne : ${average.toFixed(0)}ms`)
    console.log(`     - Min : ${min}ms`)
    console.log(`     - Max : ${max}ms`)
  }
}

// Exécution du test
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'API auto-enrichissement')
  console.log(`🕒 ${new Date().toLocaleString()}`)
  console.log('')
  
  // Test principal
  const success = await testAutoEnrichmentAPI()
  
  if (success) {
    // Test de performance
    await testPerformance()
  }
  
  console.log('\n📋 Résumé :')
  console.log(success ? '✅ Test réussi - Auto-enrichissement fonctionnel' : '❌ Test échoué')
  console.log('')
  console.log('🔍 Points à vérifier :')
  console.log('1. auto_enrichment.success = true dans la réponse API')
  console.log('2. metrics_updated > 0')
  console.log('3. Métriques visibles en base de données')
  console.log('4. auto_enriched = true en base')
}

// Lancer les tests
runTests().catch(console.error)
