// Edge Function pour le traitement automatique par cron
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const cronKey = url.searchParams.get('key');
    
    // Vérification de sécurité pour les cron jobs
    const expectedCronKey = Deno.env.get('CRON_SECRET_KEY');
    if (cronKey !== expectedCronKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }
    
    console.log('🚀 Starting scheduled batch processing...');
    
    // Configuration du batch automatique
    const batchConfig = {
      batchSize: 20,
      maxProcessingAttempts: 3,
      priorityThreshold: 10000 // PNL minimum pour prioriser
    };
    
    // 1. Traiter les wallets pending avec priorité
    const { data: priorityWallets, error: priorityError } = await supabaseAdmin
      .from('wallet_registry')
      .select('wallet_address, dune_wallet_pnl, processing_attempts')
      .eq('status', 'pending')
      .gte('dune_wallet_pnl', batchConfig.priorityThreshold)
      .order('dune_wallet_pnl', { ascending: false })
      .limit(batchConfig.batchSize);
    
    if (priorityError) {
      throw new Error(`Error fetching priority wallets: ${priorityError.message}`);
    }
    
    // 2. Si pas assez de wallets prioritaires, compléter avec les autres
    let walletsToProcess = priorityWallets || [];
    
    if (walletsToProcess.length < batchConfig.batchSize) {
      const remaining = batchConfig.batchSize - walletsToProcess.length;
      
      const { data: regularWallets, error: regularError } = await supabaseAdmin
        .from('wallet_registry')
        .select('wallet_address, dune_wallet_pnl, processing_attempts')
        .eq('status', 'pending')
        .lt('dune_wallet_pnl', batchConfig.priorityThreshold)
        .order('dune_wallet_pnl', { ascending: false })
        .limit(remaining);
      
      if (regularError) {
        throw new Error(`Error fetching regular wallets: ${regularError.message}`);
      }
      
      walletsToProcess = [...walletsToProcess, ...(regularWallets || [])];
    }
    
    // 3. Traiter les wallets failed avec peu de tentatives
    if (walletsToProcess.length < batchConfig.batchSize) {
      const remaining = batchConfig.batchSize - walletsToProcess.length;
      
      const { data: failedWallets, error: failedError } = await supabaseAdmin
        .from('wallet_registry')
        .select('wallet_address, dune_wallet_pnl, processing_attempts')
        .eq('status', 'failed')
        .lt('processing_attempts', batchConfig.maxProcessingAttempts)
        .order('dune_wallet_pnl', { ascending: false })
        .limit(remaining);
      
      if (failedError) {
        throw new Error(`Error fetching failed wallets: ${failedError.message}`);
      }
      
      walletsToProcess = [...walletsToProcess, ...(failedWallets || [])];
    }
    
    console.log(`📋 Found ${walletsToProcess.length} wallets to process`);
    
    if (walletsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No wallets to process',
          processed: 0,
          successful: 0,
          failed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // 4. Appeler l'API d'enrichissement pour chaque wallet
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const wallet of walletsToProcess) {
      try {
        console.log(`🔄 Processing ${wallet.wallet_address} (PNL: $${wallet.dune_wallet_pnl?.toLocaleString()})`);
        
        // Appel à l'Edge Function d'enrichissement
        const enrichResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-enrichment/enrich/${wallet.wallet_address}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const enrichResult = await enrichResponse.json();
        
        results.processed++;
        
        if (enrichResult.success) {
          results.successful++;
          console.log(`✅ Successfully processed ${wallet.wallet_address}`);
        } else {
          results.failed++;
          results.errors.push({
            wallet_address: wallet.wallet_address,
            error: enrichResult.error
          });
          console.log(`❌ Failed to process ${wallet.wallet_address}: ${enrichResult.error}`);
        }
        
      } catch (error) {
        results.processed++;
        results.failed++;
        results.errors.push({
          wallet_address: wallet.wallet_address,
          error: error.message
        });
        console.log(`❌ Exception processing ${wallet.wallet_address}: ${error.message}`);
      }
      
      // Pause entre wallets pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 5. Enregistrer les statistiques du batch
    await supabaseAdmin
      .from('batch_processing_logs')
      .insert({
        processed_at: new Date().toISOString(),
        total_processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        batch_config: batchConfig
      });
    
    console.log(`✅ Batch processing completed: ${results.successful}/${results.processed} successful`);
    
    return new Response(
      JSON.stringify({
        message: 'Batch processing completed',
        ...results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Cron job error:', error);
    
    // Enregistrer l'erreur
    try {
      await supabaseAdmin
        .from('batch_processing_logs')
        .insert({
          processed_at: new Date().toISOString(),
          total_processed: 0,
          successful: 0,
          failed: 0,
          errors: [{ error: error.message }],
          batch_config: null
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
