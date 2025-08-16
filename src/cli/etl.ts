#!/usr/bin/env node

import 'dotenv/config';
import { WalletETL } from '../etl/index.js';
import { Command } from 'commander';

const program = new Command();

program
  .name('etl')
  .description('Wallet ETL Pipeline for Solana Copy Trading')
  .version('1.0.0');

program
  .command('process')
  .description('Process wallet data from file or API')
  .option('-f, --file <path>', 'Input JSON file path')
  .option('-w, --wallet <address>', 'Process single wallet from API')
  .option('-b, --batch-size <number>', 'Batch size for processing', '50')
  .action(async (options) => {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const etl = new WalletETL({
      databaseUrl: DATABASE_URL,
      inputFilePath: options.file,
      batchSize: parseInt(options.batchSize)
    });

    try {
      if (options.wallet) {
        console.log(`🎯 Processing single wallet: ${options.wallet}`);
        await etl.processWalletFromAPI(options.wallet);
      } else if (options.file) {
        console.log(`📁 Processing file: ${options.file}`);
        await etl.processWalletData();
      } else {
        console.error('❌ Either --file or --wallet option is required');
        process.exit(1);
      }

      console.log('✅ ETL completed successfully');
    } catch (error) {
      console.error('❌ ETL failed:', error);
      process.exit(1);
    } finally {
      await etl.close();
    }
  });

program
  .command('stats')
  .description('Show processing statistics')
  .action(async () => {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const etl = new WalletETL({ databaseUrl: DATABASE_URL });

    try {
      const stats = await etl.getProcessingStats();
      
      console.log('\n📊 Processing Statistics:');
      console.log('========================');
      console.log(`Total Wallets: ${stats.totalWallets[0]?.count || 0}`);
      console.log(`Processed Wallets: ${stats.processedWallets[0]?.count || 0}`);
      console.log(`Total Positions: ${stats.totalPositions[0]?.count || 0}`);
      console.log(`Average Copy Score: ${stats.avgCopyScore[0]?.avg_score ? parseFloat(stats.avgCopyScore[0].avg_score).toFixed(2) : 'N/A'}`);
      
      console.log('\n🏆 Top Wallets:');
      console.log('===============');
      if (stats.topWallets.length > 0) {
        stats.topWallets.forEach((wallet: any, index: number) => {
          console.log(`${index + 1}. ${wallet.wallet_address}`);
          console.log(`   Score: ${wallet.copy_trading_score}`);
          console.log(`   Winrate: ${(wallet.winrate_30d * 100).toFixed(1)}%`);
          console.log(`   Profit Factor: ${wallet.profit_factor_30d}`);
          console.log('');
        });
      }

      console.log('\n🔧 Price Manager Stats:');
      console.log('=======================');
      console.log(`Cache Size: ${stats.priceManagerStats.cache_size}`);
      console.log(`DexScreener Failures: ${stats.priceManagerStats.dexscreener_failures}`);
      console.log(`Jupiter Failures: ${stats.priceManagerStats.jupiter_failures}`);
      
    } catch (error) {
      console.error('❌ Stats failed:', error);
      process.exit(1);
    } finally {
      await etl.close();
    }
  });

program.parse();
