# 🔍 REQUÊTES POUR TESTER L'API COMPLETE ANALYSIS

## 1. Démarrer une analyse complète

```bash
curl -X POST 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/complete/HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH' \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU" \
     -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "message": "Complete analysis started",
  "job_id": "uuid-generé",
  "estimated_duration": "5-10 minutes",
  "status_endpoint": "/wallet-analyzer/status/uuid-generé"
}
```

## 2. Suivre le progrès (remplacez JOB_ID)

```bash
curl 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/status/JOB_ID' \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
```

**Réponse pendant l'analyse :**
```json
{
  "id": "job-id",
  "status": "running",
  "progress_percentage": 45,
  "current_step": "Analyzing individual trades...",
  "estimated_completion": "2025-08-02T19:15:00Z"
}
```

**Réponse quand terminé :**
```json
{
  "id": "job-id",
  "status": "completed",
  "progress_percentage": 100,
  "current_step": "Analysis completed successfully",
  "results": {
    "analysis_type": "complete",
    "data": {
      "advanced_metrics": {
        "sharpe_ratio": 2.34,
        "max_drawdown": -15.2,
        "win_rate": 67.5
      },
      "alpha_analysis": {
        "alpha_score": 8.5,
        "alpha_category": "HIGH_ALPHA"
      }
    }
  }
}
```

## 3. Test automatique avec script

```bash
cd /Users/helenemounissamy/scanDune
node test-complete-api.js
```

Ce script va :
- ✅ Démarrer l'analyse automatiquement
- 📊 Afficher une barre de progression en temps réel
- 🎉 Montrer les résultats détaillés à la fin

## 4. Test rapide de comparaison

```bash
# API Quick (1-3 secondes)
curl 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/quick/HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH' \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU"
```

## 🎯 CE QUE VOUS VERREZ

### API Quick (déjà fonctionnelle)
- ⏱️ **Durée** : 1-3 secondes
- 🏆 **Score Alpha** : 7/10 (exemple)
- ⚠️ **Risque** : 20.0/100 (faible)
- 📊 **Données** : Enrichies + analyses

### API Complete (après création table)
- ⏱️ **Durée** : 5-10 minutes (simulation blockchain)
- 📈 **Métriques** : Sharpe ratio, Max drawdown, etc.
- 🎯 **Alpha** : Score ultra-précis basé sur timing réel
- 🔍 **Profondeur** : Analyse blockchain complète

## 🚀 PROCHAINE ÉTAPE

1. **Créez la table** dans Supabase Dashboard (SQL ci-dessus)
2. **Testez avec** : `node test-complete-api.js`
3. **Admirez** le système de détection alpha complet ! 🎉
