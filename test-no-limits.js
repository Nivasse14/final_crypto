#!/usr/bin/env node

// Script de test pour valider que toutes les limitations DexScreener ont été supprimées
// dans l'API Edge Function /cielo-api/index.ts

import fs from 'fs'
import path from 'path'

const EDGE_FUNCTION_PATH = './supabase/functions/cielo-api/index.ts'

console.log('🔍 Testing NO LIMITS Configuration in Cielo API Edge Function\n')

if (!fs.existsSync(EDGE_FUNCTION_PATH)) {
  console.error('❌ Edge Function file not found:', EDGE_FUNCTION_PATH)
  process.exit(1)
}

const code = fs.readFileSync(EDGE_FUNCTION_PATH, 'utf8')

// Tests de configuration sans limitation
const tests = [
  {
    name: 'Portfolio Batch Size ≥ 15',
    pattern: /batchSize = (\d+)/g,
    validator: (matches) => {
      // Le premier batchSize dans le fichier est pour portfolio (ligne ~938)
      if (matches.length === 0) return { pass: false, reason: 'No batchSize found' }
      const size = parseInt(matches[0][1])
      return { pass: size >= 15, reason: `Portfolio batchSize = ${size}`, value: size }
    }
  },
  
  {
    name: 'PnL Batch Size ≥ 10',
    pattern: /batchSize = (\d+)/g,
    validator: (matches) => {
      // Le second batchSize dans le fichier est pour PnL (ligne ~1006)
      if (matches.length < 2) return { pass: false, reason: 'PnL batchSize not found' }
      const size = parseInt(matches[1][1])
      return { pass: size >= 10, reason: `PnL batchSize = ${size}`, value: size }
    }
  },
  
  {
    name: 'NO maxTokens Parameter in enrichPnLTokens',
    pattern: /async function enrichPnLTokens\([^)]*maxTokens/g,
    validator: (matches) => {
      return { pass: matches.length === 0, reason: matches.length > 0 ? 'maxTokens parameter still present' : 'maxTokens parameter removed' }
    }
  },
  
  {
    name: 'NO Hardcoded PnL Token Limit (slice(0, X))',
    pattern: /pnlTokens\.slice\(0,\s*\d+\)/g,
    validator: (matches) => {
      return { pass: matches.length === 0, reason: matches.length > 0 ? 'Hardcoded slice limit found' : 'No hardcoded slice limits' }
    }
  },
  
  {
    name: 'Portfolio Delay ≤ 100ms',
    pattern: /setTimeout\(resolve,\s*(\d+)\)/g,
    validator: (matches) => {
      const portfolioDelays = matches.filter(m => {
        const context = code.substring(Math.max(0, m.index - 200), m.index + 200)
        return context.includes('portfolioTokens') || context.includes('enrichPortfolioTokens')
      })
      
      if (portfolioDelays.length === 0) return { pass: true, reason: 'No portfolio delays found' }
      
      const delays = portfolioDelays.map(m => parseInt(m[1]))
      const maxDelay = Math.max(...delays)
      return { pass: maxDelay <= 100, reason: `Max portfolio delay = ${maxDelay}ms`, value: maxDelay }
    }
  },
  
  {
    name: 'PnL Delay ≤ 100ms',
    pattern: /setTimeout\(resolve,\s*(\d+)\)/g,
    validator: (matches) => {
      const pnlDelays = matches.filter(m => {
        const context = code.substring(Math.max(0, m.index - 200), m.index + 200)
        return context.includes('tokensToProcess') || context.includes('enrichPnLTokens')
      })
      
      if (pnlDelays.length === 0) return { pass: true, reason: 'No PnL delays found' }
      
      const delays = pnlDelays.map(m => parseInt(m[1]))
      const maxDelay = Math.max(...delays)
      return { pass: maxDelay <= 100, reason: `Max PnL delay = ${maxDelay}ms`, value: maxDelay }
    }
  },
  
  {
    name: 'Cielo Delays ≤ 1000ms',
    pattern: /setTimeout\(resolve,\s*(\d+)\)/g,
    validator: (matches) => {
      const cieloDelays = matches.filter(m => {
        const context = code.substring(Math.max(0, m.index - 200), m.index + 200)
        return context.includes('Cielo') || context.includes('tRPCRequest') || context.includes('portfolio') && !context.includes('DexScreener')
      })
      
      if (cieloDelays.length === 0) return { pass: true, reason: 'No Cielo delays found' }
      
      const delays = cieloDelays.map(m => parseInt(m[1]))
      const maxDelay = Math.max(...delays)
      return { pass: maxDelay <= 1000, reason: `Max Cielo delay = ${maxDelay}ms`, value: maxDelay }
    }
  },
  
  {
    name: 'ALL PnL Tokens Processed (no slice limits)',
    pattern: /enrichPnLTokens\(pnlTokens(?:,\s*\d+)?\)/g,
    validator: (matches) => {
      const hasLimitCall = matches.some(m => m[0].includes(','))
      return { pass: !hasLimitCall, reason: hasLimitCall ? 'PnL limit parameter found in call' : 'No PnL limit in function call' }
    }
  }
]

let allTestsPassed = true
let totalScore = 0

tests.forEach((test, index) => {
  const matches = [...code.matchAll(test.pattern)]
  const result = test.validator(matches)
  
  const status = result.pass ? '✅' : '❌'
  const scorePoints = result.pass ? 1 : 0
  totalScore += scorePoints
  
  console.log(`${status} ${test.name}`)
  console.log(`   ${result.reason}`)
  if (result.value !== undefined) {
    console.log(`   Value: ${result.value}`)
  }
  console.log()
  
  if (!result.pass) allTestsPassed = false
})

// Score et résumé final
const scorePercentage = Math.round((totalScore / tests.length) * 100)

console.log('=' .repeat(60))
console.log(`🎯 NO LIMITS CONFIGURATION SCORE: ${totalScore}/${tests.length} (${scorePercentage}%)`)

if (allTestsPassed) {
  console.log('🚀 EXCELLENT! All limitations have been successfully removed!')
  console.log('   - Maximum batch sizes configured')
  console.log('   - Minimal delays for optimal performance')
  console.log('   - No artificial token limits')
  console.log('   - All PnL tokens will be processed')
  console.log('\n✅ The API is now configured for MAXIMUM DexScreener enrichment!')
} else {
  console.log('⚠️  Some limitations are still present. Review the failed tests above.')
}

console.log('=' .repeat(60))

// Statistiques supplémentaires
const codeMetrics = {
  total_lines: code.split('\n').length,
  dexscreener_mentions: (code.match(/DexScreener/g) || []).length,
  batch_configurations: (code.match(/batchSize\s*=/g) || []).length,
  timeout_configurations: (code.match(/setTimeout/g) || []).length
}

console.log('\n📊 CODE METRICS:')
console.log(`   Total lines: ${codeMetrics.total_lines}`)
console.log(`   DexScreener mentions: ${codeMetrics.dexscreener_mentions}`)
console.log(`   Batch configurations: ${codeMetrics.batch_configurations}`)
console.log(`   Timeout configurations: ${codeMetrics.timeout_configurations}`)

process.exit(allTestsPassed ? 0 : 1)
