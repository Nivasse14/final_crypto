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

async function saveTokensToDatabase(walletAddress: string, tokensData: any[]) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`💾 Sauvegarde simplifiée de ${tokensData.length} tokens pour ${walletAddress}`);
  
  try {
    // 1. D'abord créer ou mettre à jour le wallet dans wallets_extended
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
      // Continuer même si erreur (la table peut ne pas exister)
    } else {
      console.log(`✅ Wallet ${walletAddress} créé/mis à jour`);
    }

    // 2. Préparer les tokens avec tous les champs importants
    const tokenRecords = tokensData.map(token => ({
      wallet_address: walletAddress,
      token_address: token.token_address,
      token_symbol: token.symbol || token.token_symbol || null,
      token_name: token.name || token.token_name || null,
      chain: 'solana',
      
      // PnL et financier - mapping correct selon les données reçues
      pnl: token.total_pnl_usd || token.pnl_usd || 0,
      current_price_usd: token.price_usd || token.gecko_price_usd || token.token_price_usd || 0,
      market_cap_usd: token.market_cap_usd || token.fdv_usd || null,
      
      // Trading stats
      balance: token.holding_amount || 0,
      value_usd: token.holding_amount_usd || 0,
      pnl_percentage: token.roi_percentage || 0,
      
      // Prix moyens
      buy_price_avg: token.average_buy_price || 0,
      avg_sell_price: token.average_sell_price || 0,
      
      // Stats de trading
      token_trade_count: token.num_swaps || 0,
      token_total_pnl: token.total_pnl_usd || 0,
      
      // Enrichissement GeckoTerminal
      geckoterminal_enriched: !!token.gecko_enriched || !!token.gecko_price_usd,
      gt_price_usd: token.price_usd || token.gecko_price_usd || null,
      gt_market_cap_usd: token.market_cap_usd || null,
      // Note: gt_score peut nécessiter une conversion ou être stocké dans un autre champ
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 3. Supprimer les anciens tokens pour ce wallet
    const { error: deleteError } = await supabase
      .from('wallet_tokens_extended')
      .delete()
      .eq('wallet_address', walletAddress);
    
    if (deleteError) {
      console.log('⚠️ Erreur suppression tokens:', deleteError.message);
    }

    // 4. Insérer les nouveaux tokens
    const { data, error } = await supabase
      .from('wallet_tokens_extended')
      .insert(tokenRecords);

    if (error) {
      console.error('❌ Erreur sauvegarde:', error.message);
      console.error('❌ Détails:', error.details);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ ${tokenRecords.length} tokens sauvegardés avec succès`);
    return { success: true, count: tokenRecords.length };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { walletAddress, tokensData } = await req.json();
    
    if (!walletAddress || !tokensData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'walletAddress et tokensData requis'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
    console.error('❌ Erreur handler:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
