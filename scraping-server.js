const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
app.use(cors());
app.use(express.json());

// Stockage en mémoire des jobs (en production, utilisez Redis ou une DB)
const jobs = new Map();

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Endpoint pour démarrer le scraping
app.post('/api/start-scraping', async (req, res) => {
  try {
    const { jobId, url, callback_url } = req.body;
    
    console.log(`🚀 [SCRAPING START] Job ${jobId} démarré`);
    
    // Créer le job
    const job = {
      id: jobId,
      status: 'running',
      created_at: new Date().toISOString(),
      url: url,
      callback_url: callback_url,
      start_time: Date.now()
    };
    
    jobs.set(jobId, job);
    
    // Lancer le scraping en arrière-plan
    runScrapingJob(jobId, url, callback_url);
    
    res.json({
      success: true,
      job_id: jobId,
      status: 'started',
      message: 'Scraping job démarré'
    });
    
  } catch (error) {
    console.error('❌ [SCRAPING ERROR]:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Endpoint pour vérifier le statut d'un job
app.get('/api/job-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: 'Job not found'
    });
  }
  
  res.json(job);
});

// Endpoint pour lister tous les jobs
app.get('/api/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  res.json({
    jobs: allJobs,
    total: allJobs.length
  });
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'dune-scraper-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    active_jobs: jobs.size
  });
});

// Fonction pour exécuter le scraping
async function runScrapingJob(jobId, url, callbackUrl) {
  try {
    console.log(`🔄 [SCRAPING RUN] Exécution du job ${jobId}`);
    
    // Mettre à jour le statut
    const job = jobs.get(jobId);
    job.status = 'running';
    job.progress = 'Démarrage du navigateur...';
    
    // Exécuter le script de scraping
    const scriptPath = path.join(__dirname, '../scripts/dune-scraper.js');
    
    const child = spawn('node', [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`📄 [SCRAPING OUTPUT] ${message.trim()}`);
      output += message;
      
      // Mettre à jour le progress basé sur les logs
      if (message.includes('Page')) {
        job.progress = message.trim();
      }
    });
    
    child.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`❌ [SCRAPING ERROR] ${message.trim()}`);
      errorOutput += message;
    });
    
    child.on('close', async (code) => {
      const endTime = Date.now();
      const duration = endTime - job.start_time;
      
      if (code === 0) {
        console.log(`✅ [SCRAPING SUCCESS] Job ${jobId} terminé en ${duration}ms`);
        
        // Lire le fichier de résultats
        try {
          const resultsPath = path.join(path.dirname(scriptPath), 'wallets.json');
          
          if (fs.existsSync(resultsPath)) {
            const walletsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            
            job.status = 'completed';
            job.completed_at = new Date().toISOString();
            job.duration_ms = duration;
            job.wallets_count = walletsData.length;
            job.output = output;
            
            // Envoyer un callback si spécifié
            if (callbackUrl) {
              try {
                await fetch(callbackUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    job_id: jobId,
                    status: 'completed',
                    wallets: walletsData,
                    duration_ms: duration,
                    timestamp: new Date().toISOString()
                  })
                });
                console.log(`📡 [CALLBACK] Résultats envoyés à ${callbackUrl}`);
              } catch (callbackError) {
                console.error(`❌ [CALLBACK ERROR] ${callbackError.message}`);
                job.callback_error = callbackError.message;
              }
            }
            
          } else {
            throw new Error('Fichier de résultats introuvable');
          }
          
        } catch (readError) {
          console.error(`❌ [READ ERROR] ${readError.message}`);
          job.status = 'failed';
          job.error = `Erreur lecture résultats: ${readError.message}`;
          job.completed_at = new Date().toISOString();
          job.duration_ms = duration;
        }
        
      } else {
        console.error(`❌ [SCRAPING FAILED] Job ${jobId} échoué avec code ${code}`);
        job.status = 'failed';
        job.error = `Script terminé avec code ${code}: ${errorOutput}`;
        job.completed_at = new Date().toISOString();
        job.duration_ms = duration;
      }
    });
    
  } catch (error) {
    console.error(`❌ [SCRAPING JOB ERROR] ${error.message}`);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      job.completed_at = new Date().toISOString();
    }
  }
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de scraping démarré sur le port ${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/start-scraping - Démarrer un job de scraping`);
  console.log(`   GET /api/job-status/:jobId - Vérifier le statut d'un job`);
  console.log(`   GET /api/jobs - Lister tous les jobs`);
  console.log(`   GET /health - Santé du service`);
});

module.exports = app;
