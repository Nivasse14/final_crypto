const https = require('https')

// Configuration Supabase
const SUPABASE_URL = 'xkndddxqqlxqknbqtefv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    })

    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: data })
        } else {
          reject({ success: false, status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      reject({ success: false, error: error })
    })

    req.write(postData)
    req.end()
  })
}

async function testColumnExists() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/wallet_registry?select=dexscreener_micro_cap_count&limit=1',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true)
        } else if (res.statusCode === 400 && data.includes('column')) {
          resolve(false)
        } else {
          reject({ status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })

    req.end()
  })
}

async function createColumns() {
  console.log('🔍 Checking if DexScreener market cap columns exist...')
  
  try {
    const columnsExist = await testColumnExists()
    
    if (columnsExist) {
      console.log('✅ Columns already exist!')
      return true
    }
    
    console.log('❌ Columns do not exist. Creating them...')
    
    // SQL pour créer les colonnes
    const createColumnsSql = `
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_micro_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_low_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_middle_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_large_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_mega_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_unknown_cap_count INTEGER DEFAULT 0;
      ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_total_analyzed_count INTEGER DEFAULT 0;
    `
    
    console.log('📝 Executing SQL to create columns...')
    
    try {
      const result = await executeSQL(createColumnsSql)
      console.log('✅ Columns created successfully!')
      console.log('Result:', result)
      return true
    } catch (error) {
      console.log('❌ Could not create columns via API. Manual creation needed.')
      console.log('Error:', error)
      
      console.log('\n📋 MANUAL ACTION REQUIRED:')
      console.log('=========================')
      console.log('Please execute the following SQL in the Supabase SQL Editor:')
      console.log('')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_micro_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_low_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_middle_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_large_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_mega_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_unknown_cap_count INTEGER DEFAULT 0;')
      console.log('ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS dexscreener_total_analyzed_count INTEGER DEFAULT 0;')
      console.log('')
      console.log('Then run this script again to verify.')
      
      return false
    }
    
  } catch (error) {
    console.error('❌ Error checking columns:', error)
    return false
  }
}

createColumns().then(success => {
  if (success) {
    console.log('\n🎉 Migration completed successfully!')
    console.log('The new DexScreener market cap columns are now available.')
    console.log('\n📝 Next steps:')
    console.log('1. Re-process a wallet to populate the new columns')
    console.log('2. Verify the data consistency')
  } else {
    console.log('\n⚠️ Migration needs manual intervention.')
  }
}).catch(error => {
  console.error('❌ Migration failed:', error)
})
