// Edge Function principale pour l'enrichissement des wallets
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Client avec permissions élevées pour les opérations batch
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface WalletEnrichmentData {
  wallet_address: string
  gmgn_data?: any
  cielo_data?: any
  coingecko_data?: any
}

// Fonctions utilitaires (portées depuis votre api-gmgn.js)
function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  let str = String(value);
  str = str.replace(/[^0-9.-]/g, '');
  
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts[1];
  }
  
  const parsed = parseFloat(str);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }
  
  return parsed;
}

function safeTimestamp(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  let str = String(value).replace(/[^0-9.-]/g, '');
  
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts[1];
  }
  
  const parsed = parseFloat(str);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }
  
  return Math.round(parsed);
}

// Fonction pour enrichir via GMGN
async function fetchGMGNData(walletAddress: string) {
  try {
    console.log(`🔍 Fetching GMGN data for ${walletAddress}`);
    
    // Appel à votre fonction gmgn existante
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gmgn?address=${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`GMGN API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ GMGN data fetched for ${walletAddress}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching GMGN data for ${walletAddress}:`, error);
    return null;
  }
}

// Fonction pour enrichir un wallet complet
async function enrichWallet(walletAddress: string): Promise<any> {
  try {
    console.log(`🚀 Starting enrichment for ${walletAddress}`);
    
    // 1. Récupérer les données existantes
    const { data: existingWallet, error: fetchError } = await supabaseAdmin
      .from('wallet_registry')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (fetchError) {
      throw new Error(`Error fetching wallet: ${fetchError.message}`);
    }
    
    // 2. Mettre à jour le statut à "processing"
    await supabaseAdmin
      .from('wallet_registry')
      .update({ 
        status: 'processing',
        processing_attempts: (existingWallet.processing_attempts || 0) + 1,
        last_processed_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);
    
    // 3. Enrichir via GMGN
    const gmgnData = await fetchGMGNData(walletAddress);
    
    // 4. Mapper les données enrichies
    const enrichedData: any = {
      status: 'completed',
      enriched_at: new Date().toISOString(),
      last_processed_at: new Date().toISOString()
    };
    
    if (gmgnData && gmgnData.metrics) {
      const metrics = gmgnData.metrics;
      
      // Mapping des métriques principales
      enrichedData.gmgn_realized_pnl_percent = safeNumber(metrics.realized_pnl_percent);
      enrichedData.gmgn_realized_pnl_usd = safeNumber(metrics.realized_pnl_usd);
      enrichedData.gmgn_win_rate = safeNumber(metrics.win_rate);
      enrichedData.gmgn_total_pnl = safeNumber(metrics.total_pnl);
      enrichedData.gmgn_unrealized_profits = safeNumber(metrics.unrealized_profits);
      enrichedData.gmgn_transactions_7d = safeNumber(metrics.transactions_7d);
      enrichedData.gmgn_balance_sol = safeNumber(metrics.balance_sol);
      enrichedData.gmgn_balance_usd = safeNumber(metrics.balance_usd);
      enrichedData.gmgn_avg_duration = safeNumber(metrics.avg_duration);
      enrichedData.gmgn_cost_7d = safeNumber(metrics.cost_7d);
      
      // Scores de fiabilité
      enrichedData.reliability_score = safeNumber(metrics.reliability_score) || 0;
      enrichedData.data_completeness_score = safeNumber(metrics.data_completeness_score) || 0;
      
      // Données JSON complètes
      enrichedData.gmgn_data = gmgnData;
    }
    
    // 5. Sauvegarder les données enrichies
    const { error: updateError } = await supabaseAdmin
      .from('wallet_registry')
      .update(enrichedData)
      .eq('wallet_address', walletAddress);
    
    if (updateError) {
      throw new Error(`Error updating wallet: ${updateError.message}`);
    }
    
    console.log(`✅ Wallet ${walletAddress} enriched successfully`);
    return { success: true, data: enrichedData };
    
  } catch (error) {
    console.error(`❌ Error enriching wallet ${walletAddress}:`, error);
    
    // Marquer comme failed
    await supabaseAdmin
      .from('wallet_registry')
      .update({ 
        status: 'failed',
        error_message: error.message,
        last_processed_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress);
    
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Route: enrichir un wallet spécifique
    if (path.includes('/enrich/') && req.method === 'POST') {
      const walletAddress = path.split('/enrich/')[1];
      
      if (!walletAddress) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }
      
      const result = await enrichWallet(walletAddress);
      
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: result.success ? 200 : 500
        }
      );
    }
    
    // Route: traitement batch
    if (path === '/batch-process' && req.method === 'POST') {
      const body = await req.json();
      const { batchSize = 10, status = 'pending', limit = null } = body;
      
      console.log(`🚀 Starting batch processing: size=${batchSize}, status=${status}, limit=${limit}`);
      
      // Récupérer les wallets à traiter
      let query = supabaseAdmin
        .from('wallet_registry')
        .select('wallet_address, status, processing_attempts, dune_wallet_pnl')
        .order('dune_wallet_pnl', { ascending: false });
      
      if (status !== 'all') {
        if (status === 'failed') {
          query = query.eq('status', 'failed').lt('processing_attempts', 3);
        } else {
          query = query.eq('status', status);
        }
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: wallets, error: fetchError } = await query;
      
      if (fetchError) {
        return new Response(
          JSON.stringify({ error: `Error fetching wallets: ${fetchError.message}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      const results = {
        total: wallets.length,
        successful: 0,
        failed: 0,
        results: []
      };
      
      // Traiter par batch
      for (let i = 0; i < wallets.length; i += batchSize) {
        const batch = wallets.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(wallets.length/batchSize)}`);
        
        // Traiter en parallèle dans le batch
        const batchPromises = batch.map(async (wallet) => {
          const result = await enrichWallet(wallet.wallet_address);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }
          results.results.push({
            wallet_address: wallet.wallet_address,
            success: result.success,
            error: result.error || null
          });
          return result;
        });
        
        await Promise.allSettled(batchPromises);
        
        // Pause entre batches
        if (i + batchSize < wallets.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`✅ Batch processing completed: ${results.successful} successful, ${results.failed} failed`);
      
      return new Response(
        JSON.stringify(results),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: statistiques de la registry
    if (path === '/stats' && req.method === 'GET') {
      const { data: stats, error } = await supabaseAdmin
        .from('wallet_registry')
        .select('status')
        .select('status, count(*)');
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      return new Response(
        JSON.stringify(stats),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    );
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
