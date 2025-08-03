// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU0ODc4NSwiZXhwIjoyMDY5MTI0Nzg1fQ.GZNjUHD3l22d9OmP62AQLP8mD7y3EfSqZOkuZlT3A8Y';

async function getTableInfo() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔍 Vérification de la structure de la table wallet_tokens_extended...');
  
  try {
    // Vérifier si la table existe en tentant de la sélectionner
    const { data, error } = await supabase
      .from('wallet_tokens_extended')
      .select('*')
      .limit(0);
    
    if (error) {
      return {
        success: false,
        table_exists: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
    
    // Compter les enregistrements existants
    const { count, error: countError } = await supabase
      .from('wallet_tokens_extended')
      .select('*', { count: 'exact', head: true });
    
    return {
      success: true,
      table_exists: true,
      total_rows: count || 0,
      info: "Table wallet_tokens_extended accessible",
      migration_status: "Structure étendue avec toutes les colonnes d'enrichissement",
      timestamp: new Date().toISOString()
    };
    
  } catch (err) {
    return {
      success: false,
      table_exists: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function saveTokensToDatabase(walletAddress: string, tokensData: any[]) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`💾 Sauvegarde de ${tokensData.length} tokens pour ${walletAddress}`);
  
  const tokenRecords = tokensData.map(token => ({
    wallet_address: walletAddress,
    token_address: token.token_address || token.address,
    token_symbol: token.token_symbol || token.symbol,
    token_name: token.token_name || token.name,
    token_id: token.id || null,
    token_network: token.network || 'solana',
    chain: token.chain || 'solana',
    balance: token.balance || 0,
    current_balance: token.current_balance || token.balance || 0,
    current_value_usd: token.current_value_usd || token.value_usd || 0,
    pnl: token.total_pnl_usd || token.pnl_usd || 0,
    pnl_usd: token.pnl_usd || token.total_pnl_usd || 0,
    pnl_percentage: token.roi_percentage || token.pnl_percentage || 0,
    current_price_usd: token.token_price_usd || token.current_price_usd || 0,
    token_price_usd: token.token_price_usd || 0,
    
    // Données Geckoterminal enrichies
    gt_price_usd: token.gecko_price_usd || token.gt_price_usd || null,
    gt_name: token.gecko_name || token.gt_name || null,
    gt_symbol: token.gecko_symbol || token.gt_symbol || null,
    gt_market_cap_usd: token.gecko_market_cap_usd || token.gt_market_cap_usd || null,
    gt_calculated_market_cap_usd: token.gecko_calculated_market_cap_usd || null,
    gt_volume_24h_usd: token.gecko_volume_24h || token.gt_volume_24h_usd || null,
    gt_price_change_1h: token.gecko_price_change_1h || null,
    gt_price_change_24h: token.gecko_price_change_24h || null,
    gt_price_change_7d: token.gecko_price_change_7d || null,
    gt_total_supply: token.gecko_total_supply || token.gt_total_supply || null,
    gt_circulating_supply: token.gecko_circulating_supply || null,
    gt_pool_liquidity_usd: token.gecko_pool_liquidity_usd || null,
    
    // Pool data
    pool_id: token.pool_id || null,
    pool_address: token.pool_address || null,
    pool_base_token_price_usd: token.pool_base_token_price_usd || null,
    pool_quote_token_price_usd: token.pool_quote_token_price_usd || null,
    pool_price_change_percentage_5m: token.pool_price_change_percentage_5m || null,
    pool_price_change_percentage_1h: token.pool_price_change_percentage_1h || null,
    pool_price_change_percentage_6h: token.pool_price_change_percentage_6h || null,
    pool_price_change_percentage_24h: token.pool_price_change_percentage_24h || null,
    
    // Security data
    security_is_open_source: token.security_is_open_source || null,
    security_is_proxy: token.security_is_proxy || null,
    security_is_mintable: token.security_is_mintable || null,
    security_buy_tax: token.security_buy_tax || null,
    security_sell_tax: token.security_sell_tax || null,
    security_is_blacklisted: token.security_is_blacklisted || null,
    security_is_whitelisted: token.security_is_whitelisted || null,
    security_fake_token: token.security_fake_token || null,
    
    // Holders data
    holders_holder_count: token.holders_holder_count || token.holder_count || null,
    holders_total_supply: token.holders_total_supply || token.total_supply || null,
    
    // Métadonnées d'enrichissement
    geckoterminal_enriched: !!token.gecko_price_usd,
    gt_enriched: !!token.gecko_price_usd,
    enrichment_source: 'geckoterminal',
    enrichment_success: !!token.gecko_price_usd,
    enrichment_timestamp: new Date().toISOString(),
    
    // Stats de trading
    token_total_pnl: token.total_pnl_usd || 0,
    token_trade_count: token.num_swaps || token.trade_count || 0,
    token_win_rate: token.roi_percentage > 0 ? 1 : 0,
    buy_count: token.buy_count || 0,
    sell_count: token.sell_count || 0,
    
    // Données brutes
    data_source: 'cielo_api_trpc_v2',
    raw_trpc_data: token,
    raw_token_data: JSON.stringify(token),
    raw_gecko_data: token.gecko_price_usd ? {
      price_usd: token.gecko_price_usd,
      market_cap_usd: token.gecko_market_cap_usd,
      volume_24h: token.gecko_volume_24h,
      total_supply: token.gecko_total_supply,
      enriched_at: new Date().toISOString()
    } : null,
    raw_geckoterminal_data: token.gecko_price_usd ? token : null,
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sync: new Date().toISOString(),
    data_version: 2
  }));
  
  // Supprimer les anciens tokens pour ce wallet (upsert logic)
  const { error: deleteError } = await supabase
    .from('wallet_tokens_extended')
    .delete()
    .eq('wallet_address', walletAddress);
    
  if (deleteError) {
    console.log('⚠️ Erreur suppression anciens tokens:', deleteError.message);
  } else {
    console.log(`🗑️ Anciens tokens supprimés pour ${walletAddress}`);
  }
  
  // Insérer les nouveaux tokens
  const { data, error } = await supabase
    .from('wallet_tokens_extended')
    .insert(tokenRecords);
    
  if (error) {
    console.error('❌ Erreur insertion tokens:', error.message);
    return { success: false, error: error.message };
  }
  
  console.log(`✅ ${tokenRecords.length} tokens sauvegardés avec succès`);
  return { success: true, count: tokenRecords.length };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'save';
    
    // Si action = info, retourner les informations sur la table
    if (action === 'info') {
      const tableInfo = await getTableInfo();
      return new Response(JSON.stringify(tableInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Sinon, mode sauvegarde classique
    const { walletAddress, tokensData } = await req.json();
    
    if (!walletAddress || !tokensData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'wallet_address et tokens_data requis'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Sauvegarder les tokens
    const result = await saveTokensToDatabase(walletAddress, tokensData);
    
    return new Response(JSON.stringify({
      success: result.success,
      wallet_address: walletAddress,
      tokens_saved: result.count || 0,
      error: result.error || null,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
