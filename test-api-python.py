#!/usr/bin/env python3
"""
Script Python pour tester l'API Wallet Analyzer
Usage: python test-api-python.py [wallet_address]
"""

import requests
import json
import sys
import time
from datetime import datetime

class WalletAnalyzerAPI:
    def __init__(self):
        self.base_url = "https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer"
        self.api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, endpoint):
        """Faire une requête à l'API"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.get(url, headers=self.headers, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Erreur API: {e}")
    
    def health_check(self):
        """Test de santé de l'API"""
        print("🏥 Test Health Check...")
        try:
            data = self._request("/health")
            print(f"✅ Status: {data.get('status')}")
            print(f"📅 Timestamp: {data.get('timestamp')}")
            print(f"🔧 Version: {data.get('version', 'N/A')}")
            return data
        except Exception as e:
            print(f"❌ Health Check failed: {e}")
            raise
    
    def quick_analysis(self, wallet_address):
        """Analyse rapide d'un wallet"""
        print(f"⚡ Analyse rapide de {wallet_address[:8]}...")
        try:
            data = self._request(f"/quick/{wallet_address}")
            
            print("📊 Résultats:")
            print(f"   🔗 Source: {data.get('data_source', 'N/A')}")
            print(f"   🎯 Score Alpha: {data.get('alpha_score', 'N/A')}/10")
            
            pnl = data.get('total_pnl_usd')
            if pnl is not None:
                print(f"   📈 PnL Total: ${pnl:,.2f}")
            else:
                print("   📈 PnL Total: N/A")
            
            win_rate = data.get('win_rate')
            if win_rate is not None:
                print(f"   🏆 Win Rate: {win_rate:.1f}%")
            else:
                print("   🏆 Win Rate: N/A")
            
            print(f"   📊 Total Trades: {data.get('total_trades', 'N/A')}")
            
            return data
        except Exception as e:
            print(f"❌ Analyse rapide failed: {e}")
            raise
    
    def complete_analysis(self, wallet_address):
        """Analyse complète d'un wallet"""
        print(f"🎯 Analyse complète de {wallet_address[:8]}...")
        try:
            response = self._request(f"/complete/{wallet_address}")
            
            print("📊 ANALYSE COMPLÈTE:")
            print(f"   🔗 Source: {response.get('data_source', 'N/A')}")
            
            generated_at = response.get('generated_at')
            if generated_at:
                try:
                    dt = datetime.fromisoformat(generated_at.replace('Z', '+00:00'))
                    print(f"   📅 Généré: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                except:
                    print(f"   📅 Généré: {generated_at}")
            
            data = response.get('data', {})
            
            # Analyse Alpha
            alpha = data.get('alpha_analysis', {})
            if alpha:
                print("\n🎯 ANALYSE ALPHA:")
                print(f"   Score: {alpha.get('alpha_score', 'N/A')}/10 ({alpha.get('alpha_category', 'N/A')})")
                print(f"   Confiance: {alpha.get('alpha_confidence', 'N/A')}%")
                print(f"   Détection précoce: {alpha.get('early_detection_ability', 'N/A')}")
            
            # Performance Trading
            trade = data.get('trade_analysis', {})
            if trade:
                print("\n📈 PERFORMANCE TRADING:")
                
                pnl = trade.get('total_pnl_usd')
                if pnl is not None:
                    print(f"   PnL Total: ${pnl:,.2f}")
                else:
                    print("   PnL Total: N/A")
                
                volume = trade.get('total_volume_usd')
                if volume is not None:
                    print(f"   Volume Total: ${volume:,.2f}")
                else:
                    print("   Volume Total: N/A")
                
                win_rate = trade.get('win_rate')
                if win_rate is not None:
                    print(f"   Win Rate: {win_rate:.1f}%")
                else:
                    print("   Win Rate: N/A")
                
                print(f"   Tokens Uniques: {trade.get('unique_tokens', 'N/A')}")
            
            # Recommandations
            recommendation = data.get('copy_trading_recommendations', {})
            if recommendation:
                print("\n💼 RECOMMANDATION COPY-TRADING:")
                print(f"   Action: {recommendation.get('recommendation', 'N/A')}")
                print(f"   Allocation: {recommendation.get('suggested_allocation_percentage', 'N/A')}%")
                print(f"   Niveau de Risque: {recommendation.get('risk_level', 'N/A')}")
                print(f"   Confiance: {recommendation.get('confidence_level', 'N/A')}%")
            
            return response
        except Exception as e:
            print(f"❌ Analyse complète failed: {e}")
            raise
    
    def test_multiple_wallets(self, wallets):
        """Test de plusieurs wallets"""
        print("🎯 TEST DE PLUSIEURS WALLETS")
        print("=" * 50)
        
        results = []
        
        for i, wallet in enumerate(wallets):
            print(f"\n📊 Wallet {i + 1}/{len(wallets)}: {wallet[:8]}...")
            
            try:
                analysis = self.quick_analysis(wallet)
                results.append({
                    'address': wallet,
                    'score': analysis.get('alpha_score'),
                    'pnl': analysis.get('total_pnl_usd'),
                    'win_rate': analysis.get('win_rate'),
                    'data_source': analysis.get('data_source')
                })
                
                # Pause entre les requêtes
                if i < len(wallets) - 1:
                    print("   ⏳ Pause 2 secondes...")
                    time.sleep(2)
                    
            except Exception as e:
                print(f"   ❌ Erreur: {e}")
                results.append({
                    'address': wallet,
                    'error': str(e)
                })
        
        print("\n📋 RÉSUMÉ COMPARATIF:")
        print("=" * 50)
        
        for i, result in enumerate(results):
            if 'error' in result:
                print(f"{i + 1}. {result['address'][:8]}... - ERREUR")
            else:
                pnl_str = f"${result['pnl']:,.2f}" if result['pnl'] is not None else "N/A"
                win_str = f"{result['win_rate']:.1f}%" if result['win_rate'] is not None else "N/A"
                print(f"{i + 1}. {result['address'][:8]}... - Score: {result['score']}/10, PnL: {pnl_str}, Win: {win_str}")
        
        return results

def main():
    # Wallet par défaut ou fourni en argument
    default_wallet = "HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk"
    wallet_address = sys.argv[1] if len(sys.argv) > 1 else default_wallet
    
    api = WalletAnalyzerAPI()
    
    print("🚀 TEST DE L'API WALLET ANALYZER")
    print("=" * 50)
    print(f"Wallet testé: {wallet_address}")
    print()
    
    try:
        # 1. Health Check
        api.health_check()
        print()
        
        # 2. Analyse rapide
        api.quick_analysis(wallet_address)
        print()
        
        # 3. Analyse complète
        api.complete_analysis(wallet_address)
        print()
        
        # 4. Test de plusieurs wallets (optionnel)
        test_multiple = input("Voulez-vous tester plusieurs wallets ? (y/N): ").lower().strip()
        if test_multiple == 'y':
            test_wallets = [
                "HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk",
                "A1nCMZqrG46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
                "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
            ]
            api.test_multiple_wallets(test_wallets)
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    
    print("\n✅ Tests terminés avec succès!")

if __name__ == "__main__":
    main()
