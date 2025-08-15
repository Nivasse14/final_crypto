// Script de test pour l'API Cielo
const testWallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

console.log('🧪 Test API Cielo - Diagnostic');
console.log(`📍 Wallet testé: ${testWallet}`);

const testAPI = async () => {
  const apiUrl = `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${testWallet}`;
  
  console.log(`🌐 URL complète: ${apiUrl}`);
  
  try {
    console.log('📤 Envoi de la requête GET...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📈 Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers response:`, [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log(`📝 Réponse brute: ${responseText}`);
    
    if (responseText) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ JSON valide:', jsonData);
      } catch (jsonError) {
        console.error('❌ Erreur parsing JSON:', jsonError.message);
        console.log(`📝 Contenu non-JSON: "${responseText}"`);
      }
    } else {
      console.error('❌ Réponse vide');
    }
    
  } catch (error) {
    console.error('❌ Erreur requête:', error.message);
  }
};

// Test direct avec curl pour comparaison
console.log('\n🔧 Commande curl équivalente:');
console.log(`curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU" "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${testWallet}"`);

testAPI();
