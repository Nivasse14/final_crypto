// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface ScrapingJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  wallets_count?: number;
  error?: string;
}

// Configuration pour le serveur de scraping externe
const SCRAPING_SERVER_URL = (globalThis as any).Deno.env.get('SCRAPING_SERVER_URL') || 'http://localhost:3001';

// Client Supabase pour la sauvegarde des données
const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    if (path === '/dune-scraper-trigger/start' && req.method === 'POST') {
      console.log('🚀 [SCRAPER TRIGGER] Démarrage du scraping Dune...');
      
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Déclencher le scraping sur le serveur externe
      const scrapingResponse = await fetch(`${SCRAPING_SERVER_URL}/api/start-scraping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(globalThis as any).Deno.env.get('SCRAPING_SERVER_TOKEN') || 'default-token'}`
        },
        body: JSON.stringify({
          jobId: jobId,
          url: 'https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3',
          callback_url: `${(globalThis as any).Deno.env.get('SUPABASE_URL')}/functions/v1/dune-scraper-trigger/webhook`
        })
      });

      if (!scrapingResponse.ok) {
        throw new Error(`Scraping server error: ${scrapingResponse.status}`);
      }

      const scrapingResult = await scrapingResponse.json();

      return new Response(JSON.stringify({
        success: true,
        job_id: jobId,
        status: 'started',
        message: 'Scraping job démarré sur le serveur externe',
        estimated_duration: '5-10 minutes',
        server_response: scrapingResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (path === '/dune-scraper-trigger/webhook' && req.method === 'POST') {
      console.log('🔄 [SCRAPER WEBHOOK] Réception des résultats...');
      
      const webhookData = await req.json();
      
      // Traiter les résultats du scraping
      if (webhookData.status === 'completed' && webhookData.wallets) {
        console.log(`✅ [SCRAPER WEBHOOK] ${webhookData.wallets.length} wallets reçus`);
        
        // Préparer les données pour l'insertion
        const walletsToInsert = webhookData.wallets.map((wallet: any) => ({
          scraping_job_id: webhookData.job_id,
          dune_url: 'https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3',
          wallet_address: wallet.wallet,
          solscan_url: wallet.solscan,
          gmgn_url: wallet.gmgn,
          cielo_url: wallet.cielo,
          wallet_pnl_link: wallet.wallet_pnl_link,
          wallet_pnl: wallet.wallet_pnl,
          total_bought_usd: wallet.total_bought_usd,
          total_pnl_usd: wallet.total_pnl_usd,
          roi: wallet.roi,
          mroi: wallet.mroi,
          invalids: wallet.invalids,
          tokens: wallet.tokens,
          nosells: wallet.nosells,
          losses: wallet.losses,
          nulls: wallet.nulls,
          wins: wallet.wins,
          winrate: wallet.winrate,
          w2x: wallet.w2x,
          w10x: wallet.w10x,
          w100x: wallet.w100x,
          scalps: wallet.scalps,
          scalp_ratio: wallet.scalp_ratio,
          bal: wallet.bal,
          bal_ratio: wallet.bal_ratio,
          last_trade: wallet.last_trade,
          trade_days: wallet.trade_days,
          trade_nums: wallet.trade_nums,
          scraped_at: wallet.scraped_at || new Date().toISOString(),
          enrichment_status: 'pending'
        }));
        
        // Sauvegarder en base de données Supabase
        const { data, error } = await supabase
          .from('scraped_wallets')
          .insert(walletsToInsert);
        
        if (error) {
          console.error('❌ [SCRAPER WEBHOOK] Erreur sauvegarde:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Erreur lors de la sauvegarde en base',
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.log(`✅ [SCRAPER WEBHOOK] ${walletsToInsert.length} wallets sauvegardés en base`);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Données reçues et sauvegardées en base Supabase',
          wallets_count: webhookData.wallets.length,
          job_id: webhookData.job_id,
          saved_wallets: walletsToInsert.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook reçu'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (path === '/dune-scraper-trigger/status' && req.method === 'GET') {
      const jobId = url.searchParams.get('job_id');
      
      if (!jobId) {
        return new Response(JSON.stringify({
          error: 'job_id parameter required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Vérifier le statut sur le serveur externe
      const statusResponse = await fetch(`${SCRAPING_SERVER_URL}/api/job-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${(globalThis as any).Deno.env.get('SCRAPING_SERVER_TOKEN') || 'default-token'}`
        }
      });

      const statusData = await statusResponse.json();

      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (path === '/dune-scraper-trigger/pending-wallets' && req.method === 'GET') {
      console.log('📋 [PENDING WALLETS] Récupération des wallets en attente d\'enrichissement...');
      
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      // Récupérer les wallets en attente d'enrichissement
      const { data, error, count } = await supabase
        .from('scraped_wallets')
        .select('*', { count: 'exact' })
        .eq('enrichment_status', 'pending')
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('❌ [PENDING WALLETS] Erreur requête:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erreur lors de la récupération des wallets',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`✅ [PENDING WALLETS] ${data?.length || 0} wallets récupérés`);
      
      return new Response(JSON.stringify({
        success: true,
        wallets: data,
        count: count,
        limit: limit,
        offset: offset,
        has_more: (count || 0) > offset + limit
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (path === '/dune-scraper-trigger/update-enrichment' && req.method === 'POST') {
      console.log('🔄 [UPDATE ENRICHMENT] Mise à jour du statut d\'enrichissement...');
      
      const updateData = await req.json();
      const { wallet_ids, enrichment_status, enrichment_job_id } = updateData;
      
      if (!wallet_ids || !enrichment_status) {
        return new Response(JSON.stringify({
          success: false,
          error: 'wallet_ids et enrichment_status requis'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Mettre à jour le statut d'enrichissement
      const updateFields: any = {
        enrichment_status: enrichment_status,
        updated_at: new Date().toISOString()
      };
      
      if (enrichment_job_id) {
        updateFields.enrichment_job_id = enrichment_job_id;
      }
      
      if (enrichment_status === 'completed') {
        updateFields.enriched_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('scraped_wallets')
        .update(updateFields)
        .in('id', wallet_ids);
      
      if (error) {
        console.error('❌ [UPDATE ENRICHMENT] Erreur mise à jour:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erreur lors de la mise à jour',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`✅ [UPDATE ENRICHMENT] ${wallet_ids.length} wallets mis à jour`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Statut d\'enrichissement mis à jour',
        updated_count: wallet_ids.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        available_endpoints: [
          'POST /dune-scraper-trigger/start - Démarrer le scraping',
          'GET /dune-scraper-trigger/status?job_id=xxx - Vérifier le statut',
          'POST /dune-scraper-trigger/webhook - Webhook pour les résultats',
          'GET /dune-scraper-trigger/pending-wallets?limit=100&offset=0 - Wallets en attente',
          'POST /dune-scraper-trigger/update-enrichment - Mettre à jour le statut d\'enrichissement'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ [SCRAPER TRIGGER ERROR]:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
