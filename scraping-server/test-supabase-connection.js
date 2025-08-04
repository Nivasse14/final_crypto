async function testSupabaseConnection() {
  const fetch = (await import('node-fetch')).default;
  const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

  console.log('🔗 Test de connexion Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...');

  try {
    // Test 1: Vérifier la structure de la table
    console.log('\n📋 Test 1: Vérification de la structure de la table...');
    const structureResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry?limit=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status structure:', structureResponse.status);
    if (!structureResponse.ok) {
      const error = await structureResponse.text();
      console.log('❌ Erreur structure:', error);
    } else {
      console.log('✅ Table accessible');
    }

    // Test 2: Insérer un wallet de test
    console.log('\n💾 Test 2: Insertion d\'un wallet de test...');
    const testWallet = {
      wallet_address: 'TEST_' + Date.now(),
      profit_usd: 1000.50,
      profit_percentage: 25.5,
      trades_count: 10,
      success_rate: 80.0,
      last_trade_date: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      source_url: 'https://dune.com/test'
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([testWallet])
    });

    console.log('Status insertion:', insertResponse.status);
    if (insertResponse.ok) {
      const result = await insertResponse.json();
      console.log('✅ Insertion réussie:', result);
    } else {
      const error = await insertResponse.text();
      console.log('❌ Erreur insertion:', error);
    }

    // Test 3: Lire les données
    console.log('\n📖 Test 3: Lecture des données...');
    const readResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry?limit=5&order=scraped_at.desc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status lecture:', readResponse.status);
    if (readResponse.ok) {
      const data = await readResponse.json();
      console.log(`✅ Lecture réussie: ${data.length} enregistrements trouvés`);
      if (data.length > 0) {
        console.log('Premier enregistrement:', data[0]);
      }
    } else {
      const error = await readResponse.text();
      console.log('❌ Erreur lecture:', error);
    }

  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
}

testSupabaseConnection();
