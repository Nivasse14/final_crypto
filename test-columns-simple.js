const https = require('https')

const options = {
  hostname: 'xkndddxqqlxqknbqtefv.supabase.co',
  port: 443,
  path: '/rest/v1/wallet_registry?wallet_address=eq.7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5&select=wallet_address,dexscreener_tokens_with_market_cap,dexscreener_micro_cap_count',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
    'Content-Type': 'application/json'
  }
}

console.log('🔍 Testing database columns existence...')

const req = https.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`)
    
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data)
        console.log('✅ API Response:', JSON.stringify(result, null, 2))
        
        if (result && result.length > 0) {
          const wallet = result[0]
          console.log('\n📊 Wallet data:')
          console.log(`- wallet_address: ${wallet.wallet_address}`)
          console.log(`- dexscreener_tokens_with_market_cap: ${wallet.dexscreener_tokens_with_market_cap}`)
          console.log(`- dexscreener_micro_cap_count: ${wallet.dexscreener_micro_cap_count || 'undefined'}`)
          
          if (wallet.dexscreener_micro_cap_count === undefined) {
            console.log('\n❌ ISSUE CONFIRMED: New market cap columns do not exist!')
            console.log('✅ SOLUTION: Need to create the columns first')
          }
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error)
        console.log('Raw response:', data)
      }
    } else {
      console.error('❌ API Error:', res.statusCode)
      console.log('Response:', data)
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Request error:', error)
})

req.setTimeout(10000, () => {
  console.error('❌ Request timeout')
  req.destroy()
})

req.end()
