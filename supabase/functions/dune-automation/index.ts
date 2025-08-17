// Edge Function Dune Automation - API pour automatiser le scraping et l'enrichissement
// Workflow: 1) Scraping Dune → 2) Stockage wallet_registry → 3) Enrichissement via cielo-api

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Déclarations pour Deno dans l'environnement Supabase
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SCRAPING_SERVER_URL = (globalThis as any).Deno.env.get('SCRAPING_SERVER_URL') || 'https://scandune-production.up.railway.app';

interface AutomationStatus {
  id: string;
  status: 'initializing' | 'scraping' | 'storing' | 'enriching' | 'completed' | 'failed';
  started_at: string;
  current_step: string;
  progress: {
    scraping?: { status: string; wallets_found?: number };
    storing?: { status: string; wallets_stored?: number };
    enrichment?: { status: string; wallets_enriched?: number; total_wallets?: number };
  };
  error?: string;
}

const activeJobs = new Map<string, AutomationStatus>();

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // 🚀 Démarrer le workflow complet d'automatisation
    if (path === '/dune-automation/start' && req.method === 'POST') {
      const jobId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🤖 [AUTOMATION] Démarrage du workflow complet - Job ID: ${jobId}`);
      
      const automationJob: AutomationStatus = {
        id: jobId,
        status: 'initializing',
        started_at: new Date().toISOString(),
        current_step: 'Initialisation du workflow',
        progress: {}
      };
      
      activeJobs.set(jobId, automationJob);
      
      // Démarrer le workflow en arrière-plan
      startAutomationWorkflow(jobId).catch(error => {
        console.error(`❌ [AUTOMATION] Erreur workflow ${jobId}:`, error);
        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          activeJobs.set(jobId, job);
        }
      });
      
      return new Response(JSON.stringify({
        success: true,
        job_id: jobId,
        status: 'started',
        message: 'Workflow d\'automatisation démarré',
        estimated_duration: '15-30 minutes',
        steps: [
          '1. Scraping Dune Analytics',
          '2. Stockage en base wallet_registry', 
          '3. Enrichissement via cielo-api/complete'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // 📊 Vérifier le statut du workflow
    } else if (path === '/dune-automation/status' && req.method === 'GET') {
      const jobId = url.searchParams.get('job_id');
      
      if (!jobId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'job_id requis'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const job = activeJobs.get(jobId);
      
      if (!job) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Job non trouvé'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        ...job
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // 📋 Lister tous les jobs actifs
    } else if (path === '/dune-automation/jobs' && req.method === 'GET') {
      const jobs = Array.from(activeJobs.values()).sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      
      return new Response(JSON.stringify({
        success: true,
        jobs: jobs,
        active_count: jobs.filter(j => !['completed', 'failed'].includes(j.status)).length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // 🔧 Démarrer seulement l'enrichissement (si scraping déjà fait)
    } else if (path === '/dune-automation/enrich-only' && req.method === 'POST') {
      const { limit = 50 } = await req.json();
      
      const jobId = `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const enrichmentJob: AutomationStatus = {
        id: jobId,
        status: 'enriching',
        started_at: new Date().toISOString(),
        current_step: 'Enrichissement des wallets existants',
        progress: {
          enrichment: { status: 'started', wallets_enriched: 0 }
        }
      };
      
      activeJobs.set(jobId, enrichmentJob);
      
      // Démarrer l'enrichissement en arrière-plan
      startEnrichmentOnly(jobId, limit).catch(error => {
        console.error(`❌ [ENRICHMENT] Erreur ${jobId}:`, error);
        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          activeJobs.set(jobId, job);
        }
      });
      
      return new Response(JSON.stringify({
        success: true,
        job_id: jobId,
        status: 'started',
        message: `Enrichissement de ${limit} wallets démarré`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Endpoint non trouvé',
        available_endpoints: {
          'POST /dune-automation/start': 'Démarrer le workflow complet',
          'GET /dune-automation/status?job_id=xxx': 'Vérifier le statut',
          'GET /dune-automation/jobs': 'Lister tous les jobs',
          'POST /dune-automation/enrich-only': 'Enrichir seulement (avec limit)'
        }
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ [AUTOMATION] Erreur générale:', error);
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

// 🤖 Workflow complet d'automatisation
async function startAutomationWorkflow(jobId: string) {
  const updateJob = (updates: Partial<AutomationStatus>) => {
    const current = activeJobs.get(jobId);
    if (current) {
      activeJobs.set(jobId, { ...current, ...updates });
    }
  };

  try {
    // ÉTAPE 1: Scraping Dune
    updateJob({
      status: 'scraping',
      current_step: 'Scraping des données Dune Analytics',
      progress: { scraping: { status: 'started' } }
    });

    console.log(`🕷️ [${jobId}] Démarrage du scraping Dune...`);
    
    const scrapingResponse = await fetch(`${supabaseUrl}/functions/v1/dune-scraper-trigger/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!scrapingResponse.ok) {
      throw new Error(`Erreur démarrage scraping: ${scrapingResponse.status}`);
    }

    const scrapingResult = await scrapingResponse.json();
    const scrapingJobId = scrapingResult.job_id;

    // Attendre la fin du scraping
    let scrapingCompleted = false;
    let scrapingAttempts = 0;
    const maxScrapingAttempts = 30; // 15 minutes max

    while (!scrapingCompleted && scrapingAttempts < maxScrapingAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Attendre 30s
      
      const statusResponse = await fetch(`${supabaseUrl}/functions/v1/dune-scraper-trigger/status?job_id=${scrapingJobId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        
        updateJob({
          progress: { 
            scraping: { 
              status: status.status || 'running',
              wallets_found: status.wallets_count 
            }
          }
        });

        if (status.status === 'completed') {
          scrapingCompleted = true;
          console.log(`✅ [${jobId}] Scraping terminé: ${status.wallets_count} wallets`);
        } else if (status.status === 'failed') {
          throw new Error(`Scraping échoué: ${status.error || 'Erreur inconnue'}`);
        }
      }
      
      scrapingAttempts++;
    }

    if (!scrapingCompleted) {
      throw new Error('Timeout: Scraping trop long (>15 minutes)');
    }

    // ÉTAPE 2: Vérification du stockage
    updateJob({
      status: 'storing',
      current_step: 'Vérification du stockage en base',
      progress: { 
        ...activeJobs.get(jobId)?.progress,
        storing: { status: 'checking' }
      }
    });

    // Compter les nouveaux wallets
    const { count: totalWallets } = await supabase
      .from('wallet_registry')
      .select('*', { count: 'exact', head: true });

    updateJob({
      progress: { 
        ...activeJobs.get(jobId)?.progress,
        storing: { status: 'completed', wallets_stored: totalWallets || 0 }
      }
    });

    console.log(`💾 [${jobId}] Stockage vérifié: ${totalWallets} wallets total`);

    // ÉTAPE 3: Enrichissement
    await startEnrichmentProcess(jobId, 100); // Enrichir 100 wallets max

    updateJob({
      status: 'completed',
      current_step: 'Workflow terminé avec succès'
    });

    console.log(`🎉 [${jobId}] Workflow complet terminé!`);

  } catch (error) {
    console.error(`❌ [${jobId}] Erreur workflow:`, error);
    updateJob({
      status: 'failed',
      error: error.message
    });
    throw error;
  }
}

// 🔧 Enrichissement seulement
async function startEnrichmentOnly(jobId: string, limit: number = 50) {
  return startEnrichmentProcess(jobId, limit);
}

// 🎯 Processus d'enrichissement
async function startEnrichmentProcess(jobId: string, limit: number = 100) {
  const updateJob = (updates: Partial<AutomationStatus>) => {
    const current = activeJobs.get(jobId);
    if (current) {
      activeJobs.set(jobId, { ...current, ...updates });
    }
  };

  try {
    updateJob({
      status: 'enriching',
      current_step: 'Enrichissement des wallets via cielo-api',
      progress: { 
        ...activeJobs.get(jobId)?.progress,
        enrichment: { status: 'started', wallets_enriched: 0 }
      }
    });

    // Récupérer les wallets non enrichis
    const { data: walletsToEnrich, error } = await supabase
      .from('wallet_registry')
      .select('id, wallet_address')
      .or('status.is.null,status.neq.enriched')
      .limit(limit);

    if (error) {
      throw new Error(`Erreur récupération wallets: ${error.message}`);
    }

    if (!walletsToEnrich || walletsToEnrich.length === 0) {
      console.log(`ℹ️ [${jobId}] Aucun wallet à enrichir`);
      updateJob({
        progress: { 
          ...activeJobs.get(jobId)?.progress,
          enrichment: { 
            status: 'completed', 
            wallets_enriched: 0,
            total_wallets: 0
          }
        }
      });
      return;
    }

    console.log(`🔄 [${jobId}] Enrichissement de ${walletsToEnrich.length} wallets...`);

    let enrichedCount = 0;

    // Enrichir wallet par wallet
    for (const wallet of walletsToEnrich) {
      try {
        console.log(`📊 [${jobId}] Enrichissement ${wallet.wallet_address}...`);
        
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/cielo-api/complete/${wallet.wallet_address}`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (enrichResponse.ok) {
          enrichedCount++;
          
          // Marquer comme enrichi
          await supabase
            .from('wallet_registry')
            .update({ 
              status: 'enriched',
              enriched_at: new Date().toISOString()
            })
            .eq('id', wallet.id);

          console.log(`✅ [${jobId}] ${wallet.wallet_address} enrichi`);
        } else {
          console.log(`⚠️ [${jobId}] Échec enrichissement ${wallet.wallet_address}`);
        }

        // Mettre à jour le progrès
        updateJob({
          progress: { 
            ...activeJobs.get(jobId)?.progress,
            enrichment: { 
              status: 'running', 
              wallets_enriched: enrichedCount,
              total_wallets: walletsToEnrich.length
            }
          }
        });

        // Pause entre les appels pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ [${jobId}] Erreur enrichissement ${wallet.wallet_address}:`, error);
      }
    }

    updateJob({
      progress: { 
        ...activeJobs.get(jobId)?.progress,
        enrichment: { 
          status: 'completed', 
          wallets_enriched: enrichedCount,
          total_wallets: walletsToEnrich.length
        }
      }
    });

    console.log(`🎯 [${jobId}] Enrichissement terminé: ${enrichedCount}/${walletsToEnrich.length} wallets`);

  } catch (error) {
    console.error(`❌ [${jobId}] Erreur enrichissement:`, error);
    updateJob({
      error: error.message
    });
    throw error;
  }
}
