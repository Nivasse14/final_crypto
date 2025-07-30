const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const express = require('express');

puppeteer.use(StealthPlugin());

// API Express pour récupérer les données Cielo
const app = express();
app.use(express.json());

// Cache pour éviter les requêtes répétées
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware pour les CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

class CieloScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.logFile = 'cielo_scraping.log';
  }

  // Fonction de logging
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}${data ? ` - ${JSON.stringify(data)}` : ''}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(this.logFile, logEntry);
  }

  // Initialiser le navigateur
  async initBrowser() {
    try {
      this.log('Initialisation du navigateur...');
      
      this.browser = await puppeteer.launch({
        headless: false, // Mode visible pour les interactions wallet
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080'
        ],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.log('Navigateur initialisé avec succès');
      return true;
    } catch (error) {
      this.log('Erreur lors de l\'initialisation du navigateur', error.message);
      return false;
    }
  }

  // Naviguer vers cielo.com
  async navigateToCielo() {
    try {
      this.log('Navigation vers cielo.com...');
      
      await this.page.goto('https://cielo.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Attendre que la page soit complètement chargée
      await this.page.waitForTimeout(3000);
      
      this.log('Page cielo.com chargée avec succès');
      return true;
    } catch (error) {
      this.log('Erreur lors de la navigation vers cielo.com', error.message);
      return false;
    }
  }

  // Connecter le wallet Phantom
  async connectPhantomWallet() {
    try {
      this.log('Tentative de connexion du wallet Phantom...');
      
      // Chercher le bouton de connexion wallet
      const connectSelectors = [
        '[data-testid="connect-wallet"]',
        'button[class*="connect"]',
        'button:contains("Connect Wallet")',
        'button:contains("Connect")',
        '.wallet-connect-button',
        '#connect-wallet'
      ];

      let connectButton = null;
      for (const selector of connectSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          connectButton = await this.page.$(selector);
          if (connectButton) {
            this.log(`Bouton de connexion trouvé avec le sélecteur: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer avec le sélecteur suivant
        }
      }

      if (!connectButton) {
        // Chercher par texte
        connectButton = await this.page.$x("//button[contains(text(), 'Connect') or contains(text(), 'connect')]");
        if (connectButton.length > 0) {
          connectButton = connectButton[0];
          this.log('Bouton de connexion trouvé par recherche textuelle');
        }
      }

      if (!connectButton) {
        this.log('Aucun bouton de connexion wallet trouvé');
        return false;
      }

      // Cliquer sur le bouton de connexion
      await connectButton.click();
      this.log('Clic sur le bouton de connexion effectué');
      
      // Attendre la modal de sélection de wallet
      await this.page.waitForTimeout(2000);

      // Chercher et cliquer sur Phantom
      const phantomSelectors = [
        'button:contains("Phantom")',
        '[data-wallet="phantom"]',
        '.phantom-wallet',
        'img[alt*="Phantom"]'
      ];

      let phantomButton = null;
      for (const selector of phantomSelectors) {
        try {
          phantomButton = await this.page.$(selector);
          if (phantomButton) break;
        } catch (e) {
          // Continuer
        }
      }

      if (!phantomButton) {
        // Chercher par texte
        const phantomElements = await this.page.$x("//button[contains(text(), 'Phantom')] | //div[contains(text(), 'Phantom')]");
        if (phantomElements.length > 0) {
          phantomButton = phantomElements[0];
        }
      }

      if (!phantomButton) {
        this.log('Bouton Phantom non trouvé');
        return false;
      }

      await phantomButton.click();
      this.log('Clic sur Phantom effectué');

      // Attendre l'ouverture de Phantom et l'interaction manuelle
      this.log('⚠️  INTERACTION MANUELLE REQUISE ⚠️');
      this.log('Veuillez approuver la connexion dans votre extension Phantom');
      this.log('Vous avez 30 secondes pour effectuer cette action...');
      
      // Attendre 30 secondes pour l'interaction manuelle
      await this.page.waitForTimeout(30000);

      // Vérifier si la connexion a réussi
      const isConnected = await this.checkWalletConnection();
      if (isConnected) {
        this.log('✅ Wallet connecté avec succès');
        return true;
      } else {
        this.log('❌ Échec de la connexion du wallet');
        return false;
      }

    } catch (error) {
      this.log('Erreur lors de la connexion du wallet Phantom', error.message);
      return false;
    }
  }

  // Vérifier si le wallet est connecté
  async checkWalletConnection() {
    try {
      // Indicateurs de connexion réussie
      const connectedSelectors = [
        '[data-testid="wallet-connected"]',
        '.wallet-connected',
        '[data-connected="true"]',
        '.connected-wallet',
        '[class*="connected"]'
      ];

      for (const selector of connectedSelectors) {
        const element = await this.page.$(selector);
        if (element) return true;
      }

      // Chercher une adresse de wallet affichée (commence généralement par des caractères alphanumériques)
      const walletAddressPattern = await this.page.$x("//span[string-length(text()) > 30 and string-length(text()) < 50]");
      if (walletAddressPattern.length > 0) return true;

      return false;
    } catch (error) {
      return false;
    }
  }

  // Scraper les données principales de cielo.com
  async scrapeData() {
    try {
      this.log('Début du scraping des données...');
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      const scrapedData = await this.page.evaluate(() => {
        const data = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          wallet_info: {},
          portfolio: [],
          transactions: [],
          analytics: {}
        };

        // Scraper les informations du wallet
        try {
          const walletElements = document.querySelectorAll('[class*="wallet"], [data-testid*="wallet"]');
          walletElements.forEach(el => {
            if (el.textContent && el.textContent.trim().length > 10) {
              data.wallet_info.address = el.textContent.trim();
            }
          });
        } catch (e) {
          console.log('Erreur wallet info:', e);
        }

        // Scraper le portfolio
        try {
          const portfolioElements = document.querySelectorAll('[class*="token"], [class*="asset"], [class*="holding"]');
          portfolioElements.forEach(el => {
            const tokenData = {
              name: '',
              symbol: '',
              balance: '',
              value: '',
              change: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"]');
            if (nameEl) tokenData.name = nameEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="price"]');
            if (valueEl) tokenData.value = valueEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"]');
            if (changeEl) tokenData.change = changeEl.textContent.trim();

            if (tokenData.name || tokenData.balance) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll('[class*="transaction"], [class*="activity"], tr');
          transactionElements.forEach((el, index) => {
            if (index < 20) { // Limiter à 20 transactions
              const txData = {
                type: '',
                token: '',
                amount: '',
                timestamp: '',
                hash: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                if (cells[3]) txData.timestamp = cells[3].textContent.trim();
              }

              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"]');
              if (linkEl) {
                txData.hash = linkEl.href;
              }

              if (txData.type || txData.token) {
                data.transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Scraper les métriques/analytics
        try {
          const metricElements = document.querySelectorAll('[class*="metric"], [class*="stat"], [class*="analytics"]');
          metricElements.forEach(el => {
            const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
            const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
            
            if (label && value) {
              data.analytics[label] = value;
            }
          });
        } catch (e) {
          console.log('Erreur analytics:', e);
        }

        // Scraper tous les textes contenant des adresses Solana (44 caractères base58)
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.solana_addresses = [...new Set(addresses)]; // Supprimer les doublons
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      });

      this.log('Données scrapées avec succès', { 
        portfolio_items: scrapedData.portfolio.length,
        transactions: scrapedData.transactions.length,
        addresses_found: scrapedData.solana_addresses?.length || 0
      });

      return scrapedData;

    } catch (error) {
      this.log('Erreur lors du scraping', error.message);
      return null;
    }
  }

  // Sauvegarder les données
  async saveData(data, filename = null) {
    try {
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `cielo_data_${timestamp}.json`;
      }

      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      
      this.log(`Données sauvegardées dans: ${filepath}`);
      return filepath;
    } catch (error) {
      this.log('Erreur lors de la sauvegarde', error.message);
      return null;
    }
  }

  // Scraper les données pour un portefeuille spécifique
  async scrapeWalletData(walletAddress) {
    try {
      this.log(`Scraping des données pour le wallet: ${walletAddress}`);
      
      // Si on a déjà une page ouverte, l'utiliser, sinon en créer une nouvelle
      if (!this.page) {
        const browserInit = await this.initBrowser();
        if (!browserInit) {
          throw new Error('Échec de l\'initialisation du navigateur');
        }
      }

      // Naviguer vers la page du wallet sur cielo.com
      const walletUrl = `https://cielo.com/wallet/${walletAddress}`;
      this.log(`Navigation vers: ${walletUrl}`);
      
      await this.page.goto(walletUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      // Scraper les données spécifiques au wallet
      const walletData = await this.page.evaluate((address) => {
        const data = {
          wallet_address: address,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          portfolio: [],
          balance_overview: {},
          recent_transactions: [],
          performance: {},
          holdings: []
        };

        // Scraper le portfolio du wallet
        try {
          const portfolioElements = document.querySelectorAll(
            '[class*="token"], [class*="asset"], [class*="holding"], [class*="position"], tbody tr'
          );
          
          portfolioElements.forEach(el => {
            const tokenData = {
              token_name: '',
              token_symbol: '',
              token_address: '',
              balance: '',
              usd_value: '',
              price: '',
              change_24h: '',
              percentage_of_portfolio: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"], td:first-child');
            if (nameEl) tokenData.token_name = nameEl.textContent.trim();

            const symbolEl = el.querySelector('[class*="symbol"], [data-testid*="symbol"]');
            if (symbolEl) tokenData.token_symbol = symbolEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"], [class*="quantity"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="usd"], [class*="dollar"]');
            if (valueEl) tokenData.usd_value = valueEl.textContent.trim();

            const priceEl = el.querySelector('[class*="price"]');
            if (priceEl) tokenData.price = priceEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"], [class*="+"], [class*="-"]');
            if (changeEl) tokenData.change_24h = changeEl.textContent.trim();

            // Extraire l'adresse du token depuis les liens
            const linkEl = el.querySelector('a[href*="token"], a[href*="address"]');
            if (linkEl) {
              const match = linkEl.href.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
              if (match) tokenData.token_address = match[1];
            }

            if (tokenData.token_name || tokenData.balance || tokenData.usd_value) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les métriques globales du wallet
        try {
          const balanceElements = document.querySelectorAll(
            '[class*="balance"], [class*="total"], [class*="worth"], [class*="value"]'
          );
          
          balanceElements.forEach(el => {
            const text = el.textContent.trim();
            if (text.includes('$') && text.match(/\$[\d,.]+(K|M|B)?/)) {
              if (text.toLowerCase().includes('total') || text.toLowerCase().includes('net')) {
                data.balance_overview.total_value = text;
              } else if (text.toLowerCase().includes('24h') || text.toLowerCase().includes('change')) {
                data.balance_overview.change_24h = text;
              }
            }
          });

          // Chercher des métriques spécifiques
          const metricSelectors = [
            '[data-testid*="balance"]',
            '[data-testid*="value"]',
            '[class*="metric"]',
            '[class*="stat"]'
          ];

          metricSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
              const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
              if (label && value) {
                data.performance[label] = value;
              }
            });
          });
        } catch (e) {
          console.log('Erreur métriques:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll(
            '[class*="transaction"], [class*="activity"], [class*="history"] tr'
          );
          
          transactionElements.forEach((el, index) => {
            if (index < 50) { // Limiter à 50 transactions
              const txData = {
                type: '',
                token_symbol: '',
                amount: '',
                usd_value: '',
                timestamp: '',
                tx_hash: '',
                status: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token_symbol = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                
                if (cells[3]) txData.usd_value = cells[3].textContent.trim();
                if (cells[4]) txData.timestamp = cells[4].textContent.trim();
                if (cells[5]) txData.status = cells[5].textContent.trim();
              }

              // Extraire le hash de transaction
              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"], a[href*="tx"]');
              if (linkEl) {
                txData.tx_hash = linkEl.href;
              }

              if (txData.type || txData.token_symbol || txData.amount) {
                data.recent_transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Extraire toutes les adresses Solana trouvées
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.found_addresses = [...new Set(addresses)].filter(addr => addr !== address);
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      }, walletAddress);

      this.log('Données du wallet scrapées avec succès', { 
        portfolio_items: walletData.portfolio.length,
        transactions: walletData.recent_transactions.length,
        addresses_found: walletData.found_addresses?.length || 0
      });

      return walletData;

    } catch (error) {
      this.log('Erreur lors du scraping du wallet', error.message);
      return null;
    }
  }

  // Fermer le navigateur
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Navigateur fermé');
      }
    } catch (error) {
      this.log('Erreur lors de la fermeture', error.message);
    }
  }

  // Méthode de test pour la connexion Phantom uniquement
  async testPhantomConnection() {
    try {
      this.log('🧪 Test de connexion Phantom...');

      // Initialiser le navigateur
      const browserInit = await this.initBrowser();
      if (!browserInit) {
        throw new Error('Échec de l\'initialisation du navigateur');
      }

      // Naviguer vers cielo.com
      const navigation = await this.navigateToCielo();
      if (!navigation) {
        throw new Error('Échec de la navigation vers cielo.com');
      }

      // Essayer de connecter Phantom
      const phantomConnection = await this.connectPhantomWallet();
      
      if (phantomConnection) {
        this.log('✅ Test Phantom réussi - Wallet connecté');
        
        // Vérifier les informations du wallet connecté
        const walletInfo = await this.page.evaluate(() => {
          // Chercher des éléments qui pourraient contenir l'adresse du wallet
          const possibleWalletElements = [
            ...document.querySelectorAll('[class*="wallet"]'),
            ...document.querySelectorAll('[data-testid*="wallet"]'),
            ...document.querySelectorAll('[class*="address"]'),
            ...document.querySelectorAll('[class*="connected"]')
          ];

          const info = {
            connected: true,
            wallet_address: null,
            display_text: []
          };

          possibleWalletElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
              info.display_text.push(text);
              // Chercher une adresse Solana (format base58)
              const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
              if (match && !info.wallet_address) {
                info.wallet_address = match[0];
              }
            }
          });

          return info;
        });

        this.log('📊 Informations du wallet connecté:', walletInfo);
        
        return {
          success: true,
          phantom_connected: true,
          wallet_info: walletInfo,
          test_completed_at: new Date().toISOString()
        };
      } else {
        this.log('❌ Test Phantom échoué - Wallet non connecté');
        
        return {
          success: false,
          phantom_connected: false,
          error: 'Échec de la connexion Phantom',
          test_completed_at: new Date().toISOString()
        };
      }

    } catch (error) {
      this.log('❌ Erreur lors du test Phantom', error.message);
      return {
        success: false,
        phantom_connected: false,
        error: error.message,
        test_completed_at: new Date().toISOString()
      };
    } finally {
      await this.close();
    }
  }

  // Méthode pour automatiser complètement la connexion Phantom
  async autoConnectPhantom() {
    try {
      this.log('🤖 Connexion automatique Phantom...');

      // Initialiser le navigateur avec un profil utilisateur persistant
      const browserInit = await this.initBrowserWithProfile();
      if (!browserInit) {
        throw new Error('Échec de l\'initialisation du navigateur');
      }

      // Naviguer vers cielo.com
      const navigation = await this.navigateToCielo();
      if (!navigation) {
        throw new Error('Échec de la navigation vers cielo.com');
      }

      // Essayer de connecter automatiquement
      const phantomConnection = await this.autoConnectPhantomWallet();
      
      return {
        success: phantomConnection,
        phantom_connected: phantomConnection,
        auto_connection: true,
        test_completed_at: new Date().toISOString()
      };

    } catch (error) {
      this.log('❌ Erreur lors de la connexion auto Phantom', error.message);
      return {
        success: false,
        phantom_connected: false,
        error: error.message,
        auto_connection: true,
        test_completed_at: new Date().toISOString()
      };
    } finally {
      await this.close();
    }
  }

  // Initialiser le navigateur avec un profil utilisateur persistant
  async initBrowserWithProfile() {
    try {
      this.log('Initialisation du navigateur avec profil utilisateur...');
      
      // Créer un dossier pour le profil utilisateur
      const userDataDir = path.join(__dirname, 'chrome-profile');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      this.browser = await puppeteer.launch({
        headless: false, // Mode visible pour voir ce qui se passe
        userDataDir: userDataDir, // Profil persistant
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          // Arguments pour charger l'extension Phantom
          `--load-extension=${this.getPhantomExtensionPath()}`,
          '--disable-extensions-except=' + this.getPhantomExtensionPath()
        ],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.log('Navigateur avec profil initialisé avec succès');
      return true;
    } catch (error) {
      this.log('Erreur lors de l\'initialisation du navigateur avec profil', error.message);
      return false;
    }
  }

  // Obtenir le chemin de l'extension Phantom
  getPhantomExtensionPath() {
    // Chemins possibles pour l'extension Phantom sur macOS
    const possiblePaths = [
      '/Users/' + process.env.USER + '/Library/Application Support/Google/Chrome/Default/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      '/Users/' + process.env.USER + '/Library/Application Support/Google/Chrome/Profile 1/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      // Ajoutez d'autres chemins selon votre configuration
    ];

    for (const basePath of possiblePaths) {
      if (fs.existsSync(basePath)) {
        // Trouver la version la plus récente
        const versions = fs.readdirSync(basePath).filter(v => !v.startsWith('.'));
        if (versions.length > 0) {
          const latestVersion = versions.sort().pop();
          const fullPath = path.join(basePath, latestVersion);
          this.log(`Extension Phantom trouvée: ${fullPath}`);
          return fullPath;
        }
      }
    }

    // Si non trouvé, retourner un chemin par défaut (peut nécessiter une installation manuelle)
    this.log('⚠️ Extension Phantom non trouvée automatiquement');
    return '/tmp/phantom-extension'; // Vous devrez extraire l'extension ici
  }

  // Connexion automatique à Phantom
  async autoConnectPhantomWallet() {
    try {
      this.log('🤖 Tentative de connexion automatique Phantom...');

      // Attendre que Phantom soit prêt
      await this.page.waitForTimeout(3000);

      // Vérifier si Phantom est déjà connecté
      const alreadyConnected = await this.checkWalletConnection();
      if (alreadyConnected) {
        this.log('✅ Phantom déjà connecté');
        return true;
      }

      // Chercher le bouton de connexion wallet
      const connectSelectors = [
        '[data-testid="connect-wallet"]',
        'button[class*="connect"]',
        'button:contains("Connect Wallet")',
        'button:contains("Connect")',
        '.wallet-connect-button',
        '#connect-wallet'
      ];

      let connectButton = null;
      for (const selector of connectSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          connectButton = await this.page.$(selector);
          if (connectButton) {
            this.log(`Bouton de connexion trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!connectButton) {
        // Chercher par texte avec XPath
        const xpathButtons = await this.page.$x("//button[contains(text(), 'Connect') or contains(text(), 'connect')]");
        if (xpathButtons.length > 0) {
          connectButton = xpathButtons[0];
          this.log('Bouton de connexion trouvé par XPath');
        }
      }

      if (!connectButton) {
        this.log('❌ Aucun bouton de connexion trouvé');
        return false;
      }

      // Cliquer sur le bouton de connexion
      await connectButton.click();
      this.log('✅ Clic sur le bouton de connexion');
      
      // Attendre la modal de sélection de wallet
      await this.page.waitForTimeout(2000);

      // Chercher et cliquer sur Phantom
      const phantomSelectors = [
        'button:contains("Phantom")',
        '[data-wallet="phantom"]',
        '.phantom-wallet',
        'img[alt*="Phantom"]',
        '[title*="Phantom"]'
      ];

      let phantomButton = null;
      for (const selector of phantomSelectors) {
        try {
          phantomButton = await this.page.$(selector);
          if (phantomButton) {
            this.log(`Bouton Phantom trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!phantomButton) {
        // Chercher par texte avec XPath
        const xpathPhantom = await this.page.$x("//button[contains(text(), 'Phantom')] | //div[contains(text(), 'Phantom')] | //span[contains(text(), 'Phantom')]");
        if (xpathPhantom.length > 0) {
          phantomButton = xpathPhantom[0];
          this.log('Bouton Phantom trouvé par XPath');
        }
      }

      if (!phantomButton) {
        this.log('❌ Bouton Phantom non trouvé');
        return false;
      }

      // Cliquer sur Phantom
      await phantomButton.click();
      this.log('✅ Clic sur Phantom');

      // Attendre l'ouverture de la popup Phantom
      await this.page.waitForTimeout(2000);

      // Gérer automatiquement la popup Phantom
      const phantomApproved = await this.autoApprovePhantom();
      
      if (phantomApproved) {
        // Vérifier la connexion finale
        await this.page.waitForTimeout(3000);
        const finalCheck = await this.checkWalletConnection();
        
        if (finalCheck) {
          this.log('✅ Connexion Phantom automatique réussie');
          return true;
        } else {
          this.log('❌ Connexion Phantom échouée - vérification finale');
          return false;
        }
      } else {
        this.log('❌ Approbation Phantom automatique échouée');
        return false;
      }

    } catch (error) {
      this.log('❌ Erreur connexion auto Phantom', error.message);
      return false;
    }
  }

  // Approuver automatiquement dans la popup Phantom
  async autoApprovePhantom() {
    try {
      this.log('🤖 Approbation automatique Phantom...');

      // Attendre qu'une nouvelle page/popup s'ouvre
      const pages = await this.browser.pages();
      let phantomPage = null;

      // Chercher la page Phantom (souvent la dernière ouverte)
      for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i];
        const url = page.url();
        if (url.includes('phantom') || url.includes('extension') || url.includes('chrome-extension://')) {
          phantomPage = page;
          this.log(`Page Phantom trouvée: ${url}`);
          break;
        }
      }

      if (!phantomPage) {
        this.log('❌ Page Phantom non trouvée');
        return false;
      }

      // Attendre que la page soit chargée
      await phantomPage.waitForTimeout(2000);

      // Chercher le bouton "Connect" ou "Approve" dans Phantom
      const approveSelectors = [
        'button[data-testid="connect-button"]',
        'button[data-testid="approve-button"]',
        'button:contains("Connect")',
        'button:contains("Approve")',
        'button:contains("Allow")',
        '.approve-button',
        '.connect-button'
      ];

      let approveButton = null;
      for (const selector of approveSelectors) {
        try {
          await phantomPage.waitForSelector(selector, { timeout: 3000 });
          approveButton = await phantomPage.$(selector);
          if (approveButton) {
            this.log(`Bouton d'approbation trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!approveButton) {
        // Chercher par texte avec XPath
        const xpathApprove = await phantomPage.$x("//button[contains(text(), 'Connect') or contains(text(), 'Approve') or contains(text(), 'Allow')]");
        if (xpathApprove.length > 0) {
          approveButton = xpathApprove[0];
          this.log('Bouton d\'approbation trouvé par XPath');
        }
      }

      if (!approveButton) {
        this.log('❌ Bouton d\'approbation non trouvé');
        return false;
      }

      // Cliquer sur le bouton d'approbation
      await approveButton.click();
      this.log('✅ Clic sur le bouton d\'approbation');

      // Attendre la fermeture de la popup
      await phantomPage.waitForTimeout(2000);

      return true;

    } catch (error) {
      this.log('❌ Erreur approbation auto Phantom', error.message);
      return false;
    }
  }

  // Scraper les données principales de cielo.com
  async scrapeData() {
    try {
      this.log('Début du scraping des données...');
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      const scrapedData = await this.page.evaluate(() => {
        const data = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          wallet_info: {},
          portfolio: [],
          transactions: [],
          analytics: {}
        };

        // Scraper les informations du wallet
        try {
          const walletElements = document.querySelectorAll('[class*="wallet"], [data-testid*="wallet"]');
          walletElements.forEach(el => {
            if (el.textContent && el.textContent.trim().length > 10) {
              data.wallet_info.address = el.textContent.trim();
            }
          });
        } catch (e) {
          console.log('Erreur wallet info:', e);
        }

        // Scraper le portfolio
        try {
          const portfolioElements = document.querySelectorAll('[class*="token"], [class*="asset"], [class*="holding"]');
          portfolioElements.forEach(el => {
            const tokenData = {
              name: '',
              symbol: '',
              balance: '',
              value: '',
              change: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"]');
            if (nameEl) tokenData.name = nameEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="price"]');
            if (valueEl) tokenData.value = valueEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"]');
            if (changeEl) tokenData.change = changeEl.textContent.trim();

            if (tokenData.name || tokenData.balance) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll('[class*="transaction"], [class*="activity"], tr');
          transactionElements.forEach((el, index) => {
            if (index < 20) { // Limiter à 20 transactions
              const txData = {
                type: '',
                token: '',
                amount: '',
                timestamp: '',
                hash: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                if (cells[3]) txData.timestamp = cells[3].textContent.trim();
              }

              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"]');
              if (linkEl) {
                txData.hash = linkEl.href;
              }

              if (txData.type || txData.token) {
                data.transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Scraper les métriques/analytics
        try {
          const metricElements = document.querySelectorAll('[class*="metric"], [class*="stat"], [class*="analytics"]');
          metricElements.forEach(el => {
            const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
            const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
            
            if (label && value) {
              data.analytics[label] = value;
            }
          });
        } catch (e) {
          console.log('Erreur analytics:', e);
        }

        // Scraper tous les textes contenant des adresses Solana (44 caractères base58)
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.solana_addresses = [...new Set(addresses)]; // Supprimer les doublons
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      });

      this.log('Données scrapées avec succès', { 
        portfolio_items: scrapedData.portfolio.length,
        transactions: scrapedData.transactions.length,
        addresses_found: scrapedData.solana_addresses?.length || 0
      });

      return scrapedData;

    } catch (error) {
      this.log('Erreur lors du scraping', error.message);
      return null;
    }
  }

  // Sauvegarder les données
  async saveData(data, filename = null) {
    try {
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `cielo_data_${timestamp}.json`;
      }

      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      
      this.log(`Données sauvegardées dans: ${filepath}`);
      return filepath;
    } catch (error) {
      this.log('Erreur lors de la sauvegarde', error.message);
      return null;
    }
  }

  // Scraper les données pour un portefeuille spécifique
  async scrapeWalletData(walletAddress) {
    try {
      this.log(`Scraping des données pour le wallet: ${walletAddress}`);
      
      // Si on a déjà une page ouverte, l'utiliser, sinon en créer une nouvelle
      if (!this.page) {
        const browserInit = await this.initBrowser();
        if (!browserInit) {
          throw new Error('Échec de l\'initialisation du navigateur');
        }
      }

      // Naviguer vers la page du wallet sur cielo.com
      const walletUrl = `https://cielo.com/wallet/${walletAddress}`;
      this.log(`Navigation vers: ${walletUrl}`);
      
      await this.page.goto(walletUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      // Scraper les données spécifiques au wallet
      const walletData = await this.page.evaluate((address) => {
        const data = {
          wallet_address: address,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          portfolio: [],
          balance_overview: {},
          recent_transactions: [],
          performance: {},
          holdings: []
        };

        // Scraper le portfolio du wallet
        try {
          const portfolioElements = document.querySelectorAll(
            '[class*="token"], [class*="asset"], [class*="holding"], [class*="position"], tbody tr'
          );
          
          portfolioElements.forEach(el => {
            const tokenData = {
              token_name: '',
              token_symbol: '',
              token_address: '',
              balance: '',
              usd_value: '',
              price: '',
              change_24h: '',
              percentage_of_portfolio: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"], td:first-child');
            if (nameEl) tokenData.token_name = nameEl.textContent.trim();

            const symbolEl = el.querySelector('[class*="symbol"], [data-testid*="symbol"]');
            if (symbolEl) tokenData.token_symbol = symbolEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"], [class*="quantity"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="usd"], [class*="dollar"]');
            if (valueEl) tokenData.usd_value = valueEl.textContent.trim();

            const priceEl = el.querySelector('[class*="price"]');
            if (priceEl) tokenData.price = priceEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"], [class*="+"], [class*="-"]');
            if (changeEl) tokenData.change_24h = changeEl.textContent.trim();

            // Extraire l'adresse du token depuis les liens
            const linkEl = el.querySelector('a[href*="token"], a[href*="address"]');
            if (linkEl) {
              const match = linkEl.href.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
              if (match) tokenData.token_address = match[1];
            }

            if (tokenData.token_name || tokenData.balance || tokenData.usd_value) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les métriques globales du wallet
        try {
          const balanceElements = document.querySelectorAll(
            '[class*="balance"], [class*="total"], [class*="worth"], [class*="value"]'
          );
          
          balanceElements.forEach(el => {
            const text = el.textContent.trim();
            if (text.includes('$') && text.match(/\$[\d,.]+(K|M|B)?/)) {
              if (text.toLowerCase().includes('total') || text.toLowerCase().includes('net')) {
                data.balance_overview.total_value = text;
              } else if (text.toLowerCase().includes('24h') || text.toLowerCase().includes('change')) {
                data.balance_overview.change_24h = text;
              }
            }
          });

          // Chercher des métriques spécifiques
          const metricSelectors = [
            '[data-testid*="balance"]',
            '[data-testid*="value"]',
            '[class*="metric"]',
            '[class*="stat"]'
          ];

          metricSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
              const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
              if (label && value) {
                data.performance[label] = value;
              }
            });
          });
        } catch (e) {
          console.log('Erreur métriques:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll(
            '[class*="transaction"], [class*="activity"], [class*="history"] tr'
          );
          
          transactionElements.forEach((el, index) => {
            if (index < 50) { // Limiter à 50 transactions
              const txData = {
                type: '',
                token_symbol: '',
                amount: '',
                usd_value: '',
                timestamp: '',
                tx_hash: '',
                status: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token_symbol = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                
                if (cells[3]) txData.usd_value = cells[3].textContent.trim();
                if (cells[4]) txData.timestamp = cells[4].textContent.trim();
                if (cells[5]) txData.status = cells[5].textContent.trim();
              }

              // Extraire le hash de transaction
              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"], a[href*="tx"]');
              if (linkEl) {
                txData.tx_hash = linkEl.href;
              }

              if (txData.type || txData.token_symbol || txData.amount) {
                data.recent_transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Extraire toutes les adresses Solana trouvées
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.found_addresses = [...new Set(addresses)].filter(addr => addr !== address);
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      }, walletAddress);

      this.log('Données du wallet scrapées avec succès', { 
        portfolio_items: walletData.portfolio.length,
        transactions: walletData.recent_transactions.length,
        addresses_found: walletData.found_addresses?.length || 0
      });

      return walletData;

    } catch (error) {
      this.log('Erreur lors du scraping du wallet', error.message);
      return null;
    }
  }

  // Fermer le navigateur
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Navigateur fermé');
      }
    } catch (error) {
      this.log('Erreur lors de la fermeture', error.message);
    }
  }

  // Méthode de test pour la connexion Phantom uniquement
  async testPhantomConnection() {
    try {
      this.log('🧪 Test de connexion Phantom...');

      // Initialiser le navigateur
      const browserInit = await this.initBrowser();
      if (!browserInit) {
        throw new Error('Échec de l\'initialisation du navigateur');
      }

      // Naviguer vers cielo.com
      const navigation = await this.navigateToCielo();
      if (!navigation) {
        throw new Error('Échec de la navigation vers cielo.com');
      }

      // Essayer de connecter Phantom
      const phantomConnection = await this.connectPhantomWallet();
      
      if (phantomConnection) {
        this.log('✅ Test Phantom réussi - Wallet connecté');
        
        // Vérifier les informations du wallet connecté
        const walletInfo = await this.page.evaluate(() => {
          // Chercher des éléments qui pourraient contenir l'adresse du wallet
          const possibleWalletElements = [
            ...document.querySelectorAll('[class*="wallet"]'),
            ...document.querySelectorAll('[data-testid*="wallet"]'),
            ...document.querySelectorAll('[class*="address"]'),
            ...document.querySelectorAll('[class*="connected"]')
          ];

          const info = {
            connected: true,
            wallet_address: null,
            display_text: []
          };

          possibleWalletElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
              info.display_text.push(text);
              // Chercher une adresse Solana (format base58)
              const match = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
              if (match && !info.wallet_address) {
                info.wallet_address = match[0];
              }
            }
          });

          return info;
        });

        this.log('📊 Informations du wallet connecté:', walletInfo);
        
        return {
          success: true,
          phantom_connected: true,
          wallet_info: walletInfo,
          test_completed_at: new Date().toISOString()
        };
      } else {
        this.log('❌ Test Phantom échoué - Wallet non connecté');
        
        return {
          success: false,
          phantom_connected: false,
          error: 'Échec de la connexion Phantom',
          test_completed_at: new Date().toISOString()
        };
      }

    } catch (error) {
      this.log('❌ Erreur lors du test Phantom', error.message);
      return {
        success: false,
        phantom_connected: false,
        error: error.message,
        test_completed_at: new Date().toISOString()
      };
    } finally {
      await this.close();
    }
  }

  // Méthode pour automatiser complètement la connexion Phantom
  async autoConnectPhantom() {
    try {
      this.log('🤖 Connexion automatique Phantom...');

      // Initialiser le navigateur avec un profil utilisateur persistant
      const browserInit = await this.initBrowserWithProfile();
      if (!browserInit) {
        throw new Error('Échec de l\'initialisation du navigateur');
      }

      // Naviguer vers cielo.com
      const navigation = await this.navigateToCielo();
      if (!navigation) {
        throw new Error('Échec de la navigation vers cielo.com');
      }

      // Essayer de connecter automatiquement
      const phantomConnection = await this.autoConnectPhantomWallet();
      
      return {
        success: phantomConnection,
        phantom_connected: phantomConnection,
        auto_connection: true,
        test_completed_at: new Date().toISOString()
      };

    } catch (error) {
      this.log('❌ Erreur lors de la connexion auto Phantom', error.message);
      return {
        success: false,
        phantom_connected: false,
        error: error.message,
        auto_connection: true,
        test_completed_at: new Date().toISOString()
      };
    } finally {
      await this.close();
    }
  }

  // Initialiser le navigateur avec un profil utilisateur persistant
  async initBrowserWithProfile() {
    try {
      this.log('Initialisation du navigateur avec profil utilisateur...');
      
      // Créer un dossier pour le profil utilisateur
      const userDataDir = path.join(__dirname, 'chrome-profile');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      this.browser = await puppeteer.launch({
        headless: false, // Mode visible pour voir ce qui se passe
        userDataDir: userDataDir, // Profil persistant
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          // Arguments pour charger l'extension Phantom
          `--load-extension=${this.getPhantomExtensionPath()}`,
          '--disable-extensions-except=' + this.getPhantomExtensionPath()
        ],
        defaultViewport: null
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      this.log('Navigateur avec profil initialisé avec succès');
      return true;
    } catch (error) {
      this.log('Erreur lors de l\'initialisation du navigateur avec profil', error.message);
      return false;
    }
  }

  // Obtenir le chemin de l'extension Phantom
  getPhantomExtensionPath() {
    // Chemins possibles pour l'extension Phantom sur macOS
    const possiblePaths = [
      '/Users/' + process.env.USER + '/Library/Application Support/Google/Chrome/Default/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      '/Users/' + process.env.USER + '/Library/Application Support/Google/Chrome/Profile 1/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      // Ajoutez d'autres chemins selon votre configuration
    ];

    for (const basePath of possiblePaths) {
      if (fs.existsSync(basePath)) {
        // Trouver la version la plus récente
        const versions = fs.readdirSync(basePath).filter(v => !v.startsWith('.'));
        if (versions.length > 0) {
          const latestVersion = versions.sort().pop();
          const fullPath = path.join(basePath, latestVersion);
          this.log(`Extension Phantom trouvée: ${fullPath}`);
          return fullPath;
        }
      }
    }

    // Si non trouvé, retourner un chemin par défaut (peut nécessiter une installation manuelle)
    this.log('⚠️ Extension Phantom non trouvée automatiquement');
    return '/tmp/phantom-extension'; // Vous devrez extraire l'extension ici
  }

  // Connexion automatique à Phantom
  async autoConnectPhantomWallet() {
    try {
      this.log('🤖 Tentative de connexion automatique Phantom...');

      // Attendre que Phantom soit prêt
      await this.page.waitForTimeout(3000);

      // Vérifier si Phantom est déjà connecté
      const alreadyConnected = await this.checkWalletConnection();
      if (alreadyConnected) {
        this.log('✅ Phantom déjà connecté');
        return true;
      }

      // Chercher le bouton de connexion wallet
      const connectSelectors = [
        '[data-testid="connect-wallet"]',
        'button[class*="connect"]',
        'button:contains("Connect Wallet")',
        'button:contains("Connect")',
        '.wallet-connect-button',
        '#connect-wallet'
      ];

      let connectButton = null;
      for (const selector of connectSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          connectButton = await this.page.$(selector);
          if (connectButton) {
            this.log(`Bouton de connexion trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!connectButton) {
        // Chercher par texte avec XPath
        const xpathButtons = await this.page.$x("//button[contains(text(), 'Connect') or contains(text(), 'connect')]");
        if (xpathButtons.length > 0) {
          connectButton = xpathButtons[0];
          this.log('Bouton de connexion trouvé par XPath');
        }
      }

      if (!connectButton) {
        this.log('❌ Aucun bouton de connexion trouvé');
        return false;
      }

      // Cliquer sur le bouton de connexion
      await connectButton.click();
      this.log('✅ Clic sur le bouton de connexion');
      
      // Attendre la modal de sélection de wallet
      await this.page.waitForTimeout(2000);

      // Chercher et cliquer sur Phantom
      const phantomSelectors = [
        'button:contains("Phantom")',
        '[data-wallet="phantom"]',
        '.phantom-wallet',
        'img[alt*="Phantom"]',
        '[title*="Phantom"]'
      ];

      let phantomButton = null;
      for (const selector of phantomSelectors) {
        try {
          phantomButton = await this.page.$(selector);
          if (phantomButton) {
            this.log(`Bouton Phantom trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!phantomButton) {
        // Chercher par texte avec XPath
        const xpathPhantom = await this.page.$x("//button[contains(text(), 'Phantom')] | //div[contains(text(), 'Phantom')] | //span[contains(text(), 'Phantom')]");
        if (xpathPhantom.length > 0) {
          phantomButton = xpathPhantom[0];
          this.log('Bouton Phantom trouvé par XPath');
        }
      }

      if (!phantomButton) {
        this.log('❌ Bouton Phantom non trouvé');
        return false;
      }

      // Cliquer sur Phantom
      await phantomButton.click();
      this.log('✅ Clic sur Phantom');

      // Attendre l'ouverture de la popup Phantom
      await this.page.waitForTimeout(2000);

      // Gérer automatiquement la popup Phantom
      const phantomApproved = await this.autoApprovePhantom();
      
      if (phantomApproved) {
        // Vérifier la connexion finale
        await this.page.waitForTimeout(3000);
        const finalCheck = await this.checkWalletConnection();
        
        if (finalCheck) {
          this.log('✅ Connexion Phantom automatique réussie');
          return true;
        } else {
          this.log('❌ Connexion Phantom échouée - vérification finale');
          return false;
        }
      } else {
        this.log('❌ Approbation Phantom automatique échouée');
        return false;
      }

    } catch (error) {
      this.log('❌ Erreur connexion auto Phantom', error.message);
      return false;
    }
  }

  // Approuver automatiquement dans la popup Phantom
  async autoApprovePhantom() {
    try {
      this.log('🤖 Approbation automatique Phantom...');

      // Attendre qu'une nouvelle page/popup s'ouvre
      const pages = await this.browser.pages();
      let phantomPage = null;

      // Chercher la page Phantom (souvent la dernière ouverte)
      for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i];
        const url = page.url();
        if (url.includes('phantom') || url.includes('extension') || url.includes('chrome-extension://')) {
          phantomPage = page;
          this.log(`Page Phantom trouvée: ${url}`);
          break;
        }
      }

      if (!phantomPage) {
        this.log('❌ Page Phantom non trouvée');
        return false;
      }

      // Attendre que la page soit chargée
      await phantomPage.waitForTimeout(2000);

      // Chercher le bouton "Connect" ou "Approve" dans Phantom
      const approveSelectors = [
        'button[data-testid="connect-button"]',
        'button[data-testid="approve-button"]',
        'button:contains("Connect")',
        'button:contains("Approve")',
        'button:contains("Allow")',
        '.approve-button',
        '.connect-button'
      ];

      let approveButton = null;
      for (const selector of approveSelectors) {
        try {
          await phantomPage.waitForSelector(selector, { timeout: 3000 });
          approveButton = await phantomPage.$(selector);
          if (approveButton) {
            this.log(`Bouton d'approbation trouvé: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuer
        }
      }

      if (!approveButton) {
        // Chercher par texte avec XPath
        const xpathApprove = await phantomPage.$x("//button[contains(text(), 'Connect') or contains(text(), 'Approve') or contains(text(), 'Allow')]");
        if (xpathApprove.length > 0) {
          approveButton = xpathApprove[0];
          this.log('Bouton d\'approbation trouvé par XPath');
        }
      }

      if (!approveButton) {
        this.log('❌ Bouton d\'approbation non trouvé');
        return false;
      }

      // Cliquer sur le bouton d'approbation
      await approveButton.click();
      this.log('✅ Clic sur le bouton d\'approbation');

      // Attendre la fermeture de la popup
      await phantomPage.waitForTimeout(2000);

      return true;

    } catch (error) {
      this.log('❌ Erreur approbation auto Phantom', error.message);
      return false;
    }
  }

  // Scraper les données principales de cielo.com
  async scrapeData() {
    try {
      this.log('Début du scraping des données...');
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      const scrapedData = await this.page.evaluate(() => {
        const data = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          wallet_info: {},
          portfolio: [],
          transactions: [],
          analytics: {}
        };

        // Scraper les informations du wallet
        try {
          const walletElements = document.querySelectorAll('[class*="wallet"], [data-testid*="wallet"]');
          walletElements.forEach(el => {
            if (el.textContent && el.textContent.trim().length > 10) {
              data.wallet_info.address = el.textContent.trim();
            }
          });
        } catch (e) {
          console.log('Erreur wallet info:', e);
        }

        // Scraper le portfolio
        try {
          const portfolioElements = document.querySelectorAll('[class*="token"], [class*="asset"], [class*="holding"]');
          portfolioElements.forEach(el => {
            const tokenData = {
              name: '',
              symbol: '',
              balance: '',
              value: '',
              change: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"]');
            if (nameEl) tokenData.name = nameEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="price"]');
            if (valueEl) tokenData.value = valueEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"]');
            if (changeEl) tokenData.change = changeEl.textContent.trim();

            if (tokenData.name || tokenData.balance) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll('[class*="transaction"], [class*="activity"], tr');
          transactionElements.forEach((el, index) => {
            if (index < 20) { // Limiter à 20 transactions
              const txData = {
                type: '',
                token: '',
                amount: '',
                timestamp: '',
                hash: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                if (cells[3]) txData.timestamp = cells[3].textContent.trim();
              }

              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"]');
              if (linkEl) {
                txData.hash = linkEl.href;
              }

              if (txData.type || txData.token) {
                data.transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Scraper les métriques/analytics
        try {
          const metricElements = document.querySelectorAll('[class*="metric"], [class*="stat"], [class*="analytics"]');
          metricElements.forEach(el => {
            const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
            const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
            
            if (label && value) {
              data.analytics[label] = value;
            }
          });
        } catch (e) {
          console.log('Erreur analytics:', e);
        }

        // Scraper tous les textes contenant des adresses Solana (44 caractères base58)
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.solana_addresses = [...new Set(addresses)]; // Supprimer les doublons
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      });

      this.log('Données scrapées avec succès', { 
        portfolio_items: scrapedData.portfolio.length,
        transactions: scrapedData.transactions.length,
        addresses_found: scrapedData.solana_addresses?.length || 0
      });

      return scrapedData;

    } catch (error) {
      this.log('Erreur lors du scraping', error.message);
      return null;
    }
  }

  // Sauvegarder les données
  async saveData(data, filename = null) {
    try {
      if (!filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `cielo_data_${timestamp}.json`;
      }

      const filepath = path.join(__dirname, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      
      this.log(`Données sauvegardées dans: ${filepath}`);
      return filepath;
    } catch (error) {
      this.log('Erreur lors de la sauvegarde', error.message);
      return null;
    }
  }

  // Scraper les données pour un portefeuille spécifique
  async scrapeWalletData(walletAddress) {
    try {
      this.log(`Scraping des données pour le wallet: ${walletAddress}`);
      
      // Si on a déjà une page ouverte, l'utiliser, sinon en créer une nouvelle
      if (!this.page) {
        const browserInit = await this.initBrowser();
        if (!browserInit) {
          throw new Error('Échec de l\'initialisation du navigateur');
        }
      }

      // Naviguer vers la page du wallet sur cielo.com
      const walletUrl = `https://cielo.com/wallet/${walletAddress}`;
      this.log(`Navigation vers: ${walletUrl}`);
      
      await this.page.goto(walletUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Attendre que le contenu soit chargé
      await this.page.waitForTimeout(5000);

      // Scraper les données spécifiques au wallet
      const walletData = await this.page.evaluate((address) => {
        const data = {
          wallet_address: address,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          portfolio: [],
          balance_overview: {},
          recent_transactions: [],
          performance: {},
          holdings: []
        };

        // Scraper le portfolio du wallet
        try {
          const portfolioElements = document.querySelectorAll(
            '[class*="token"], [class*="asset"], [class*="holding"], [class*="position"], tbody tr'
          );
          
          portfolioElements.forEach(el => {
            const tokenData = {
              token_name: '',
              token_symbol: '',
              token_address: '',
              balance: '',
              usd_value: '',
              price: '',
              change_24h: '',
              percentage_of_portfolio: ''
            };

            // Extraire les données du token
            const nameEl = el.querySelector('[class*="name"], [class*="symbol"], td:first-child');
            if (nameEl) tokenData.token_name = nameEl.textContent.trim();

            const symbolEl = el.querySelector('[class*="symbol"], [data-testid*="symbol"]');
            if (symbolEl) tokenData.token_symbol = symbolEl.textContent.trim();

            const balanceEl = el.querySelector('[class*="balance"], [class*="amount"], [class*="quantity"]');
            if (balanceEl) tokenData.balance = balanceEl.textContent.trim();

            const valueEl = el.querySelector('[class*="value"], [class*="usd"], [class*="dollar"]');
            if (valueEl) tokenData.usd_value = valueEl.textContent.trim();

            const priceEl = el.querySelector('[class*="price"]');
            if (priceEl) tokenData.price = priceEl.textContent.trim();

            const changeEl = el.querySelector('[class*="change"], [class*="percent"], [class*="+"], [class*="-"]');
            if (changeEl) tokenData.change_24h = changeEl.textContent.trim();

            // Extraire l'adresse du token depuis les liens
            const linkEl = el.querySelector('a[href*="token"], a[href*="address"]');
            if (linkEl) {
              const match = linkEl.href.match(/([1-9A-HJ-NP-Za-km-z]{32,44})/);
              if (match) tokenData.token_address = match[1];
            }

            if (tokenData.token_name || tokenData.balance || tokenData.usd_value) {
              data.portfolio.push(tokenData);
            }
          });
        } catch (e) {
          console.log('Erreur portfolio:', e);
        }

        // Scraper les métriques globales du wallet
        try {
          const balanceElements = document.querySelectorAll(
            '[class*="balance"], [class*="total"], [class*="worth"], [class*="value"]'
          );
          
          balanceElements.forEach(el => {
            const text = el.textContent.trim();
            if (text.includes('$') && text.match(/\$[\d,.]+(K|M|B)?/)) {
              if (text.toLowerCase().includes('total') || text.toLowerCase().includes('net')) {
                data.balance_overview.total_value = text;
              } else if (text.toLowerCase().includes('24h') || text.toLowerCase().includes('change')) {
                data.balance_overview.change_24h = text;
              }
            }
          });

          // Chercher des métriques spécifiques
          const metricSelectors = [
            '[data-testid*="balance"]',
            '[data-testid*="value"]',
            '[class*="metric"]',
            '[class*="stat"]'
          ];

          metricSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const label = el.querySelector('[class*="label"], [class*="title"]')?.textContent.trim();
              const value = el.querySelector('[class*="value"], [class*="amount"]')?.textContent.trim();
              if (label && value) {
                data.performance[label] = value;
              }
            });
          });
        } catch (e) {
          console.log('Erreur métriques:', e);
        }

        // Scraper les transactions récentes
        try {
          const transactionElements = document.querySelectorAll(
            '[class*="transaction"], [class*="activity"], [class*="history"] tr'
          );
          
          transactionElements.forEach((el, index) => {
            if (index < 50) { // Limiter à 50 transactions
              const txData = {
                type: '',
                token_symbol: '',
                amount: '',
                usd_value: '',
                timestamp: '',
                tx_hash: '',
                status: ''
              };

              const cells = el.querySelectorAll('td, [class*="cell"]');
              if (cells.length >= 3) {
                txData.type = cells[0]?.textContent.trim() || '';
                txData.token_symbol = cells[1]?.textContent.trim() || '';
                txData.amount = cells[2]?.textContent.trim() || '';
                
                if (cells[3]) txData.usd_value = cells[3].textContent.trim();
                if (cells[4]) txData.timestamp = cells[4].textContent.trim();
                if (cells[5]) txData.status = cells[5].textContent.trim();
              }

              // Extraire le hash de transaction
              const linkEl = el.querySelector('a[href*="solscan"], a[href*="explorer"], a[href*="tx"]');
              if (linkEl) {
                txData.tx_hash = linkEl.href;
              }

              if (txData.type || txData.token_symbol || txData.amount) {
                data.recent_transactions.push(txData);
              }
            }
          });
        } catch (e) {
          console.log('Erreur transactions:', e);
        }

        // Extraire toutes les adresses Solana trouvées
        try {
          const allText = document.body.innerText;
          const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
          const addresses = allText.match(solanaAddressRegex) || [];
          data.found_addresses = [...new Set(addresses)].filter(addr => addr !== address);
        } catch (e) {
          console.log('Erreur adresses:', e);
        }

        return data;
      }, walletAddress);

      this.log('Données du wallet scrapées avec succès', { 
        portfolio_items: walletData.portfolio.length,
        transactions: walletData.recent_transactions.length,
        addresses_found: walletData.found_addresses?.length || 0
      });

      return walletData;

    } catch (error) {
      this.log('Erreur lors du scraping du wallet', error.message);
      return null;
    }
  }

  // Fermer le navigateur
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('Navigateur fermé');
      }
    } catch (error) {
      this.log('Erreur lors de la fermeture', error.message);
    }
  }

  // Méthode