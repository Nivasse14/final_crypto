#!/usr/bin/env node

// Script pour analyser et corriger les métriques de market cap
const WALLET_ADDRESS = 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

// Définir les seuils de market cap
const MARKET_CAP_THRESHOLDS = {
  MICRO: 1000000,       // < 1M USD
  LOW: 10000000,        // 1M - 10M USD  
  MIDDLE: 100000000,    // 10M - 100M USD
  LARGE: 1000000000,    // 100M - 1B USD
  MEGA: 1000000000      // > 1B USD
};

function categorizeMarketCap(marketCap) {
  if (!marketCap || marketCap <= 0) return 'unknown';
  if (marketCap < MARKET_CAP_THRESHOLDS.MICRO) return 'micro';
  if (marketCap < MARKET_CAP_THRESHOLDS.LOW) return 'low';
  if (marketCap < MARKET_CAP_THRESHOLDS.MIDDLE) return 'middle';
  if (marketCap < MARKET_CAP_THRESHOLDS.LARGE) return 'large';
  return 'mega';
}

async function analyzeMarketCapDiscrepancy() {
  console.log('🔍 Analyse des discordances de market cap pour:', WALLET_ADDRESS);
  
  try {
    // Récupérer les données du wallet
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${WALLET_ADDRESS}&select=*`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    const dbData = await dbResponse.json();
    if (dbData.length === 0) {
      console.log('❌ Wallet not found');
      return;
    }
    
    const record = dbData[0];
    
    console.log('\n📊 Métriques actuelles en base:');
    console.log('- dexscreener_tokens_with_market_cap:', record.dexscreener_tokens_with_market_cap);
    console.log('- pnl_low_cap_count:', record.pnl_low_cap_count);
    console.log('- pnl_middle_cap_count:', record.pnl_middle_cap_count);
    console.log('- pnl_large_cap_count:', record.pnl_large_cap_count);
    console.log('- pnl_mega_cap_count:', record.pnl_mega_cap_count);
    console.log('- pnl_unknown_cap_count:', record.pnl_unknown_cap_count);
    console.log('- pnl_total_analyzed_count:', record.pnl_total_analyzed_count);
    
    const oldTotal = (record.pnl_low_cap_count || 0) + (record.pnl_middle_cap_count || 0) + 
                    (record.pnl_large_cap_count || 0) + (record.pnl_mega_cap_count || 0) + 
                    (record.pnl_unknown_cap_count || 0);
    
    console.log('- Somme des caps (ancien système):', oldTotal);
    
    // Analyser les données DexScreener
    if (!record.cielo_complete_data?.enriched_pnl) {
      console.log('❌ Pas de données DexScreener enrichies');
      return;
    }
    
    const enrichedTokens = record.cielo_complete_data.enriched_pnl.enriched_tokens;
    console.log('\n🔍 Analyse des tokens DexScreener:');
    console.log('- Total tokens enrichis:', enrichedTokens.length);
    
    // Analyser les market caps DexScreener
    const dexscreenerCaps = {
      micro: 0,
      low: 0,
      middle: 0,
      large: 0,
      mega: 0,
      unknown: 0,
      total_with_data: 0
    };
    
    enrichedTokens.forEach((token, index) => {
      const marketCap = token.dexscreener_data?.financial_data?.market_cap;
      
      if (index < 10) { // Afficher les 10 premiers pour debug
        console.log(`Token ${index + 1}: ${token.token_symbol || token.symbol} - Market cap: ${marketCap ? `$${marketCap.toLocaleString()}` : 'N/A'}`);
      }
      
      if (marketCap && marketCap > 0) {
        dexscreenerCaps.total_with_data++;
        const category = categorizeMarketCap(marketCap);
        dexscreenerCaps[category]++;
      } else {
        dexscreenerCaps.unknown++;
      }
    });
    
    console.log('\n📊 Nouvelles métriques DexScreener calculées:');
    console.log('- Micro cap (< $1M):', dexscreenerCaps.micro);
    console.log('- Low cap ($1M - $10M):', dexscreenerCaps.low);
    console.log('- Middle cap ($10M - $100M):', dexscreenerCaps.middle);
    console.log('- Large cap ($100M - $1B):', dexscreenerCaps.large);
    console.log('- Mega cap (> $1B):', dexscreenerCaps.mega);
    console.log('- Unknown/No data:', dexscreenerCaps.unknown);
    console.log('- Total avec market cap:', dexscreenerCaps.total_with_data);
    
    const newTotal = dexscreenerCaps.micro + dexscreenerCaps.low + dexscreenerCaps.middle + 
                    dexscreenerCaps.large + dexscreenerCaps.mega + dexscreenerCaps.unknown;
    
    console.log('- Somme totale (nouveau système):', newTotal);
    
    console.log('\n⚖️ Comparaison:');
    console.log(`Ancien total analysé: ${record.pnl_total_analyzed_count || 0}`);
    console.log(`DexScreener total: ${enrichedTokens.length}`);
    console.log(`DexScreener avec market cap: ${record.dexscreener_tokens_with_market_cap}`);
    console.log(`Calculé avec market cap: ${dexscreenerCaps.total_with_data}`);
    
    // Proposer mise à jour
    console.log('\n🔧 Mise à jour recommandée:');
    const updateData = {
      // Nouvelles colonnes DexScreener spécifiques
      dexscreener_micro_cap_count: dexscreenerCaps.micro,
      dexscreener_low_cap_count: dexscreenerCaps.low,
      dexscreener_middle_cap_count: dexscreenerCaps.middle,
      dexscreener_large_cap_count: dexscreenerCaps.large,
      dexscreener_mega_cap_count: dexscreenerCaps.mega,
      dexscreener_unknown_cap_count: dexscreenerCaps.unknown,
      dexscreener_total_analyzed_count: newTotal
    };
    
    console.log('Nouvelles colonnes à ajouter:', JSON.stringify(updateData, null, 2));
    
    // Identifier la source de la discordance
    console.log('\n🎯 Source de la discordance:');
    console.log('Les colonnes pnl_*_cap_count utilisent probablement les données Cielo originales');
    console.log('Les colonnes dexscreener_*_cap_count devraient utiliser les données DexScreener');
    console.log('Il faut soit :');
    console.log('1. Créer de nouvelles colonnes spécifiques DexScreener');
    console.log('2. Ou mettre à jour le système existant pour utiliser DexScreener');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeMarketCapDiscrepancy();
