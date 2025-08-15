const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Utilise Chrome au lieu de Chromium
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage();

    console.log('🔐 Chargement de la page Dune...');
    await page.goto('https://dune.com/sunnypost/solana-top-trade-wallets-finder-last-days-v3', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForSelector('select[aria-label="Select page"]');

  const wallets = [];

  const totalPages = await page.$$eval('select[aria-label="Select page"] option', options => options.length);
  console.log(`📄 ${totalPages} pages détectées`);

  for (let i = 0; i < totalPages; i++) {
    console.log(`➡️ Page ${i + 1}`);

    // Sélectionner la page
    await page.select('select[aria-label="Select page"]', `${i}`);
    await page.waitForTimeout(5000); // attendre le chargement

    // Scraper tous les wallets de la page actuelle
    const data = await page.$$eval('table.table_table__FDV2P tbody tr', rows => {
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          wallet: cells[0]?.innerText.trim(),
          solscan: cells[1]?.querySelector('a')?.href || '',
          gmgn: cells[2]?.querySelector('a')?.href || '',
          cielo: cells[3]?.querySelector('a')?.href || '',
          wallet_pnl_link: cells[4]?.querySelector('a')?.href || '',
          wallet_pnl: cells[5]?.innerText.trim(),
          total_bought_usd: cells[6]?.innerText.trim(),
          total_pnl_usd: cells[7]?.innerText.trim(),
          roi: cells[8]?.innerText.trim(),
          mroi: cells[9]?.innerText.trim(),
          invalids: cells[10]?.innerText.trim(),
          tokens: cells[11]?.innerText.trim(),
          nosells: cells[12]?.innerText.trim(),
          losses: cells[13]?.innerText.trim(),
          nulls: cells[14]?.innerText.trim(),
          wins: cells[15]?.innerText.trim(),
          winrate: cells[16]?.innerText.trim(),
          w2x: cells[17]?.innerText.trim(),
          w10x: cells[18]?.innerText.trim(),
          w100x: cells[19]?.innerText.trim(),
          scalps: cells[20]?.innerText.trim(),
          scalp_ratio: cells[21]?.innerText.trim(),
          bal: cells[22]?.innerText.trim(),
          bal_ratio: cells[23]?.innerText.trim(),
          last_trade: cells[24]?.innerText.trim(),
          trade_days: cells[25]?.innerText.trim(),
          trade_nums: cells[26]?.innerText.trim(),
        };
      });
    });

    console.log(`✅ ${data.length} portefeuilles récupérés`);
    wallets.push(...data);
  }

  // Enregistrer dans un fichier JSON
  fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2));
  console.log(`💾 Données sauvegardées dans wallets.json`);

  // Upload automatique sur Supabase
  try {
    const uploadFile = require('./upload-to-supabase');
    uploadFile('wallets.json');
  } catch (e) {
    console.error('Upload Supabase échoué:', e);
  }

  await browser.close();
  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    process.exit(1);
  }
})();
