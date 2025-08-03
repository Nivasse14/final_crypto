import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('🤖 [ANALYZE WALLET] Début analyse comportementale copy trading Solana...');
    
    const { walletData, walletAddress } = await req.json();
    
    if (!walletData) {
      throw new Error('Données du portefeuille manquantes');
    }

    console.log(`🎯 [ANALYZE WALLET] Analyse pour wallet: ${walletAddress || 'unknown'}`);
    console.log('📊 [ANALYZE WALLET] Données reçues:', {
      hasTokens: !!walletData.tokens,
      tokensCount: walletData.tokens?.length || 0,
      totalPnl: walletData.total_pnl_usd,
      winRate: walletData.winrate,
      totalTrades: walletData.total_trades || walletData.total_tokens_traded
    });

    // Créer un prompt spécialisé pour l'analyse copy trading Solana
    const analysisPrompt = `
Tu es un expert analyste crypto spécialisé en copy trading sur la blockchain Solana.
Ton objectif est d'analyser un portefeuille selon des critères stricts de copy trading et de générer :

✅ un scoring sur 100
✅ une recommandation claire : 🔴 à éviter / 🟡 moyen / 🟢 excellent  
✅ une explication concise mais précise

DONNÉES DU PORTEFEUILLE À ANALYSER:
${JSON.stringify(walletData, null, 2)}

CRITÈRES D'ANALYSE COPY TRADING SOLANA:

1. WIN RATE & PERFORMANCE
- Win rate minimum requis : 85%
- Période d'analyse : 7 jours recommandés
- Nombre de transactions minimum : 50
- ROI minimum : 100%

2. ANTI-BOT / ANTI-FARMING
- Durée de holding minimale : 10 minutes
- Nombre de transactions par jour : maximum 30
- ⚠️ Évite les patterns de scalping répétitifs ou suspects
- Détecte les comportements de farming/bot

3. TAILLE DES POSITIONS
- Taille maximale d'un trade : 1000$
- Pourcentage maximum du supply détenu par token : 5%
- Évalue la diversification

4. TOKENS & STRATÉGIE
- Se concentre sur des mid-cap ou gros market cap
- ✅ Early mover = bonus significatif
- ❌ Ignore les wallets qui ne tradent que du SOL/USDC
- Analyse la qualité des tokens tradés

5. COPY TRADING PRATIQUE
- Délai acceptable entre leur trade et le vôtre : quelques minutes max
- DEX compatibles : Jupiter, Raydium, Orca
- Fréquence de trading adaptée au copy trading

ANALYSE OBLIGATOIRE:
- Calcule un score précis sur 100 basé sur les critères ci-dessus
- Détermine si c'est 🟢 excellent (85+), 🟡 moyen (60-84), ou 🔴 à éviter (<60)
- Explique en 2-3 phrases pourquoi ce wallet est/n'est pas adapté au copy trading
- Identifie les forces et faiblesses principales
- Donne des recommandations pratiques

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "copyTradingScore": 75,
  "recommendation": "🟡",
  "recommendationText": "moyen",
  "explanation": "Explication concise en 2-3 phrases du pourquoi ce wallet est adapté ou non au copy trading.",
  "criteriaAnalysis": {
    "winRateScore": 85,
    "antiBot": true,
    "positionSizing": "acceptable",
    "tokenStrategy": "diversifiée",
    "practicalCopyTrading": "facile"
  },
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "copyTradingViability": "Ce wallet est adapté/non adapté au copy trading car..."
}`;

    console.log('🌐 [ANALYZE WALLET] Envoi vers OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en analyse de copy trading crypto sur Solana. Tu réponds UNIQUEMENT avec du JSON valide, sans formatage markdown ni texte additionnel. Sois strict dans tes critères et précis dans ton scoring.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.2, // Plus déterministe pour l'analyse
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ANALYZE WALLET] Erreur API OpenAI:', response.status, errorText);
      throw new Error(`Erreur API OpenAI: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [ANALYZE WALLET] Réponse OpenAI reçue');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Réponse OpenAI invalide');
    }

    const analysisText = data.choices[0].message.content.trim();
    console.log('📝 [ANALYZE WALLET] Texte d\'analyse:', analysisText.substring(0, 200) + '...');

    // Parser la réponse JSON
    let analysisResult;
    try {
      // Nettoyer le texte au cas où il y aurait du markdown
      const cleanText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanText);
      
      // Validation de la structure
      if (!analysisResult.copyTradingScore || !analysisResult.recommendation) {
        throw new Error('Structure de réponse invalide');
      }
      
      console.log('✅ [ANALYZE WALLET] Analyse parsée avec succès');
      console.log(`🎯 [ANALYZE WALLET] Score: ${analysisResult.copyTradingScore}/100, Recommandation: ${analysisResult.recommendation}`);
      
    } catch (parseError) {
      console.error('❌ [ANALYZE WALLET] Erreur parsing JSON:', parseError);
      console.error('📄 [ANALYZE WALLET] Réponse brute:', analysisText);
      
      // Fallback analysis stricte si le parsing échoue
      analysisResult = {
        copyTradingScore: 30,
        recommendation: "🔴",
        recommendationText: "à éviter",
        explanation: "Analyse automatique échouée. Les données sont insuffisantes pour une évaluation copy trading fiable.",
        criteriaAnalysis: {
          winRateScore: 0,
          antiBot: false,
          positionSizing: "unknown",
          tokenStrategy: "unknown", 
          practicalCopyTrading: "difficult"
        },
        strengths: ["Données collectées"],
        weaknesses: ["Analyse incomplète", "Données insuffisantes"],
        recommendations: ["Revoir les données du wallet", "Analyser sur une période plus longue"],
        copyTradingViability: "Ce wallet ne peut pas être évalué correctement pour le copy trading en raison de données insuffisantes."
      };
    }

    // Ajouter des métadonnées
    analysisResult.metadata = {
      analyzedAt: new Date().toISOString(),
      walletAddress: walletAddress,
      dataSource: 'openai_gpt4o_mini',
      criteriaVersion: 'solana_copy_trading_v1',
      tokensAnalyzed: walletData.tokens?.length || 0,
      analysisVersion: '2.0'
    };

    console.log('🎊 [ANALYZE WALLET] Analyse terminée avec succès');

    return new Response(JSON.stringify(analysisResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('💥 [ANALYZE WALLET] Erreur:', error.message);
    
    // Réponse d'erreur avec structure standard
    const errorResponse = {
      copyTradingScore: 0,
      recommendation: "🔴",
      recommendationText: "erreur",
      explanation: `Erreur lors de l'analyse: ${error.message}. Impossible d'évaluer ce wallet pour le copy trading.`,
      criteriaAnalysis: {
        winRateScore: 0,
        antiBot: false,
        positionSizing: "error",
        tokenStrategy: "error",
        practicalCopyTrading: "impossible"
      },
      strengths: [],
      weaknesses: ["Erreur d'analyse"],
      recommendations: ["Réessayer l'analyse", "Vérifier les données du wallet"],
      copyTradingViability: "Ce wallet ne peut pas être analysé en raison d'une erreur technique.",
      metadata: {
        error: error.message,
        analyzedAt: new Date().toISOString(),
        analysisVersion: '2.0'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
