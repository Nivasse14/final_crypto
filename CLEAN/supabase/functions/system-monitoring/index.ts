// Edge Function pour le monitoring et la gestion du système
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
    const path = url.pathname;
    
    // Route: Health check du système
    if (path === '/health' && req.method === 'GET') {
      console.log('🏥 System health check requested');
      
      const { data: healthData, error } = await supabaseAdmin
        .rpc('system_health_check');
      
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
        JSON.stringify(healthData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Statistiques de la registry
    if (path === '/stats' && req.method === 'GET') {
      console.log('📊 Registry stats requested');
      
      const { data: stats, error } = await supabaseAdmin
        .rpc('get_registry_stats');
      
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
    
    // Route: Wallets prioritaires
    if (path === '/priority-wallets' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const minPnl = parseFloat(url.searchParams.get('min_pnl') || '10000');
      
      console.log(`🎯 Priority wallets requested: limit=${limit}, minPnl=${minPnl}`);
      
      const { data: priorityWallets, error } = await supabaseAdmin
        .rpc('get_priority_wallets', { p_limit: limit, p_min_pnl: minPnl });
      
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
        JSON.stringify(priorityWallets),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Réinitialiser les wallets failed
    if (path === '/reset-failed' && req.method === 'POST') {
      const body = await req.json();
      const maxAttempts = body.max_attempts || 3;
      
      console.log(`🔄 Resetting failed wallets with max_attempts >= ${maxAttempts}`);
      
      const { data: resetCount, error } = await supabaseAdmin
        .rpc('reset_failed_wallets', { p_max_attempts: maxAttempts });
      
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
        JSON.stringify({ 
          message: `${resetCount} wallets reset successfully`,
          reset_count: resetCount 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Logs des derniers batchs
    if (path === '/batch-logs' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const hours = parseInt(url.searchParams.get('hours') || '24');
      
      console.log(`📋 Batch logs requested: limit=${limit}, hours=${hours}`);
      
      const { data: logs, error } = await supabaseAdmin
        .from('batch_processing_logs')
        .select('*')
        .gte('processed_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('processed_at', { ascending: false })
        .limit(limit);
      
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
        JSON.stringify(logs),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Performance API
    if (path === '/api-performance' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const hours = parseInt(url.searchParams.get('hours') || '24');
      const endpoint = url.searchParams.get('endpoint');
      
      console.log(`📈 API performance requested: limit=${limit}, hours=${hours}, endpoint=${endpoint}`);
      
      let query = supabaseAdmin
        .from('api_performance_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (endpoint) {
        query = query.eq('endpoint', endpoint);
      }
      
      const { data: performance, error } = await query;
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
      
      // Calculer des statistiques agrégées
      const stats = {
        total_requests: performance.length,
        successful_requests: performance.filter(p => p.success).length,
        failed_requests: performance.filter(p => !p.success).length,
        avg_response_time_ms: performance.reduce((sum, p) => sum + (p.execution_time_ms || 0), 0) / performance.length,
        avg_response_size_bytes: performance.reduce((sum, p) => sum + (p.response_size_bytes || 0), 0) / performance.length,
        success_rate: performance.length > 0 ? (performance.filter(p => p.success).length / performance.length) * 100 : 0
      };
      
      return new Response(
        JSON.stringify({
          logs: performance,
          statistics: stats
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Déclenchement manuel d'un batch
    if (path === '/trigger-batch' && req.method === 'POST') {
      const body = await req.json();
      const { batchSize = 10, status = 'pending', limit = null } = body;
      
      console.log(`🚀 Manual batch trigger: size=${batchSize}, status=${status}, limit=${limit}`);
      
      // Appeler l'Edge Function de batch processing
      const batchResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-enrichment/batch-process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchSize, status, limit })
      });
      
      const batchResult = await batchResponse.json();
      
      return new Response(
        JSON.stringify({
          message: 'Batch processing triggered',
          result: batchResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: batchResponse.ok ? 200 : 500
        }
      );
    }
    
    // Route: Nettoyer les anciens logs
    if (path === '/cleanup-logs' && req.method === 'POST') {
      console.log('🧹 Manual log cleanup requested');
      
      const { data: deletedCount, error } = await supabaseAdmin
        .rpc('cleanup_old_logs');
      
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
        JSON.stringify({ 
          message: `${deletedCount} old log entries cleaned up`,
          deleted_count: deletedCount 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Route: Dashboard data (toutes les infos en une requête)
    if (path === '/dashboard' && req.method === 'GET') {
      console.log('📊 Dashboard data requested');
      
      try {
        // Exécuter plusieurs requêtes en parallèle
        const [healthResult, statsResult, logsResult] = await Promise.all([
          supabaseAdmin.rpc('system_health_check'),
          supabaseAdmin.rpc('get_registry_stats'),
          supabaseAdmin
            .from('batch_processing_logs')
            .select('*')
            .gte('processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('processed_at', { ascending: false })
            .limit(10)
        ]);
        
        if (healthResult.error || statsResult.error || logsResult.error) {
          throw new Error('Error fetching dashboard data');
        }
        
        const dashboardData = {
          health: healthResult.data,
          stats: statsResult.data,
          recent_batches: logsResult.data,
          timestamp: new Date().toISOString()
        };
        
        return new Response(
          JSON.stringify(dashboardData),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
        
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Route not found',
        available_routes: [
          'GET /health',
          'GET /stats', 
          'GET /priority-wallets',
          'POST /reset-failed',
          'GET /batch-logs',
          'GET /api-performance',
          'POST /trigger-batch',
          'POST /cleanup-logs',
          'GET /dashboard'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    );
    
  } catch (error) {
    console.error('Monitoring function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
})
