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
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

async function ensureTokensTableExists() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Vérifier si la table existe
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'wallet_tokens_extended')
    .eq('table_schema', 'public');
    
  if (tableError) {
    console.log('⚠️ Erreur lors de la vérification de table:', tableError.message);
  }
  
  if (!tables || tables.length === 0) {
    console.log('📋 Création de la table wallet_tokens_extended...');
    
    // Créer la table via RPC/SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.wallet_tokens_extended (
        id bigserial not null,
        wallet_address character varying(100) null,
        token_address character varying(100) not null,
        token_symbol character varying(50) null,
        token_name character varying(200) null,
        token_decimals integer null,
        chain character varying(20) null default 'solana'::character varying,
        balance numeric(30, 8) null,
        pnl numeric(20, 8) null,
        pnl_percentage numeric(8, 4) null,
        current_price_usd numeric(20, 10) null,
        gt_price_usd numeric(20, 10) null,
        market_cap_usd numeric(20, 2) null,
        total_supply numeric null,
        geckoterminal_enriched boolean null default false,
        created_at timestamp with time zone null default now(),
        updated_at timestamp with time zone null default now(),
        token_total_pnl numeric null,
        token_trade_count integer null,
        token_win_rate numeric null,
        data_source text null default 'cielo_api'::text,
        raw_token_data jsonb null,
        raw_token_data jsonb null,
        raw_gecko_data jsonb null,
        CONSTRAINT wallet_tokens_extended_pkey PRIMARY KEY (id),
        CONSTRAINT wallet_tokens_extended_wallet_address_token_address_key UNIQUE (wallet_address, token_address)
      );
      
      CREATE INDEX IF NOT EXISTS idx_tokens_ext_wallet ON public.wallet_tokens_extended USING btree (wallet_address);
      CREATE INDEX IF NOT EXISTS idx_tokens_ext_token ON public.wallet_tokens_extended USING btree (token_address);
      CREATE INDEX IF NOT EXISTS idx_tokens_ext_pnl ON public.wallet_tokens_extended USING btree (pnl DESC);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.log('❌ Erreur création table:', createError.message);
      return false;
    }
    
    console.log('✅ Table wallet_tokens_extended créée avec succès');
  } else {
    console.log('✅ Table wallet_tokens_extended existe déjà');
  }
  
  return true;
}

async function saveTokensToDatabase(walletAddress: string, tokensData: any[]) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`💾 Sauvegarde de ${tokensData.length} tokens pour ${walletAddress}`);
  
  try {
    // 1. D'abord, s'assurer que le wallet existe dans wallets_extended
    const { error: walletError } = await supabase
      .from('wallets_extended')
      .upsert({
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });
    
    if (walletError) {
      console.log('⚠️ Erreur création wallet:', walletError.message);
    } else {
      console.log(`✅ Wallet ${walletAddress} créé/mis à jour`);
    }
    
    // 2. Préparer les tokens avec toutes les colonnes pertinentes du schéma
    const tokenRecords = tokensData.map(token => ({
      // Colonnes de base - OBLIGATOIRES selon le schéma
      wallet_address: walletAddress,
      token_address: token.token_address,
      token_symbol: token.token_symbol || null,
      token_name: token.token_name || null,
      token_decimals: token.token_decimals || null,
      chain: token.chain || 'solana',
      
      // Données financières de base
      balance: token.holding_amount || token.balance || 0,
      current_balance: token.holding_amount || token.balance || 0,
      value_usd: token.holding_amount_usd || token.value_usd || 0,
      current_value_usd: token.holding_amount_usd || token.value_usd || 0,
      
      // PnL et performances 
      pnl: token.total_pnl_usd || 0,
      pnl_usd: token.total_pnl_usd || 0,
      pnl_percentage: token.roi_percentage || 0,
      unrealized_pnl: token.unrealized_pnl_usd || 0,
      realized_pnl: token.total_pnl_usd || 0,
      
      // Prix
      current_price_usd: token.token_price_usd || 0,
      token_price_usd: token.token_price_usd || 0,
      avg_buy_price: token.average_buy_price || 0,
      avg_sell_price: token.average_sell_price || 0,
      buy_price_avg: token.average_buy_price || 0,
      
      // Market cap et supply
      market_cap_usd: token.gecko_market_cap_usd || null,
      total_supply: token.gecko_total_supply || null,
      circulating_supply: token.gecko_circulating_supply || null,
      
      // Geckoterminal enrichment
      gt_price_usd: token.gecko_price_usd || null,
      gt_market_cap_usd: token.gecko_market_cap_usd || null,
      gt_total_supply: token.gecko_total_supply || null,
      gt_volume_24h_usd: token.gecko_volume_24h || null,
      gt_enriched: !!token.gecko_price_usd,
      geckoterminal_enriched: !!token.gecko_price_usd,
      
      // Trading stats
      token_total_pnl: token.total_pnl_usd || 0,
      token_trade_count: token.num_swaps || 0,
      buy_count: token.num_swaps || 0,
      sell_count: token.num_swaps || 0,
      total_buy_amount: token.total_buy_amount || 0,
      total_sell_amount: token.total_sell_amount || 0,
      token_win_rate: token.roi_percentage > 0 ? 1 : 0,
      
      // Timestamps trading
      first_buy_timestamp: token.first_trade || null,
      last_sell_timestamp: token.last_trade || null,
      
      // Données brutes - simplifié pour éviter les erreurs de schéma
      token_metadata: JSON.stringify(token),
      
      // Métadonnées
      data_source: 'cielo_api_trpc_complete',
      enrichment_source: 'geckoterminal',
      enrichment_success: !!token.gecko_price_usd,
      enrichment_timestamp: new Date().toISOString(),
      data_version: 2,
      
      // Timestamps système
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
      last_updated_api: new Date().toISOString()
    }));
    
    // 3. Supprimer les anciens tokens pour ce wallet
    const { error: deleteError } = await supabase
      .from('wallet_tokens_extended')
      .delete()
      .eq('wallet_address', walletAddress);
      
    if (deleteError) {
      console.log('⚠️ Erreur suppression anciens tokens:', deleteError.message);
    } else {
      console.log(`🗑️ Anciens tokens supprimés pour ${walletAddress}`);
    }
    
    // 4. Insérer les nouveaux tokens
    const { data, error } = await supabase
      .from('wallet_tokens_extended')
      .insert(tokenRecords);
      
    if (error) {
      console.error('❌ Erreur insertion tokens:', error.message);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Détails:', error.details);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ ${tokenRecords.length} tokens sauvegardés avec succès`);
    return { success: true, count: tokenRecords.length };
    
  } catch (error) {
    console.error('❌ Erreur générale sauvegarde:', error.message);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    
    // Sauvegarder les tokens directement
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
