#!/usr/bin/env node

// Test direct de l'enrichissement avec Edge Function

async function testEnrichmentDirect() {
  const url = "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/gecko-test";
  
  console.log(`🔍 Testing enrichment via Edge Function: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDg3ODUsImV4cCI6MjA2OTEyNDc4NX0.kCgCF2c3cW5QZmfGBRz2t9wQP8LuwEp6R2TmSMeAKJo'
      }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Edge Function test result:`);
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testEnrichmentDirect();
