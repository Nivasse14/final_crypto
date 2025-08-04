const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = 'default-token';

// Stockage des jobs en mémoire (en production, utiliser Redis ou DB)
const jobs = new Map();

// Middleware d'authentification
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  next();
};

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    server: 'dune-scraping-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /health': 'Statut du serveur',
      'POST /api/start-scraping': 'Démarrer un job de scraping simple',
      'POST /api/start-complete-workflow': 'Démarrer un workflow complet (scraping + enrichissement)',
      'POST /api/enrich-job/:jobId': 'Enrichir un job existant',
      'GET /api/job-status/:jobId': 'Statut d\'un job',
      'GET /api/job-results/:jobId': 'Résultats d\'un job terminé',
      'GET /api/jobs': 'Liste de tous les jobs'
    },
    active_jobs: jobs.size
  });
});

// Démarrer un job de scraping
app.post('/api/start-scraping', authenticate, async (req, res) => {
  const { jobId, url, callback_url } = req.body;
  
  if (!jobId || !url) {
    return res.status(400).json({ error: 'jobId and url required' });
  }

  // Créer le job
  const job = {
    id: jobId,
    status: 'pending',
    created_at: new Date().toISOString(),
    url: url,
    callback_url: callback_url
  };
  
  jobs.set(jobId, job);

  // Démarrer le scraping en arrière-plan
  scrapeDuneWallets(jobId).catch(error => {
    console.error(`❌ Job ${jobId} failed:`, error);
    const failedJob = jobs.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.error = error.message;
      failedJob.completed_at = new Date().toISOString();
    }
  });

  res.json({
    success: true,
    job_id: jobId,
    status: 'started',
    message: 'Scraping job démarré',
    created_at: job.created_at,
    url: job.url,
    endpoints: {
      status: `/api/job-status/${jobId}`,
      results: `/api/job-results/${jobId}`,
      estimated_duration: '2-5 minutes'
    }
  });
});

// Vérifier le statut d'un job
app.get('/api/job-status/:jobId', authenticate, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Récupérer les résultats d'un job terminé
app.get('/api/job-results/:jobId', authenticate, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ 
      error: 'Job not completed yet', 
      status: job.status,
      message: job.status === 'running' ? 'Scraping en cours...' : 
               job.status === 'failed' ? 'Scraping échoué' : 'Job en attente'
    });
  }
  
  res.json({
    job_id: jobId,
    status: job.status,
    completed_at: job.completed_at,
    wallets_count: job.wallets_count,
    total_pages: job.total_pages,
    wallets: job.wallets || [],
    summary: {
      total_wallets: job.wallets_count,
      pages_scraped: job.total_pages,
      avg_wallets_per_page: job.total_pages > 0 ? Math.round(job.wallets_count / job.total_pages) : 0,
      scraping_duration: job.started_at && job.completed_at ? 
        Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000) + 's' : 'N/A'
    }
  });
});

// Lister tous les jobs (pour debug)
app.get('/api/jobs', authenticate, (req, res) => {
  const allJobs = Array.from(jobs.values()).map(job => ({
    id: job.id,
    status: job.status,
    created_at: job.created_at,
    completed_at: job.completed_at,
    wallets_count: job.wallets_count || 0,
    total_pages: job.total_pages || 0,
    error: job.error
  }));
  
  res.json({
    total_jobs: allJobs.length,
    jobs: allJobs
  });
});

// Interface web simple pour visualiser les résultats (sans auth pour faciliter le debug)
app.get('/dashboard', (req, res) => {
  const allJobs = Array.from(jobs.values());
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard de Scraping Dune</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .job-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; }
        .status.completed { background: #48bb78; }
        .status.running { background: #ed8936; }
        .status.failed { background: #f56565; }
        .status.pending { background: #4299e1; }
        .wallets-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .wallets-table th, .wallets-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .wallets-table th { background: #f8f9fa; }
        .wallet-addr { font-family: monospace; font-size: 11px; }
        .no-jobs { text-align: center; color: #666; padding: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dashboard de Scraping Dune</h1>
            <p>Serveur: dune-scraping-server v1.0.0 | Jobs actifs: ${allJobs.length}</p>
        </div>
        
        ${allJobs.length === 0 ? `
            <div class="no-jobs">
                <h3>Aucun job trouvé</h3>
                <p>Démarrez un scraping via POST /api/start-scraping</p>
            </div>
        ` : allJobs.map(job => `
            <div class="job-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3>Job: ${job.id}</h3>
                    <span class="status ${job.status}">${job.status.toUpperCase()}</span>
                </div>
                
                <p><strong>URL:</strong> ${job.url || 'N/A'}</p>
                <p><strong>Créé:</strong> ${new Date(job.created_at).toLocaleString()}</p>
                ${job.completed_at ? `<p><strong>Terminé:</strong> ${new Date(job.completed_at).toLocaleString()}</p>` : ''}
                ${job.error ? `<p style="color: red;"><strong>Erreur:</strong> ${job.error}</p>` : ''}
                
                ${job.status === 'completed' && job.wallets ? `
                    <div style="margin-top: 15px;">
                        <h4>📈 Résultats (${job.wallets_count} portefeuilles)</h4>
                        <p><strong>Pages scrapées:</strong> ${job.total_pages || 1}</p>
                        
                        ${job.workflow_type === 'complete' && job.stages ? `
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                                <h5>🔄 Workflow complet</h5>
                                <div style="display: flex; gap: 20px;">
                                    <div>
                                        <strong>1. Scraping:</strong> 
                                        <span style="color: ${job.stages.scraping.status === 'completed' ? '#48bb78' : job.stages.scraping.status === 'running' ? '#ed8936' : '#666'}">
                                            ${job.stages.scraping.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>2. Enrichissement:</strong> 
                                        <span style="color: ${job.stages.enrichment.status === 'completed' ? '#48bb78' : job.stages.enrichment.status === 'running' ? '#ed8936' : '#666'}">
                                            ${job.stages.enrichment.status.toUpperCase()}
                                        </span>
                                        ${job.enrichment_results ? ` (${job.enrichment_results.enriched_count}/${job.enrichment_results.total_wallets} réussis)` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${job.supabase_saved || job.supabase_updated ? `
                            <p><strong>💾 Supabase:</strong> 
                                ${job.supabase_saved || 0} nouveaux + ${job.supabase_updated || 0} mis à jour = ${job.supabase_total_processed || (job.supabase_saved || 0)} wallets traités
                            </p>` : ''}
                        ${job.supabase_error ? `<p style="color: orange;"><strong>⚠️ Erreur Supabase:</strong> ${job.supabase_error}</p>` : ''}
                        
                        <details>
                            <summary style="cursor: pointer; padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 10px 0;">
                                🔍 Voir les portefeuilles (${Math.min(10, job.wallets.length)} premiers)
                            </summary>
                            <table class="wallets-table">
                                <thead>
                                    <tr>
                                        <th>Wallet</th>
                                        <th>PnL Total</th>
                                        <th>ROI</th>
                                        <th>Winrate</th>
                                        <th>Tokens</th>
                                        <th>Last Trade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${job.wallets.slice(0, 10).map(wallet => `
                                        <tr>
                                            <td class="wallet-addr">${wallet.wallet?.substring(0, 20)}...</td>
                                            <td>${wallet.total_pnl_usd || 'N/A'}</td>
                                            <td>${wallet.roi || 'N/A'}</td>
                                            <td>${wallet.winrate || 'N/A'}</td>
                                            <td>${wallet.tokens || 'N/A'}</td>
                                            <td>${wallet.last_trade || 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </details>
                        
                        <div style="margin-top: 10px;">
                            <a href="/api/job-results/${job.id}?token=${process.env.AUTH_TOKEN || 'default-token'}" 
                               style="background: #4299e1; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-right: 10px;">
                               📥 Télécharger JSON complet
                            </a>
                            ${job.supabase_saved || job.supabase_updated ? `
                                <a href="https://supabase.com/dashboard/project/xkndddxqqlxqknbqtefv/editor/28888" 
                                   target="_blank"
                                   style="background: #48bb78; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
                                   🗃️ Voir dans Supabase (${job.supabase_total_processed || (job.supabase_saved || 0) + (job.supabase_updated || 0)} wallets)
                                </a>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
            <p>🔄 Cette page se rafraîchit automatiquement toutes les 30 secondes</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh toutes les 30 secondes
        setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>`;
  
  res.send(html);
});

// Endpoint de téléchargement direct des résultats (avec token en query param pour faciliter le debug)
app.get('/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const { token } = req.query;
  
  // Vérification du token
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Token invalide. Utilisez ?token=YOUR_TOKEN' });
  }
  
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ 
      error: 'Job not completed yet', 
      status: job.status 
    });
  }
  
  // Créer un nom de fichier avec timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `dune-wallets-${jobId}-${timestamp}.json`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  
  res.json({
    job_id: jobId,
    scraped_at: job.completed_at,
    source_url: job.url,
    wallets_count: job.wallets_count,
    total_pages: job.total_pages,
    scraping_duration: job.started_at && job.completed_at ? 
      Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000) + 's' : 'N/A',
    wallets: job.wallets || []
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Fonction principale de scraping Dune avec Puppeteer
async function scrapeDuneWallets(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'running';
  job.started_at = new Date().toISOString();

  console.log(`🚀 [${jobId}] Démarrage du scraping Dune...`);

  let browser;
  try {
    // Configuration Puppeteer pour serveur avec options anti-détection avancées
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    
    // Configuration anti-détection plus robuste
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Masquer les propriétés webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    console.log(`🔐 [${jobId}] Chargement de la page Dune...`);
    await page.goto(job.url, {
      waitUntil: 'networkidle0', // Attendre que le réseau soit inactif
      timeout: 90000,
    });

    // Attendre que la page soit complètement chargée
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`🔍 [${jobId}] Recherche des éléments de pagination...`);

    // Essayer plusieurs sélecteurs possibles pour la pagination
    const possibleSelectors = [
      'select[aria-label="Select page"]',
      'select[data-testid="page-selector"]',
      '.pagination select',
      'select.page-selector',
      '[role="combobox"]',
      '.ant-select-selector', // Ant Design
      '.MuiSelect-select' // Material UI
    ];

    let pageSelector = null;
    let totalPages = 1;

    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        pageSelector = selector;
        console.log(`✅ [${jobId}] Sélecteur trouvé: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ [${jobId}] Sélecteur non trouvé: ${selector}`);
      }
    }

    // Vérifier qu'il y a au moins un tableau sur la page
    console.log(`🔍 [${jobId}] Vérification de la présence d'un tableau...`);
    const tableSelectors = ['table', '.table', '[role="table"]', '.ant-table', '.MuiTable-root'];
    let hasTable = false;
    
    for (const tableSelector of tableSelectors) {
      const table = await page.$(tableSelector);
      if (table) {
        hasTable = true;
        console.log(`✅ [${jobId}] Tableau trouvé avec le sélecteur: ${tableSelector}`);
        break;
      }
    }
    
    if (!hasTable) {
      throw new Error('Aucun tableau trouvé sur la page. La structure de la page a peut-être changé.');
    }

    // Si on trouve un sélecteur de page, compter les options
    if (pageSelector) {
      try {
        totalPages = await page.$$eval(`${pageSelector} option`, options => options.length);
        console.log(`📄 [${jobId}] ${totalPages} pages détectées via ${pageSelector}`);
      } catch (e) {
        console.log(`⚠️ [${jobId}] Impossible de compter les pages, utilisation d'une seule page`);
        totalPages = 1;
      }
    } else {
      console.log(`ℹ️ [${jobId}] Aucun sélecteur de pagination trouvé, scraping d'une seule page`);
    }

    job.total_pages = totalPages;
    job.current_page = 0;

    const wallets = [];

    for (let i = 0; i < totalPages; i++) {
      console.log(`➡️ [${jobId}] Page ${i + 1}/${totalPages}`);

      // Si on a plus d'une page et un sélecteur, naviguer vers la page
      if (totalPages > 1 && pageSelector && i > 0) {
        try {
          await page.select(pageSelector, `${i}`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre le chargement
        } catch (e) {
          console.log(`⚠️ [${jobId}] Erreur navigation page ${i + 1}: ${e.message}`);
          break;
        }
      }

      // Essayer plusieurs sélecteurs pour le tableau
      const possibleTableSelectors = [
        'table.table_table__FDV2P tbody tr',
        'table tbody tr',
        '.data-table tbody tr',
        '[data-testid="wallet-table"] tbody tr',
        '.ant-table-tbody tr',
        '.MuiTableBody-root tr'
      ];

      let tableSelector = null;
      let data = [];

      for (const selector of possibleTableSelectors) {
        try {
          const rows = await page.$$(selector);
          if (rows.length > 0) {
            tableSelector = selector;
            console.log(`✅ [${jobId}] Tableau trouvé: ${selector} (${rows.length} lignes)`);
            break;
          }
        } catch (e) {
          console.log(`⚠️ [${jobId}] Sélecteur tableau non trouvé: ${selector}`);
        }
      }

      if (tableSelector) {
        // Scraper les données avec le bon sélecteur
        data = await page.$$eval(tableSelector, rows => {
          return rows.map(row => {
            const cells = row.querySelectorAll('td, th');
            if (cells.length < 10) return null; // Ignorer les lignes avec trop peu de cellules

            return {
              wallet: cells[0]?.innerText.trim() || '',
              solscan: cells[1]?.querySelector('a')?.href || '',
              gmgn: cells[2]?.querySelector('a')?.href || '',
              cielo: cells[3]?.querySelector('a')?.href || '',
              wallet_pnl_link: cells[4]?.querySelector('a')?.href || '',
              wallet_pnl: cells[5]?.innerText.trim() || '',
              total_bought_usd: cells[6]?.innerText.trim() || '',
              total_pnl_usd: cells[7]?.innerText.trim() || '',
              roi: cells[8]?.innerText.trim() || '',
              mroi: cells[9]?.innerText.trim() || '',
              invalids: cells[10]?.innerText.trim() || '',
              tokens: cells[11]?.innerText.trim() || '',
              nosells: cells[12]?.innerText.trim() || '',
              losses: cells[13]?.innerText.trim() || '',
              nulls: cells[14]?.innerText.trim() || '',
              wins: cells[15]?.innerText.trim() || '',
              winrate: cells[16]?.innerText.trim() || '',
              w2x: cells[17]?.innerText.trim() || '',
              w10x: cells[18]?.innerText.trim() || '',
              w100x: cells[19]?.innerText.trim() || '',
              scalps: cells[20]?.innerText.trim() || '',
              scalp_ratio: cells[21]?.innerText.trim() || '',
              bal: cells[22]?.innerText.trim() || '',
              bal_ratio: cells[23]?.innerText.trim() || '',
              last_trade: cells[24]?.innerText.trim() || '',
              trade_days: cells[25]?.innerText.trim() || '',
              trade_nums: cells[26]?.innerText.trim() || '',
              scraped_at: new Date().toISOString()
            };
          }).filter(item => item && item.wallet && item.wallet.length > 10); // Filtrer les wallets valides
        });
      }

      console.log(`✅ [${jobId}] ${data.length} portefeuilles récupérés (page ${i + 1})`);
      wallets.push(...data);
      
      job.current_page = i + 1;
      job.wallets_count = wallets.length;

      // Si aucune donnée trouvée sur cette page, arrêter
      if (data.length === 0 && i === 0) {
        console.log(`⚠️ [${jobId}] Aucune donnée trouvée sur la première page, tentative de debug...`);
        
        // Debug: capturer le contenu de la page
        const pageContent = await page.content();
        console.log(`🔍 [${jobId}] Contenu de la page (premiers 500 chars): ${pageContent.substring(0, 500)}`);
        
        // Essayer de trouver des éléments de table
        const allTables = await page.$$('table');
        console.log(`🔍 [${jobId}] ${allTables.length} tableaux trouvés sur la page`);
        
        // Vérifier s'il y a des erreurs sur la page
        const pageErrors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
          return Array.from(errorElements).map(el => el.textContent.trim());
        });
        
        if (pageErrors.length > 0) {
          console.log(`⚠️ [${jobId}] Erreurs détectées sur la page: ${pageErrors.join(', ')}`);
        }
        
        // Continuer quand même si nous sommes sur la première page et que nous avons trouvé des tableaux
        if (allTables.length === 0) {
          throw new Error('Aucun tableau détecté sur la page');
        }
        
        break;
      }
    }

    await browser.close();

    // Marquer le job comme terminé
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.wallets_count = wallets.length;
    job.wallets = wallets;

    console.log(`✅ [${jobId}] Scraping terminé: ${wallets.length} wallets`);

    // Envoyer les résultats via webhook si configuré
    if (job.callback_url) {
      try {
        const response = await fetch(job.callback_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            status: 'completed',
            wallets: wallets,
            wallets_count: wallets.length,
            completed_at: job.completed_at
          })
        });
        
        if (response.ok) {
          console.log(`✅ [${jobId}] Webhook envoyé avec succès`);
        } else {
          console.log(`⚠️ [${jobId}] Webhook échoué: ${response.status}`);
        }
      } catch (webhookError) {
        console.error(`❌ [${jobId}] Erreur webhook:`, webhookError);
      }
    }

    // Sauvegarder automatiquement dans Supabase
    try {
      console.log(`💾 [${jobId}] Sauvegarde automatique dans Supabase...`);
      
      const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';
      
      // Fonction helper pour valider et convertir une date
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.trim() === '' || dateStr === 'N/A' || dateStr === '-') {
          return null;
        }
        
        // Vérifier si c'est un nombre (jours depuis aujourd'hui)
        const daysAgo = parseInt(dateStr);
        if (!isNaN(daysAgo) && daysAgo > 0 && daysAgo < 1000) {
          // Calculer la date il y a X jours
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          console.log(`📅 [${jobId}] Conversion: "${dateStr}" jours → ${date.toISOString().split('T')[0]}`);
          return date.toISOString();
        }
        
        try {
          const date = new Date(dateStr);
          // Vérifier si la date est valide
          if (isNaN(date.getTime())) {
            console.log(`⚠️ [${jobId}] Date invalide ignorée: "${dateStr}"`);
            return null;
          }
          return date.toISOString();
        } catch (error) {
          console.log(`⚠️ [${jobId}] Erreur de conversion de date: "${dateStr}" - ${error.message}`);
          return null;
        }
      };

      // Préparer les données pour Supabase (structure wallet_registry)
      const supabaseData = wallets.map(wallet => ({
        wallet_address: wallet.wallet,
        solscan_url: wallet.solscan,
        gmgn_url: wallet.gmgn,
        cielo_url: wallet.cielo,
        wallet_pnl_link: wallet.wallet_pnl_link,
        
        // Données Dune avec préfixe dune_
        dune_wallet_pnl: parseFloat(wallet.total_pnl_usd?.replace(/[$,]/g, '')) || 0,
        dune_total_bought_usd: parseFloat(wallet.total_bought_usd?.replace(/[$,]/g, '')) || 0,
        dune_total_pnl_usd: wallet.total_pnl_usd || '0',
        dune_roi: wallet.roi || '0%',
        dune_winrate: parseInt(wallet.wins) || 0,
        dune_tokens: parseInt(wallet.tokens) || 0,
        dune_wins: wallet.winrate || '0%',
        dune_losses: parseInt(wallet.losses) || 0,
        dune_nulls: parseInt(wallet.nulls) || 0,
        dune_nosells: parseInt(wallet.nosells) || 0,
        dune_w2x: parseInt(wallet.w2x) || 0,
        dune_w10x: parseInt(wallet.w10x) || 0,
        dune_w100x: parseInt(wallet.w100x) || 0,
        dune_scalps: parseInt(wallet.scalps) || 0,
        dune_scalp_ratio: wallet.scalp_ratio || '0%',
        dune_bal: parseInt(wallet.bal) || 0,
        dune_bal_ratio: wallet.bal_ratio || '0%',
        dune_last_trade: wallet.last_trade,
        dune_trade_days: parseInt(wallet.trade_days) || 0,
        
        // Colonnes de base (compatibilité)
        total_pnl_usd: parseFloat(wallet.total_pnl_usd?.replace(/[$,]/g, '')) || 0,
        total_bought_usd: parseFloat(wallet.total_bought_usd?.replace(/[$,]/g, '')) || 0,
        roi: parseFloat(wallet.roi?.replace(/%/g, '')) || 0,
        winrate: parseFloat(wallet.winrate?.replace(/%/g, '')) || 0,
        tokens_traded: parseInt(wallet.tokens) || 0,
        wins: parseInt(wallet.wins) || 0,
        losses: parseInt(wallet.losses) || 0,
        trade_count: parseInt(wallet.trade_nums) || 0,
        last_trade_date: parseDate(wallet.last_trade),
        
        // Métadonnées et statut
        source: 'dune_scraper_api',
        data_source: 'dune_analytics',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          job_id: jobId,
          scraping_session: job.created_at,
          scraped_at: new Date().toISOString(),
          raw_data: wallet
        }
      })).filter(w => w.wallet_address && w.wallet_address.length > 10);

      // Sauvegarder par chunks pour éviter les timeouts avec gestion des doublons
      const chunkSize = 50;
      let savedCount = 0;
      let updatedCount = 0;
      
      for (let i = 0; i < supabaseData.length; i += chunkSize) {
        const chunk = supabaseData.slice(i, i + chunkSize);
        
        // Essayer d'abord un INSERT normal
        let supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(chunk)
        });
        
        if (supabaseResponse.ok) {
          savedCount += chunk.length;
          console.log(`✅ [${jobId}] Chunk ${Math.floor(i/chunkSize) + 1} sauvé: ${chunk.length} nouveaux wallets`);
        } else {
          // Si erreur de contrainte unique, faire des UPDATE individuels
          const error = await supabaseResponse.text();
          if (error.includes('duplicate key') || error.includes('23505')) {
            console.log(`🔄 [${jobId}] Doublons détectés dans chunk ${Math.floor(i/chunkSize) + 1}, mise à jour individuelle...`);
            
            // Mettre à jour chaque wallet individuellement
            for (const wallet of chunk) {
              try {
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry?wallet_address=eq.${wallet.wallet_address}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    // Mettre à jour uniquement les données Dune et les métadonnées
                    dune_wallet_pnl: wallet.dune_wallet_pnl,
                    dune_total_bought_usd: wallet.dune_total_bought_usd,
                    dune_total_pnl_usd: wallet.dune_total_pnl_usd,
                    dune_roi: wallet.dune_roi,
                    dune_winrate: wallet.dune_winrate,
                    dune_tokens: wallet.dune_tokens,
                    dune_wins: wallet.dune_wins,
                    dune_losses: wallet.dune_losses,
                    total_pnl_usd: wallet.total_pnl_usd,
                    total_bought_usd: wallet.total_bought_usd,
                    roi: wallet.roi,
                    winrate: wallet.winrate,
                    tokens_traded: wallet.tokens_traded,
                    wins: wallet.wins,
                    losses: wallet.losses,
                    trade_count: wallet.trade_count,
                    last_trade_date: wallet.last_trade_date,
                    updated_at: new Date().toISOString(),
                    metadata: wallet.metadata
                  })
                });
                
                if (updateResponse.ok) {
                  updatedCount++;
                } else {
                  // Si le wallet n'existe pas, l'insérer
                  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/wallet_registry`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseServiceKey}`,
                      'apikey': supabaseServiceKey,
                      'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(wallet)
                  });
                  
                  if (insertResponse.ok) {
                    savedCount++;
                  }
                }
              } catch (updateError) {
                console.log(`⚠️ [${jobId}] Erreur wallet ${wallet.wallet_address}: ${updateError.message}`);
              }
            }
          } else {
            console.log(`⚠️ [${jobId}] Erreur chunk ${Math.floor(i/chunkSize) + 1}: ${error}`);
          }
        }
      }
      
      console.log(`💾 [${jobId}] Sauvegarde Supabase terminée: ${savedCount} nouveaux + ${updatedCount} mis à jour = ${savedCount + updatedCount}/${supabaseData.length} wallets traités`);
      job.supabase_saved = savedCount;
      job.supabase_updated = updatedCount;
      job.supabase_total_processed = savedCount + updatedCount;
      
    } catch (supabaseError) {
      console.error(`❌ [${jobId}] Erreur sauvegarde Supabase:`, supabaseError);
      job.supabase_error = supabaseError.message;
    }
  } catch (error) {
    console.error(`❌ [${jobId}] Erreur scraping:`, error);
    
    if (browser) {
      await browser.close();
    }
    
    job.status = 'failed';
    job.error = error.message;
    job.completed_at = new Date().toISOString();
    
    throw error;
  }
}

// Fonction de workflow complet : scraping + enrichissement
async function runCompleteWorkflow(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  console.log(`🚀 [${jobId}] Démarrage du workflow complet...`);
  job.status = 'running';
  job.started_at = new Date().toISOString();

  try {
    // Étape 1 : Scraping Dune
    console.log(`📊 [${jobId}] Étape 1/3 : Scraping Dune...`);
    job.stages.scraping.status = 'running';
    job.stages.scraping.started_at = new Date().toISOString();
    
    await scrapeDuneWallets(jobId);
    
    job.stages.scraping.status = 'completed';
    job.stages.scraping.completed_at = new Date().toISOString();
    console.log(`✅ [${jobId}] Scraping terminé: ${job.wallets_count} wallets`);

    // Attendre le délai configuré avant enrichissement
    if (job.enrich_delay > 0) {
      console.log(`⏳ [${jobId}] Attente de ${job.enrich_delay}s avant enrichissement...`);
      await new Promise(resolve => setTimeout(resolve, job.enrich_delay * 1000));
    }

    // Étape 2 : Enrichissement (si activé)
    if (job.auto_enrich && job.wallets && job.wallets.length > 0) {
      console.log(`🔍 [${jobId}] Étape 2/3 : Enrichissement de ${job.wallets.length} wallets...`);
      job.stages.enrichment.status = 'running';
      job.stages.enrichment.started_at = new Date().toISOString();
      
      await enrichWallets(jobId);
      
      job.stages.enrichment.status = 'completed';
      job.stages.enrichment.completed_at = new Date().toISOString();
      console.log(`✅ [${jobId}] Enrichissement terminé`);
    } else {
      console.log(`⏭️ [${jobId}] Enrichissement désactivé ou aucun wallet à enrichir`);
    }

    // Workflow terminé
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    console.log(`🎉 [${jobId}] Workflow complet terminé !`);

  } catch (error) {
    console.error(`❌ [${jobId}] Erreur workflow:`, error);
    job.status = 'failed';
    job.error = error.message;
    job.completed_at = new Date().toISOString();
    throw error;
  }
}

// Fonction d'enrichissement des wallets via l'API complete
async function enrichWallets(jobId) {
  const job = jobs.get(jobId);
  if (!job || !job.wallets) return;

  console.log(`🔍 [${jobId}] Démarrage enrichissement de ${job.wallets.length} wallets...`);
  
  const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
  const enrichmentApiUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-enrichment';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

  let enrichedCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Traiter les wallets par batch de 5 pour éviter la surcharge
  const batchSize = 5;
  const batches = [];
  
  for (let i = 0; i < job.wallets.length; i += batchSize) {
    batches.push(job.wallets.slice(i, i + batchSize));
  }

  console.log(`📦 [${jobId}] Traitement par ${batches.length} batches de ${batchSize} wallets...`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`🔄 [${jobId}] Batch ${batchIndex + 1}/${batches.length} (${batch.length} wallets)...`);

    // Traiter chaque wallet du batch en parallèle
    const batchPromises = batch.map(async (wallet) => {
      try {
        console.log(`🔍 [${jobId}] Enrichissement ${wallet.wallet}...`);
        
        const response = await fetch(enrichmentApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'apikey': apiKey
          },
          body: JSON.stringify({
            wallet_address: wallet.wallet,
            source: 'dune_scraper_workflow',
            job_id: jobId
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ [${jobId}] ${wallet.wallet} enrichi`);
          enrichedCount++;
          return { success: true, wallet: wallet.wallet, data: result };
        } else {
          const error = await response.text();
          console.log(`⚠️ [${jobId}] Erreur ${wallet.wallet}: ${error}`);
          errorCount++;
          errors.push({ wallet: wallet.wallet, error: error });
          return { success: false, wallet: wallet.wallet, error: error };
        }
      } catch (error) {
        console.log(`❌ [${jobId}] Exception ${wallet.wallet}: ${error.message}`);
        errorCount++;
        errors.push({ wallet: wallet.wallet, error: error.message });
        return { success: false, wallet: wallet.wallet, error: error.message };
      }
    });

    // Attendre que tous les wallets du batch soient traités
    await Promise.all(batchPromises);

    // Pause entre les batches pour éviter la surcharge de l'API
    if (batchIndex < batches.length - 1) {
      console.log(`⏳ [${jobId}] Pause 2s entre batches...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`📊 [${jobId}] Enrichissement terminé: ${enrichedCount} réussis, ${errorCount} erreurs`);
  
  // Stocker les résultats dans le job
  job.enrichment_results = {
    total_wallets: job.wallets.length,
    enriched_count: enrichedCount,
    error_count: errorCount,
    success_rate: Math.round((enrichedCount / job.wallets.length) * 100),
    errors: errors.slice(0, 10) // Garder seulement les 10 premières erreurs
  };

  return {
    enriched_count: enrichedCount,
    error_count: errorCount,
    total_wallets: job.wallets.length
  };
}

// Endpoint pour déclencher le workflow complet : scraping + enrichissement
app.post('/api/start-complete-workflow', authenticate, async (req, res) => {
  const { jobId, url, callback_url, auto_enrich = true, enrich_delay = 30 } = req.body;
  
  if (!jobId || !url) {
    return res.status(400).json({ error: 'jobId and url required' });
  }

  // Créer le job avec workflow complet
  const job = {
    id: jobId,
    status: 'pending',
    created_at: new Date().toISOString(),
    url: url,
    callback_url: callback_url,
    workflow_type: 'complete', // scraping + enrichissement
    auto_enrich: auto_enrich,
    enrich_delay: enrich_delay, // délai en secondes avant enrichissement
    stages: {
      scraping: { status: 'pending', started_at: null, completed_at: null },
      enrichment: { status: 'pending', started_at: null, completed_at: null }
    }
  };
  
  jobs.set(jobId, job);

  // Démarrer le workflow complet en arrière-plan
  runCompleteWorkflow(jobId).catch(error => {
    console.error(`❌ Workflow ${jobId} failed:`, error);
    const failedJob = jobs.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.error = error.message;
      failedJob.completed_at = new Date().toISOString();
    }
  });

  res.json({
    success: true,
    job_id: jobId,
    status: 'started',
    message: 'Workflow complet démarré (scraping + enrichissement)',
    created_at: job.created_at,
    url: job.url,
    workflow_stages: {
      '1': 'Scraping des wallets Dune',
      '2': `Enrichissement via API (délai: ${enrich_delay}s)`,
      '3': 'Persistance finale'
    },
    endpoints: {
      status: `/api/job-status/${jobId}`,
      results: `/api/job-results/${jobId}`,
      estimated_duration: `${5 + Math.ceil(enrich_delay/60)} à ${10 + Math.ceil(enrich_delay/60)} minutes`
    }
  });
});

// Endpoint pour déclencher uniquement l'enrichissement d'un job existant
app.post('/api/enrich-job/:jobId', authenticate, async (req, res) => {
  const { jobId } = req.params;
  const { force = false } = req.body;
  
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed' && !force) {
    return res.status(400).json({ 
      error: 'Job must be completed before enrichment. Use force=true to override.',
      status: job.status 
    });
  }

  if (!job.wallets || job.wallets.length === 0) {
    return res.status(400).json({ error: 'No wallets found in job to enrich' });
  }

  // Marquer le job pour enrichissement
  job.enrich_requested = true;
  job.enrich_force = force;
  job.stages = job.stages || {};
  job.stages.enrichment = { status: 'pending', started_at: null, completed_at: null };

  // Démarrer l'enrichissement en arrière-plan
  enrichWallets(jobId).catch(error => {
    console.error(`❌ Enrichment ${jobId} failed:`, error);
    const failedJob = jobs.get(jobId);
    if (failedJob && failedJob.stages) {
      failedJob.stages.enrichment.status = 'failed';
      failedJob.stages.enrichment.error = error.message;
      failedJob.stages.enrichment.completed_at = new Date().toISOString();
    }
  });

  res.json({
    success: true,
    job_id: jobId,
    message: 'Enrichissement démarré',
    wallets_to_enrich: job.wallets.length,
    estimated_duration: `${Math.ceil(job.wallets.length / 10)} à ${Math.ceil(job.wallets.length / 5)} minutes`
  });
});
