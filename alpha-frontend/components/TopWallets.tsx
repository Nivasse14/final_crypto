import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';

interface Wallet {
  wallet_address: string;
  total_pnl: number;
  win_rate: number;
  tx_count: number;
  last_active: string;
  first_seen: string;
  alpha_score?: number;
  risk_score?: number;
  enriched?: boolean;
}

export function TopWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  // Charger les meilleurs wallets
  const loadTopWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/system-monitoring/priority-wallets?limit=20&min_pnl=50000`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      const { data } = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Erreur chargement wallets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les wallets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Lancer une analyse complète
  const startAnalysis = async () => {
    try {
      setAnalyzing(true);
      
      // 1. Démarrer le scraping Dune
      const scrapeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dune-scraper-trigger/start`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const { job_id } = await scrapeResponse.json();

      // 2. Vérifier périodiquement le statut
      const checkStatus = setInterval(async () => {
        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dune-scraper-trigger/status?job_id=${job_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        
        const { status } = await statusResponse.json();
        
        if (status === 'completed') {
          clearInterval(checkStatus);
          await loadTopWallets(); // Recharger les wallets
          setAnalyzing(false);
          toast({
            title: "Analyse terminée",
            description: "Les nouveaux wallets ont été analysés",
            variant: "success"
          });
        }
      }, 10000); // Vérifier toutes les 10 secondes

    } catch (error) {
      console.error('Erreur analyse:', error);
      setAnalyzing(false);
      toast({
        title: "Erreur",
        description: "L'analyse n'a pas pu être complétée",
        variant: "destructive"
      });
    }
  };

  // Enrichir un wallet spécifique
  const enrichWallet = async (address: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cielo-api/complete/${address}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      const data = await response.json();
      
      // Mettre à jour le wallet dans la liste
      setWallets(prev => 
        prev.map(w => 
          w.wallet_address === address 
            ? { ...w, ...data.data, enriched: true }
            : w
        )
      );

      toast({
        title: "Wallet enrichi",
        description: "Les données ont été mises à jour",
        variant: "success"
      });

    } catch (error) {
      console.error('Erreur enrichissement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enrichir ce wallet",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadTopWallets();
  }, []);

  // Subscribe aux mises à jour realtime
  useEffect(() => {
    const walletChannel = supabase
      .channel('wallet_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallet_registry'
      }, (payload) => {
        // Mettre à jour le wallet si présent dans la liste
        setWallets(prev => 
          prev.map(w => 
            w.wallet_address === payload.new.wallet_address 
              ? { ...w, ...payload.new }
              : w
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Top Wallets
        </h2>
        <Button 
          onClick={startAnalysis}
          disabled={analyzing}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          {analyzing ? "Analyse en cours..." : "Lancer une analyse"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <Card key={wallet.wallet_address} className="p-6 backdrop-blur-lg bg-white/10 border-purple-200/20">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-mono text-sm text-purple-200">
                    {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    ${(wallet.total_pnl || 0).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => enrichWallet(wallet.wallet_address)}
                  disabled={wallet.enriched}
                >
                  {wallet.enriched ? "Enrichi" : "Enrichir"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-200">Win Rate</p>
                  <p className="font-bold text-white">{((wallet.win_rate || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-purple-200">Transactions</p>
                  <p className="font-bold text-white">{wallet.tx_count || 0}</p>
                </div>
                {wallet.alpha_score && (
                  <div>
                    <p className="text-purple-200">Alpha Score</p>
                    <p className="font-bold text-white">{wallet.alpha_score.toFixed(1)}</p>
                  </div>
                )}
                {wallet.risk_score && (
                  <div>
                    <p className="text-purple-200">Risk Score</p>
                    <p className="font-bold text-white">{wallet.risk_score.toFixed(1)}</p>
                  </div>
                )}
              </div>

              {wallet.enriched && (
                <Tabs defaultValue="portfolio" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="signals">Signals</TabsTrigger>
                  </TabsList>
                  <TabsContent value="portfolio" className="space-y-2">
                    {/* TODO: Afficher le portfolio */}
                  </TabsContent>
                  <TabsContent value="stats" className="space-y-2">
                    {/* TODO: Afficher les stats */}
                  </TabsContent>
                  <TabsContent value="signals" className="space-y-2">
                    {/* TODO: Afficher les signaux */}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
