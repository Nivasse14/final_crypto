// extract-dune-top-traders.js
// Extraction paginée d'une table Dune (URL paramétrable, mapping dynamique des colonnes)
// Usage: node extract-dune-top-traders.js <URL_DUNE> [output.json] [output.csv]

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

// --- Configuration directe ---
const URL_DUNE = 'https://dune.com/couldbebasic/top-traders'; // <-- Mets ici ton URL Dune
const JSON_PATH = './dune_top_traders.json';
const CSV_PATH = './dune_top_traders.csv';

async function extractTable(url, jsonPath = 'dune_top_traders.json', csvPath = 'dune_top_traders.csv') {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Attendre que la table soit présente
  await page.waitForSelector('table');

  // Extraire dynamiquement les noms de colonnes
  const columns = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('table thead th'));
    return ths.map(th => th.innerText.trim().replace(/\s+/g, ' '));
  });

  // Détecter le nombre de pages
  const nbPages = await page.evaluate(() => {
    const select = document.querySelector('select[aria-label="Select page"]');
    if (!select) return 1;
    return select.options.length;
  });

  let allRows = [];
  for (let pageIdx = 0; pageIdx < nbPages; pageIdx++) {
    if (pageIdx > 0) {
      // Sélectionner la page suivante
      await page.select('select[aria-label="Select page"]', String(pageIdx));
      await page.waitForTimeout(1200); // attendre le rafraîchissement
    }
    // Extraire les lignes de la page courante
    const rows = await page.evaluate((columns) => {
      const trs = Array.from(document.querySelectorAll('table tbody tr'));
      return trs.map(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        let obj = {};
        tds.forEach((td, i) => {
          // Si le td contient un lien, prendre le href sinon le texte
          const a = td.querySelector('a');
          if (a) {
            if (columns[i].toLowerCase().includes('wallet')) {
              // Extraire l'adresse à la fin de l'URL
              const match = a.href.match(/account\/([\w\d]+)/);
              obj[columns[i]] = match ? match[1] : a.innerText.trim();
            } else {
              obj[columns[i]] = a.href || a.innerText.trim();
            }
          } else {
            obj[columns[i]] = td.innerText.trim();
          }
        });
        return obj;
      });
    }, columns);
    allRows = allRows.concat(rows);
    console.log(`Page ${pageIdx + 1}/${nbPages} : ${rows.length} lignes extraites`);
  }

  // Export JSON
  fs.writeFileSync(jsonPath, JSON.stringify(allRows, null, 2));
  console.log(`Export JSON : ${jsonPath}`);

  // Upload automatique sur Supabase
  try {
    const uploadFile = require('./upload-to-supabase');
    uploadFile(jsonPath);
  } catch (e) {
    console.error('Upload Supabase échoué:', e);
  }

  // Export CSV
  const csv = [columns.join(',')].concat(
    allRows.map(row => columns.map(col => '"' + String(row[col] || '').replace(/"/g, '""') + '"').join(','))
  ).join('\n');
  fs.writeFileSync(csvPath, csv);
  console.log(`Export CSV : ${csvPath}`);

  await browser.close();
}

// Lancer l'extraction
extractTable(URL_DUNE, JSON_PATH, CSV_PATH).catch(e => {
  console.error('Erreur extraction:', e);
  process.exit(1);
});

module.exports = extractTable;
