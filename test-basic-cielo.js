// Test simple de l'Edge Function cielo-api - version basic
async function testBasicAPI() {
  console.log('🧪 Test basic de l\'Edge Function cielo-api');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';
  
  try {
    // Test avec un header d'auth basique
    const headers = {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    };
    
    console.log('\n📍 Test avec auth basique');
    const response = await fetch(baseUrl, { headers });
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réponse reçue:');
      console.log('Name:', data.name);
      console.log('Version:', data.version);
      console.log('Endpoints disponibles:', Object.keys(data.endpoints || {}).length);
      console.log('Procédures tRPC:', data.trpc_procedures_used?.length || 0);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

// Exécuter le test
testBasicAPI().catch(console.error);
