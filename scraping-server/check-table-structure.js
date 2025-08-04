async function checkTableStructure() {
  const fetch = (await import('node-fetch')).default;
  const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

  console.log('🔍 Vérification de la structure de la table wallet_registry...');

  try {
    // Récupérer toutes les tables
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/?select=table_name&table_schema=eq.public`, {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log('📋 Tables disponibles:', tables);
    }

    // Récupérer un échantillon pour voir la structure
    const sampleResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (sampleResponse.ok) {
      const sample = await sampleResponse.json();
      console.log('📝 Structure de wallet_registry (échantillon):');
      if (sample.length > 0) {
        const columns = Object.keys(sample[0]);
        console.log('Colonnes:', columns);
        console.log('Exemple d\'enregistrement:', sample[0]);
      } else {
        console.log('Table vide');
      }
    } else {
      const error = await sampleResponse.text();
      console.log('❌ Erreur echantillon:', error);
    }

    // Vérifier les colonnes via OpenAPI
    const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept': 'application/openapi+json'
      }
    });

    if (schemaResponse.ok) {
      const schema = await schemaResponse.json();
      if (schema.definitions && schema.definitions.wallet_registry) {
        console.log('📊 Structure OpenAPI de wallet_registry:');
        const properties = schema.definitions.wallet_registry.properties;
        Object.keys(properties).forEach(col => {
          console.log(`  - ${col}: ${properties[col].type || 'unknown'} ${properties[col].format ? `(${properties[col].format})` : ''}`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

checkTableStructure();
