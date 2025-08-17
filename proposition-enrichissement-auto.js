// 💡 PROPOSITION : Modification de l'API Cielo pour enrichissement automatique

// Dans supabase/functions/cielo-api/index.ts
// Ajouter cette logique après la récupération des données Cielo

async function enrichMetricsAutomatically(walletAddress, cieloData) {
  try {
    // Extraire les métriques (même logique que enrich-cielo-metrics.js)
    const metrics = extractMetricsFromCieloData(cieloData);
    
    // Mettre à jour directement en base
    const { error } = await supabase
      .from('wallet_registry')
      .update(metrics)
      .eq('wallet_address', walletAddress);
      
    if (error) {
      console.error('Erreur enrichissement auto:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur enrichissement auto:', error);
    return false;
  }
}

// Dans la fonction principale de l'API
export default async function handler(req: Request) {
  // ... logique existante pour récupérer les données Cielo ...
  
  // NOUVEAU : Enrichissement automatique
  if (cieloData.success) {
    await enrichMetricsAutomatically(walletAddress, cieloData);
  }
  
  return new Response(JSON.stringify(cieloData), {
    headers: { 'Content-Type': 'application/json' }
  });
}
