const puppeteer = require('puppeteer');

async function testDuneScraping() {
    console.log('🔍 Test local du scraping Dune...');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Mode visible pour debug
            devtools: true,
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
        
        // Configuration de la page
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log('📍 Navigation vers Dune...');
        await page.goto('https://dune.com/queries/3398959/5690442', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('⏳ Attente du chargement de la page...');
        await page.waitForTimeout(5000);

        // Injecter du CSS pour debug
        await page.addStyleTag({
            content: `
                * { border: 1px solid red !important; }
                .pagination-container { border: 3px solid green !important; }
                .result-table { border: 3px solid blue !important; }
            `
        });

        console.log('🔍 Recherche des sélecteurs de pagination...');
        
        const paginationSelectors = [
            'div[class*="pagination"]',
            'nav[aria-label*="pagination"]',
            'div[class*="page"]',
            'button[aria-label*="next"]',
            'button[aria-label*="page"]',
            '[data-testid*="pagination"]',
            '.ant-pagination',
            '.chakra-button-group',
            'div[role="navigation"]'
        ];

        let paginationFound = false;
        for (const selector of paginationSelectors) {
            try {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    console.log(`✅ Trouvé ${elements.length} élément(s) avec le sélecteur: ${selector}`);
                    
                    // Analyser chaque élément trouvé
                    for (let i = 0; i < elements.length; i++) {
                        const element = elements[i];
                        const text = await page.evaluate(el => el.textContent, element);
                        const className = await page.evaluate(el => el.className, element);
                        const tagName = await page.evaluate(el => el.tagName, element);
                        
                        console.log(`  Element ${i + 1}:`);
                        console.log(`    Tag: ${tagName}`);
                        console.log(`    Class: ${className}`);
                        console.log(`    Text: ${text.slice(0, 100)}...`);
                    }
                    paginationFound = true;
                }
            } catch (error) {
                console.log(`❌ Erreur avec le sélecteur ${selector}: ${error.message}`);
            }
        }

        if (!paginationFound) {
            console.log('❌ Aucun élément de pagination trouvé avec les sélecteurs standards');
            
            // Analyser le DOM pour trouver des éléments potentiels
            console.log('🔍 Analyse du DOM pour trouver des éléments de pagination...');
            
            const allButtons = await page.$$('button');
            console.log(`Trouvé ${allButtons.length} boutons sur la page`);
            
            for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
                const button = allButtons[i];
                const text = await page.evaluate(el => el.textContent, button);
                const className = await page.evaluate(el => el.className, button);
                const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), button);
                
                if (text.toLowerCase().includes('next') || 
                    text.toLowerCase().includes('page') ||
                    text.includes('>') ||
                    text.match(/\d+/) ||
                    (ariaLabel && (ariaLabel.toLowerCase().includes('next') || ariaLabel.toLowerCase().includes('page')))) {
                    
                    console.log(`  Bouton potentiel ${i + 1}:`);
                    console.log(`    Text: "${text}"`);
                    console.log(`    Class: "${className}"`);
                    console.log(`    Aria-label: "${ariaLabel}"`);
                }
            }
        }

        console.log('🔍 Recherche du tableau de résultats...');
        
        const tableSelectors = [
            'table',
            'div[class*="table"]',
            'div[class*="result"]',
            'div[role="table"]',
            '[data-testid*="table"]',
            '.ant-table',
            'div[class*="grid"]'
        ];

        let tableFound = false;
        for (const selector of tableSelectors) {
            try {
                const elements = await page.$$(selector);
                if (elements.length > 0) {
                    console.log(`✅ Trouvé ${elements.length} tableau(x) avec le sélecteur: ${selector}`);
                    tableFound = true;
                    
                    // Analyser le contenu du premier tableau
                    const firstTable = elements[0];
                    const rows = await page.evaluate(table => {
                        const rows = table.querySelectorAll('tr, div[role="row"]');
                        return Array.from(rows).slice(0, 5).map(row => row.textContent.slice(0, 200));
                    }, firstTable);
                    
                    console.log('  Premières lignes du tableau:');
                    rows.forEach((row, i) => console.log(`    ${i + 1}: ${row}...`));
                    break;
                }
            } catch (error) {
                console.log(`❌ Erreur avec le sélecteur de table ${selector}: ${error.message}`);
            }
        }

        if (!tableFound) {
            console.log('❌ Aucun tableau trouvé');
        }

        console.log('📱 Attente pour inspection manuelle... (30 secondes)');
        await page.waitForTimeout(30000);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Lancer le test
testDuneScraping().then(() => {
    console.log('✅ Test terminé');
    process.exit(0);
}).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
