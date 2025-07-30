const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const axios = require('axios');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/*onst wallets = [
  "CwN8wCtN2E2erJ3qJUr3KLq4yGRaEu3X5jxuKFAy3Gba",
  "2bdcq3CfFZfZ5e5RNMv4w3nTFHGzyJEM1cuFf8E4AQth"
];*/

// Charger le fichier JSON
const data = JSON.parse(fs.readFileSync('wallets.json', 'utf8'));

// Extraire toutes les adresses de portefeuille
const wallets = data.map(entry => entry.wallet);


(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const results = [];

  for (const wallet of wallets) {
    const url = `https://gmgn.ai/sol/address/${wallet}`;
    console.log(`\n🔍 Ouverture de ${wallet}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(6000);

      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText);

      // Extract Distribution
      const extractValue = (label) => {
        const regex = new RegExp(`${label.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}<\\/div>\\s*<div[^>]*>(.*?)<`, 'i');
        const match = html.match(regex);
        return match ? match[1].trim() : '';
      };

      const distribution = {
        '>500%': extractValue('&gt;500%'),
        '200% ~ 500%': extractValue('200% ~ 500%'),
        '0% ~ 200%': extractValue('0% ~ 200%'),
        '0% ~ -50%': extractValue('0% ~ -50%'),
        '<-50%': extractValue('&lt;-50%')
      };

      // Extract Data via Regex
      const get = (label, regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : null;
      };

      const metrics = {
        realized_pnl_percent: get("Realized PnL %", /7D Realized PnL\s+USD\s+([+\-\d.,%]+)/),
        realized_pnl_usd: get("Realized PnL USD", /7D Realized PnL\s+USD\s+[+\-\d.,%]+\s+(\$[\d.,Kk]+)/),
        win_rate: get("Win Rate", /Win Rate\s+(\d+[.,]?\d*%)/),
        total_pnl: get("Total PnL", /Total PnL<\/div><div[^>]*>([+\-$\d.,MKBk]+\s*\([+\-\d.,%]+\))/),
        unrealized_profits: get("Unrealized Profits", /Unrealized Profits\s+([+\-\$\d.,]+)/),
        transactions_7d: get("7D TXs", /7D TXs:\s*(\d+)/),
        balance_sol: get("Balance", /Bal\s+([\d.]+\s*SOL)/),
        balance_usd: get("Balance USD", /Bal\s+[\d.]+\s*SOL\s*\((\$[\d.,]+)\)/),
        avg_duration: get("Avg Duration", /7D Avg Duration\s*(\d+h)/),
        cost_7d: get("7D Cost", /7D Cost\s*(\$[\d.,Kk]+)/),
        avg_cost_7d: get("Avg Cost", /7D Avg Cost\s*(\$[\d.,]+)/),
        avg_realized_profits: get("Avg Realized Profits", /7D Avg Realized Profits\s*([+\-\$\d.,]+)/),
        fees_7d: get("Fees", /7D Fees\s*(\$[\d.,]+)/),
        blacklist: get("Blacklist", /Blacklist:\s*(\d+\s*\(\d+%\))/),
        didnt_buy: get("Didn't buy", /Didn't buy:\s*(\d+\s*\(\d+%\))/),
        sold_more: get("Sold > Bought", /Sold > Bought:\s*(\d+\s*\(\d+%\))/),
        buy_sell_5s: get("Buy/Sell within 5 secs", /Buy\/Sell within 5 secs:\s*(\d+\s*\(\d+\.\d+%\))/u),
    };

          // Scroll pour charger toutes les lignes du tableau Recent PnL
      let previousHeight;
      for (let i = 0; i < 10; i++) { // 10 scrolls max, à ajuster selon besoin
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitForTimeout(1200);
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break;
      }

      // Extraction du tableau Recent PnL
      const recentPnl = await page.evaluate(() => {
        // Trouver le tableau Recent PnL
        const tabPanel = Array.from(document.querySelectorAll('.chakra-tabs__tab-panel'))
          .find(panel => panel.innerText.includes('Token'));
        if (!tabPanel) return [];

        const rows = tabPanel.querySelectorAll('tbody tr');
        return Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td');
             let token_address = null;
    const link = cells[0]?.querySelector('a');
    if (link) {
      // Essaye de récupérer l'adresse dans l'URL (ex : /address/XYZ)
      const match = link.href.match(/address\/([A-Za-z0-9]+)/);
      if (match) token_address = match[1];
      else token_address = link.href;
    }
          return {
            token: cells[0]?.innerText.trim(),
            token_address,
            unrealized: cells[1]?.innerText.trim(),
            realized_profit: cells[2]?.innerText.trim(),
            total_profit: cells[3]?.innerText.trim(),
            balance: cells[4]?.innerText.trim(),
            position_percent: cells[5]?.innerText.trim(),
            holding_duration: cells[6]?.innerText.trim(),
            bought: cells[7]?.innerText.trim(),
            sold: cells[8]?.innerText.trim(),
            txs_30d: cells[9]?.innerText.trim(),
          };
        });
      });

      // Enrichissement Dexscreener pour chaque token du recentPnl
      for (const [i, row] of recentPnl.entries()) {
        if (row.token_address) {
          // Extraire l'adresse du token (après le dernier /)
          const match = row.token_address.match(/([A-Za-z0-9]+)$/);
          const tokenAddr = match ? match[1] : null;
          if (tokenAddr) {
            // Respect du rate-limit Dexscreener (300 req/min = 1 req/200ms)
            if (i > 0) await new Promise(res => setTimeout(res, 210));
            const dexInfo = await getDexscreenerInfo(tokenAddr);
            if (dexInfo) Object.assign(row, dexInfo);
          }
        }
      }
      results.push({
        wallet,
        distribution: enrichFields(distribution),
        metrics: enrichFields(metrics),
        recentPnl: enrichRecentPnlArrayWithScore(recentPnl)
      });

    } catch (err) {
      console.error(`❌ Erreur pour ${wallet}:`, err);
      results.push({ wallet, error: err.message });
    }
  }

  await browser.close();
  fs.writeFileSync("gmgn_all_data.json", JSON.stringify(results, null, 2));
  console.log("📁 Données enregistrées dans gmgn_all_data.json");

  // Upload automatique sur Supabase
  try {
    const uploadFile = require('./upload-to-supabase');
    uploadFile("gmgn_all_data.json");
  } catch (e) {
    console.error('Upload Supabase échoué:', e);
  }
})();

// Fonction utilitaire pour séparer valeur et pourcentage
function splitValuePercent(str) {
  if (!str || typeof str !== 'string') return { value: str, percent: null };
  // Cas "1 (100%)"
  let match = str.match(/^([\d.,KkMB$+\-]+)\s*\(([-+\d.,%]+)\)$/);
  if (match) return { value: match[1], percent: match[2] };
  // Cas "10 (25.64%)"
  match = str.match(/^([\d.,KkMB$+\-]+)\s*\(([-+\d.,%]+)\)$/);
  if (match) return { value: match[1], percent: match[2] };
  // Cas "+$5.6+6.5%" ou "+5.6+6.5%"
  match = str.match(/^([+$\-\d.,KkMB]+)\s*([+$\-\d.,]*)?([+\-\d.,]+%)/);
  if (match) return { value: (match[1] + (match[2]||'')), percent: match[3] };
  // Cas "$85.75$0.0001" (bought/sold)
  match = str.match(/^([$\d.,KkMB]+)\$([\d.,KkMB]+)/);
  if (match) return { value: match[1], percent: match[2] };
  // Cas "0%"
  match = str.match(/^([\d.,KkMB$+\-]+)%$/);
  if (match) return { value: null, percent: match[1] + '%' };
  // Cas "1/1"
  match = str.match(/^(\d+)\/(\d+)$/);
  if (match) return { value: match[1], percent: match[2] };
  return { value: str, percent: null };
}

// Enrichit un objet (distribution, metrics) en ajoutant _value et _percent
function enrichFields(obj) {
  const enriched = {};
  for (const key in obj) {
    const { value, percent } = splitValuePercent(obj[key]);
    enriched[key] = obj[key];
    if (value !== null && value !== obj[key]) enriched[key + '_value'] = value;
    if (percent !== null) enriched[key + '_percent'] = percent;
  }
  return enriched;
}

// Enrichit un tableau (recentPnl)
function enrichArray(arr) {
  return arr.map(row => {
    const enriched = { ...row };
    for (const key in row) {
      const { value, percent } = splitValuePercent(row[key]);
      if (value !== null && value !== row[key]) enriched[key + '_value'] = value;
      if (percent !== null) enriched[key + '_percent'] = percent;
    }
    return enriched;
  });
}

// Enrichit un tableau (recentPnl) avec des splits spécifiques
function enrichRecentPnlArray(arr) {
  return arr.map(row => {
    const enriched = { ...row };
    // Extraction spécifique du champ token
    if (row.token && typeof row.token === 'string') {
      // Exemples : "CT3d 4m", "泵5d 15m", "PumpTok6h 4h"
      const match = row.token.match(/^(.+?)(\d+[dhm])\s+(\d+[dhm])$/);
      if (match) {
        enriched.token_name = match[1];
        enriched.token_creation_time = match[2];
        enriched.token_last_tx_time = match[3];
      } else {
        // Cas où il n'y a pas d'espace (ex : "CT3d")
        const match2 = row.token.match(/^(.+?)(\d+[dhm])$/);
        if (match2) {
          enriched.token_name = match2[1];
          enriched.token_creation_time = match2[2];
        } else {
          enriched.token_name = row.token;
        }
      }
    }
    // realized_profit et total_profit : split valeur + pourcentage
    ["realized_profit", "total_profit"].forEach(key => {
      if (row[key] && typeof row[key] === 'string') {
        // Split sur le dernier + ou - (hors début de chaîne)
        const str = row[key];
        const lastSignIdx = Math.max(str.lastIndexOf('+'), str.lastIndexOf('-'));
        if (lastSignIdx > 0) {
          enriched[key + '_value'] = str.slice(0, lastSignIdx);
          enriched[key + '_percent'] = str.slice(lastSignIdx);
        }
      }
    });
    // bought et sold : split usd + price
    ["bought", "sold"].forEach(key => {
      if (row[key] && typeof row[key] === 'string') {
        const match = row[key].match(/^([$\d.,KkMB]+)\$([\d.,KkMB]+)/);
        if (match) {
          enriched[key + '_usd'] = match[1];
          enriched[key + '_price'] = match[2];
        }
      }
    });
    // txs_30d : split buy/sell
    if (row.txs_30d && typeof row.txs_30d === 'string') {
      const match = row.txs_30d.match(/^(\d+)\/(\d+)$/);
      if (match) {
        enriched.txs_30d_buy = match[1];
        enriched.txs_30d_sell = match[2];
      }
    }
    return enriched;
  });
}

// Fonction pour récupérer les infos Dexscreener (élément 0 du tableau)
async function getDexscreenerInfo(tokenAddress) {
  try {
    const url = `https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`;
    const resp = await axios.get(url);
    if (!Array.isArray(resp.data) || !resp.data[0]) return null;
    const d = resp.data[0];
    return {
      market_cap_dexscreener: (typeof d.marketCap === 'number' && d.marketCap > 0) ? d.marketCap : null,
      liquidity_dexscreener: d.liquidity || null,
      priceChange_dexscreener: d.priceChange || null,
      volume_dexscreener: d.volume || null,
      txns_dexscreener: d.txns || null
    };
  } catch (e) {
    return null;
  }
}

// Fonction pour générer les rawScores (0-10) à partir des données du token
function scoreFromRawData(token) {
  // Helpers pour normaliser sur 0-10
  const norm = (val, min, max) => {
    if (val == null || isNaN(val)) return 0;
    if (val <= min) return 0;
    if (val >= max) return 10;
    return ((val - min) / (max - min)) * 10;
  };
  // Critères (à adapter selon dispo des données)
  return {
    contractSafe: token.honeypotFree === true ? 10 : 7, // par défaut 7 si inconnu
    liquidityLocked: token.liquidity_dexscreener && token.liquidity_dexscreener.locked ? 10 : 5, // estimation
    marketCapReasonable: norm(token.market_cap_dexscreener, 10000, 10000000), // 10k-10M raisonnable
    creatorWalletTrust: 7, // inconnu, neutre
    holdersDistribution: norm(token.liquidity_dexscreener?.base || 0, 1000, 10000000),
    smartMoneyPresent: norm(parseFloat(token.realized_profit_value) || 0, 0, 100000),
    volumeLiquidityRatio: token.liquidity_dexscreener && token.volume_dexscreener ? norm(token.volume_dexscreener.h24 / token.liquidity_dexscreener.usd, 0, 10) : 0,
    activeCommunity: 5, // inconnu, neutre
    utilityRoadmap: 5, // inconnu, neutre
    honeypotFree: token.honeypotFree === true ? 10 : 7
  };
}

// Pondération et calcul du score final
function computeScore(rawScores) {
  const weights = {
    contractSafe: 0.20,
    liquidityLocked: 0.15,
    marketCapReasonable: 0.10,
    creatorWalletTrust: 0.10,
    holdersDistribution: 0.10,
    smartMoneyPresent: 0.10,
    volumeLiquidityRatio: 0.05,
    activeCommunity: 0.05,
    utilityRoadmap: 0.10,
    honeypotFree: 0.05
  };
  let score = 0;
  for (const k in rawScores) {
    score += (rawScores[k] || 0) * (weights[k] || 0);
  }
  return Math.round(score * 10); // sur 100
}

// Interprétation du score
function interpretScore(score) {
  if (score >= 80) return 'Faible risque';
  if (score >= 60) return 'Risque modéré';
  if (score >= 40) return 'Risque élevé';
  return 'Risque extrême';
}

// Ajout du score à chaque token de recentPnl
function enrichRecentPnlArrayWithScore(arr) {
  return enrichRecentPnlArray(arr).map(token => {
    const rawScores = scoreFromRawData(token);
    const score = computeScore(rawScores);
    const interpretation = interpretScore(score);
    return { ...token, rawScores, score, interpretation };
  });
}
