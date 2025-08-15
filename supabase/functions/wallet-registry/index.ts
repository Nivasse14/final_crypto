// @ts-ignore: Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Client avec permissions élevées
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface WalletFilters {
  minPnl?: number
  maxPnl?: number
  minWinRate?: number
  maxWinRate?: number
  minTxCount?: number
  maxTxCount?: number
  enrichedOnly?: boolean
  status?: string
  lastActiveDays?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
  tags?: string[]
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route: Liste des wallets avec filtres
    if (path === '/wallet-registry/list' && req.method === 'GET') {
      // Récupérer les paramètres de filtrage
      const filters: WalletFilters = {
        minPnl: parseFloat(url.searchParams.get('minPnl') || '0'),
        maxPnl: parseFloat(url.searchParams.get('maxPnl') || '9999999999'),
        minWinRate: parseFloat(url.searchParams.get('minWinRate') || '0'),
        maxWinRate: parseFloat(url.searchParams.get('maxWinRate') || '1'),
        minTxCount: parseInt(url.searchParams.get('minTxCount') || '0'),
        maxTxCount: parseInt(url.searchParams.get('maxTxCount') || '999999'),
        enrichedOnly: url.searchParams.get('enrichedOnly') === 'true',
        status: url.searchParams.get('status') || undefined,
        lastActiveDays: parseInt(url.searchParams.get('lastActiveDays') || '0'),
        sortBy: url.searchParams.get('sortBy') || 'total_pnl_usd',
        sortDirection: (url.searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc',
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        tags: url.searchParams.get('tags')?.split(',')
      };

      console.log('📋 Liste wallets requested avec filtres:', filters);

      // Construire la requête avec les vraies colonnes
      let query = supabaseAdmin
        .from('wallet_registry')
        .select('*')
        .gte('total_pnl_usd', filters.minPnl)
        .lte('total_pnl_usd', filters.maxPnl)
        .gte('winrate', filters.minWinRate)
        .lte('winrate', filters.maxWinRate)
        .gte('trade_count', filters.minTxCount)
        .lte('trade_count', filters.maxTxCount);

      // Filtres conditionnels
      if (filters.enrichedOnly) {
        query = query.eq('enriched', true);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.lastActiveDays > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastActiveDays);
        query = query.gte('last_active', cutoffDate.toISOString());
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Tri et pagination
      query = query
        .order(filters.sortBy, { ascending: filters.sortDirection === 'asc' })
        .limit(filters.limit)
        .range(filters.offset, filters.offset + filters.limit - 1);

      const { data: wallets, error, count } = await query;

      if (error) {
        console.error('❌ [DB ERROR]:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      // Calculer les statistiques agrégées avec les vraies colonnes
      const stats = {
        total_wallets: count,
        total_pnl: wallets.reduce((sum, w) => sum + (w.total_pnl_usd || 0), 0),
        avg_win_rate: wallets.reduce((sum, w) => sum + (w.winrate || 0), 0) / wallets.length,
        avg_trade_count: wallets.reduce((sum, w) => sum + (w.trade_count || 0), 0) / wallets.length,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: wallets,
          stats,
          metadata: {
            count,
            filters,
            has_more: count > (filters.offset + filters.limit)
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Route: Obtenir un wallet spécifique
    if (path.match(/^\/wallet-registry\/get\/[\w-]+$/) && req.method === 'GET') {
      const walletAddress = path.split('/').pop();

      console.log(`🔍 Wallet details requested: ${walletAddress}`);

      const { data: wallet, error } = await supabaseAdmin
        .from('wallet_registry')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: error.code === 'PGRST116' ? 404 : 500
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: wallet }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Route: Statistiques globales
    if (path === '/wallet-registry/stats' && req.method === 'GET') {
      console.log('📊 Global stats requested');

      const { data: stats, error } = await supabaseAdmin.rpc('get_wallet_registry_stats');

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
        JSON.stringify({ success: true, data: stats }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Route par défaut: documentation
    return new Response(
      JSON.stringify({
        message: 'Wallet Registry API',
        version: '1.0.0',
        endpoints: [
          'GET /wallet-registry/list - Liste filtrée des wallets',
          'GET /wallet-registry/get/{address} - Détails d\'un wallet',
          'GET /wallet-registry/stats - Statistiques globales'
        ],
        filters_available: [
          'minPnl, maxPnl - Filtrer par PnL',
          'minWinRate, maxWinRate - Filtrer par win rate',
          'minTxCount, maxTxCount - Filtrer par nombre de transactions',
          'enrichedOnly - Seulement les wallets enrichis',
          'status - Filtrer par statut',
          'lastActiveDays - Actifs dans les X derniers jours',
          'tags - Filtrer par tags',
          'sortBy, sortDirection - Tri des résultats',
          'limit, offset - Pagination'
        ],
        example: '/wallet-registry/list?minPnl=50000&minWinRate=0.8&limit=20'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Wallet Registry API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
