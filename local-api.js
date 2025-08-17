// API locale pour lancer le scraping Dune depuis votre Mac
// Port 3001 pour éviter les conflits

const express = require('express');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(express.json());

// CORS pour permettre les appels depuis n'importe où
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// État des jobs en cours
const activeJobs = new Map();

// 🚀 Endpoint pour démarrer le scraping Dune
app.post('/start-dune-scraping', async (req, res) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🤖 [${jobId}] Démarrage du scraping Dune...`);
  
  try {
    const job = {
      id: jobId,
      status: 'running',
      started_at: new Date().toISOString(),
      script: 'dune-scraper.js',
      output: [],
      error: null
    };
    
    activeJobs.set(jobId, job);
    
    // Lancer le script dune-scraper.js
    const scriptPath = path.join(__dirname, 'scripts', 'dune-scraper.js');
    
    const child = spawn('node', [scriptPath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Capturer la sortie
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`📄 [${jobId}] ${output}`);
      job.output.push(`[STDOUT] ${output}`);
    });
    
    child.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`❌ [${jobId}] ${error}`);
      job.output.push(`[STDERR] ${error}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        job.status = 'completed';
        console.log(`✅ [${jobId}] Scraping terminé avec succès`);
      } else {
        job.status = 'failed';
        job.error = `Process exited with code ${code}`;
        console.error(`❌ [${jobId}] Scraping échoué: code ${code}`);
      }
      job.completed_at = new Date().toISOString();
    });
    
    job.process = child;
    
    res.json({
      success: true,
      job_id: jobId,
      message: 'Scraping Dune démarré',
      status: 'running'
    });
    
  } catch (error) {
    console.error(`❌ [${jobId}] Erreur:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📊 Vérifier le statut d'un job
app.get('/job-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job non trouvé'
    });
  }
  
  // Nettoyer la réponse (enlever le process)
  const cleanJob = {
    id: job.id,
    status: job.status,
    started_at: job.started_at,
    completed_at: job.completed_at,
    script: job.script,
    output: job.output.slice(-10), // Dernières 10 lignes seulement
    error: job.error
  };
  
  res.json({
    success: true,
    ...cleanJob
  });
});

// 📋 Lister tous les jobs
app.get('/jobs', (req, res) => {
  const jobs = Array.from(activeJobs.values()).map(job => ({
    id: job.id,
    status: job.status,
    started_at: job.started_at,
    completed_at: job.completed_at,
    script: job.script
  }));
  
  res.json({
    success: true,
    jobs: jobs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
    active_count: jobs.filter(j => j.status === 'running').length
  });
});

// 🔧 Lancer seulement l'enrichissement (si scraping déjà fait)
app.post('/start-enrichment', async (req, res) => {
  const { limit = 50 } = req.body;
  const jobId = `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔄 [${jobId}] Démarrage enrichissement de ${limit} wallets...`);
  
  try {
    // Appeler l'API Supabase pour l'enrichissement
    const response = await fetch('https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/dune-automation/enrich-only', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit })
    });
    
    const result = await response.json();
    
    res.json({
      success: true,
      job_id: jobId,
      supabase_job_id: result.job_id,
      message: `Enrichissement de ${limit} wallets démarré`,
      status: 'started'
    });
    
  } catch (error) {
    console.error(`❌ [${jobId}] Erreur enrichissement:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🌍 Workflow complet (scraping + enrichissement)
app.post('/full-workflow', async (req, res) => {
  const { enrichment_limit = 50 } = req.body;
  const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🚀 [${workflowId}] Démarrage workflow complet...`);
  
  try {
    // 1. Démarrer le scraping
    const scrapingResponse = await fetch('http://localhost:3001/start-dune-scraping', {
      method: 'POST'
    });
    
    const scrapingResult = await scrapingResponse.json();
    
    if (!scrapingResult.success) {
      throw new Error('Échec démarrage scraping');
    }
    
    res.json({
      success: true,
      workflow_id: workflowId,
      scraping_job_id: scrapingResult.job_id,
      message: 'Workflow complet démarré',
      steps: [
        '1. Scraping Dune en cours...',
        '2. Enrichissement sera lancé automatiquement après',
        `3. ${enrichment_limit} wallets seront enrichis`
      ],
      next_step: `Surveillez le statut avec GET /job-status/${scrapingResult.job_id}`
    });
    
  } catch (error) {
    console.error(`❌ [${workflowId}] Erreur workflow:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API locale Dune running',
    timestamp: new Date().toISOString(),
    active_jobs: activeJobs.size
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API locale Dune démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /start-dune-scraping - Démarrer le scraping`);
  console.log(`   GET  /job-status/:jobId - Vérifier un job`);
  console.log(`   GET  /jobs - Lister tous les jobs`);
  console.log(`   POST /start-enrichment - Enrichir seulement`);
  console.log(`   POST /full-workflow - Workflow complet`);
  console.log(`   GET  /health - Health check`);
});

module.exports = app;
