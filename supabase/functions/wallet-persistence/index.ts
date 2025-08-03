// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Configuration Supabase (interne)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU0ODc4NSwiZXhwIjoyMDY5MTI0Nzg1fQ.4LqB7Kb-aLYBu0HhwjKaAGhSjE-HqpBN8UaBAcn7_z8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Vérifier si un wallet existe en base de données
 */
async function checkWalletExists(walletAddress: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('wallet_registry')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Erreur lors de la vérification du wallet ${walletAddress}:`, error);
    return null;
  }
}

/**
 * Sauvegarder les données de portfolio en base
 */
async function saveWalletData(walletAddress: string, cieloData: any): Promise<{ success: boolean, action: string, data?: any, error?: string }> {
  try {
    console.log(`💾 [DB] Sauvegarde des données pour ${walletAddress}`);

    // Vérifier si le wallet existe
    const existingWallet = await checkWalletExists(walletAddress);
    
    if (existingWallet) {
      console.log(`🔄 [DB] Wallet existant trouvé, mise à jour...`);
      
      // Mettre à jour les données existantes
      const updateData = {
        total_pnl_usd: cieloData.portfolio?.total_pnl_usd || existingWallet.total_pnl_usd || 0,
        total_bought_usd: cieloData.stats?.total_bought_usd || existingWallet.total_bought_usd || 0,
        roi: cieloData.stats?.total_roi_percentage || existingWallet.roi || 0,
        winrate: cieloData.stats?.winrate || existingWallet.winrate || 0,
        tokens_traded: cieloData.stats?.tokens_traded || existingWallet.tokens_traded || 0,
        wins: cieloData.stats?.wins || existingWallet.wins || 0,
        losses: cieloData.stats?.losses || existingWallet.losses || 0,
        trade_count: cieloData.stats?.trade_count || existingWallet.trade_count || 0,
        last_trade_date: cieloData.stats?.last_trade_date || existingWallet.last_trade_date,
        source: 'CIELO_API',
        status: 'updated',
        updated_at: new Date().toISOString(),
        last_processed_at: new Date().toISOString(),
        processing_attempts: (existingWallet.processing_attempts || 0) + 1,
        metadata: {
          ...existingWallet.metadata,
          last_update_source: 'CIELO_API',
          endpoints_called: cieloData.endpoints_called || [],
          tokens_pnl_count: cieloData.tokens_pnl?.tokens_count || 0,
          enriched_tokens_count: cieloData.tokens_pnl?.enriched_tokens_count || 0
        }
      };

      const { data, error } = await supabase
        .from('wallet_registry')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      return { success: true, action: 'updated', data };

    } else {
      console.log(`➕ [DB] Nouveau wallet, création...`);
      
      // Créer un nouveau wallet
      const insertData = {
        wallet_address: walletAddress,
        total_pnl_usd: cieloData.portfolio?.total_pnl_usd || 0,
        total_bought_usd: cieloData.stats?.total_bought_usd || 0,
        roi: cieloData.stats?.total_roi_percentage || 0,
        winrate: cieloData.stats?.winrate || 0,
        tokens_traded: cieloData.stats?.tokens_traded || 0,
        wins: cieloData.stats?.wins || 0,
        losses: cieloData.stats?.losses || 0,
        trade_count: cieloData.stats?.trade_count || 0,
        last_trade_date: cieloData.stats?.last_trade_date,
        source: 'CIELO_API',
        status: 'created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        processing_attempts: 1,
        last_processed_at: new Date().toISOString(),
        metadata: {
          first_analysis_source: 'CIELO_API',
          endpoints_called: cieloData.endpoints_called || [],
          tokens_pnl_count: cieloData.tokens_pnl?.tokens_count || 0,
          enriched_tokens_count: cieloData.tokens_pnl?.enriched_tokens_count || 0
        }
      };

      const { data, error } = await supabase
        .from('wallet_registry')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, action: 'created', data };
    }

  } catch (error) {
    console.error(`❌ [DB] Erreur sauvegarde wallet ${walletAddress}:`, error);
    return { success: false, action: 'error', error: error.message };
  }
}

/**
 * Sauvegarder les tokens du portfolio
 */
async function saveWalletTokens(walletAddress: string, tokens: any[]): Promise<{ success: boolean, saved: number, errors: number }> {
  try {
    if (!tokens || tokens.length === 0) {
      return { success: true, saved: 0, errors: 0 };
    }

    console.log(`💾 [TOKENS] Sauvegarde de ${tokens.length} tokens pour ${walletAddress}`);

    // Supprimer les anciens tokens pour ce wallet
    await supabase
      .from('wallet_tokens')
      .delete()
      .eq('wallet_address', walletAddress);

    // Préparer les données de tokens
    const tokenData = tokens.map(token => ({
      wallet_address: walletAddress,
      token_address: token.token_address || token.address,
      token_symbol: token.token_symbol || token.symbol,
      token_name: token.token_name || token.name,
      balance: parseFloat(token.balance || token.holding_amount || 0),
      token_price_usd: parseFloat(token.gecko_price_usd || token.token_price_usd || 0),
      total_usd_value: parseFloat(token.total_usd_value || token.holding_amount_usd || 0),
      portfolio_weight_pct: parseFloat(token.portfolio_weight_pct || 0),
      price_change_24h: parseFloat(token.price_change_24h || 0),
      pnl: parseFloat(token.total_pnl_usd || token.pnl || 0),
      pnl_percentage: parseFloat(token.roi_percentage || token.pnl_percentage || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insérer par chunks pour éviter les timeouts
    const chunkSize = 50;
    let saved = 0;
    let errors = 0;

    for (let i = 0; i < tokenData.length; i += chunkSize) {
      const chunk = tokenData.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from('wallet_tokens')
        .insert(chunk);

      if (error) {
        console.error(`❌ [TOKENS] Erreur chunk ${i}:`, error);
        errors += chunk.length;
      } else {
        saved += chunk.length;
      }
    }

    console.log(`✅ [TOKENS] ${saved} tokens sauvegardés, ${errors} erreurs`);
    return { success: errors === 0, saved, errors };

  } catch (error) {
    console.error(`❌ [TOKENS] Erreur sauvegarde tokens:`, error);
    return { success: false, saved: 0, errors: tokens.length };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'save';
    const walletAddress = url.searchParams.get('wallet');

    if (!walletAddress) {
      return new Response(JSON.stringify({
        error: 'wallet parameter is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check') {
      // Vérifier si le wallet existe
      const existingWallet = await checkWalletExists(walletAddress);
      
      return new Response(JSON.stringify({
        wallet_address: walletAddress,
        exists: !!existingWallet,
        data: existingWallet,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'save' && req.method === 'POST') {
      // Sauvegarder les données reçues
      const body = await req.json();
      
      const walletResult = await saveWalletData(walletAddress, body);
      
      let tokensResult = { success: true, saved: 0, errors: 0 };
      if (body.tokens_pnl?.data?.json?.data?.tokens) {
        tokensResult = await saveWalletTokens(
          walletAddress, 
          body.tokens_pnl.data.json.data.tokens
        );
      }

      return new Response(JSON.stringify({
        wallet_address: walletAddress,
        wallet_save: walletResult,
        tokens_save: tokensResult,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use ?action=check or POST with ?action=save'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
