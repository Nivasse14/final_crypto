import { serve } from "std/server";
import puppeteer from "puppeteer";

serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) {
    return new Response(JSON.stringify({ error: "Paramètre address requis" }), { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = `https://gmgn.ai/sol/address/${address}`;
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(6000);

    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    // Extraction distribution
    const extractValue = (label: string) => {
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

    // Extraction metrics
    const get = (label: string, regex: RegExp) => {
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
    for (let i = 0; i < 10; i++) {
      const previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(1200);
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) break;
    }

    // Extraction du tableau Recent PnL
    const recentPnl = await page.evaluate(() => {
      const tabPanel = Array.from(document.querySelectorAll('.chakra-tabs__tab-panel'))
        .find(panel => (panel as HTMLElement).innerText.includes('Token'));
      if (!tabPanel) return [];
      const rows = tabPanel.querySelectorAll('tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        let token_address: string | null = null;
        const link = cells[0]?.querySelector('a');
        if (link) {
          const match = link.href.match(/address\/([A-Za-z0-9]+)/);
          token_address = match ? match[1] : link.href;
        }
        return {
          token: cells[0]?.textContent?.trim() ?? '',
          token_address,
          unrealized: cells[1]?.textContent?.trim() ?? '',
          realized_profit: cells[2]?.textContent?.trim() ?? '',
          total_profit: cells[3]?.textContent?.trim() ?? '',
          balance: cells[4]?.textContent?.trim() ?? '',
          position_percent: cells[5]?.textContent?.trim() ?? '',
          holding_duration: cells[6]?.textContent?.trim() ?? '',
          bought: cells[7]?.textContent?.trim() ?? '',
          sold: cells[8]?.textContent?.trim() ?? '',
          txs_30d: cells[9]?.textContent?.trim() ?? '',
        };
      });
    });

    // Enrichissement Dexscreener pour chaque token du recentPnl
    for (const [i, row] of recentPnl.entries()) {
      if (row.token_address && typeof row.token_address === 'string') {
        const match = row.token_address.match(/([A-Za-z0-9]+)$/);
        const tokenAddr = match ? match[1] : null;
        if (tokenAddr) {
          if (i > 0) await new Promise(res => setTimeout(res, 210));
          try {
            const url = `https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddr}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (Array.isArray(data) && data[0]) {
              const d = data[0];
              Object.assign(row, {
                market_cap_dexscreener: d.marketCap,
                liquidity_dexscreener: d.liquidity,
                priceChange_dexscreener: d.priceChange,
                volume_dexscreener: d.volume,
                txns_dexscreener: d.txns
              });
            }
          } catch {
            // ignore
          }
        }
      }
    }

    await browser.close();

    return new Response(JSON.stringify({
      address,
      distribution,
      metrics,
      recentPnl
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});