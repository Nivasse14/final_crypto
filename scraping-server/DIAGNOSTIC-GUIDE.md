# 🔍 Guide de Diagnostic Local - Scraping Dune

Ce guide vous aide à diagnostiquer le problème de scraping en local avant de redéployer.

## 🚀 Tests Disponibles

### 1. Test Simple du Serveur
```bash
cd /Users/helenemounissamy/scanDune/scraping-server
node simple-test.js
```
Puis dans un autre terminal :
```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/scrape
```

### 2. Test Complet de Scraping (Mode Debug)
```bash
cd /Users/helenemounissamy/scanDune/scraping-server
./test-local.sh
```

**Ce test va :**
- Ouvrir un navigateur Chrome en mode visible
- Naviguer vers la page Dune
- Analyser tous les sélecteurs de pagination possibles
- Chercher les éléments de tableau
- Vous laisser 30 secondes pour inspecter manuellement

### 3. Test du Serveur Complet
```bash
cd /Users/helenemounissamy/scanDune/scraping-server
node server.js
```
Puis tester avec :
```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{"webhook_url": "http://localhost:3000/test-webhook"}'
```

## 🔍 Diagnostic Attendu

### Problèmes Potentiels à Vérifier

1. **Sélecteurs de Pagination Obsolètes**
   - La page Dune a peut-être changé de structure
   - Nouveaux sélecteurs CSS/JS framework
   - Pagination devenue dynamique (React/JS)

2. **Protection Anti-Bot**
   - Détection de Puppeteer
   - CAPTCHA ou vérification
   - Rate limiting

3. **Changement d'URL ou de Page**
   - L'URL de la query a changé
   - Page redesignée
   - Authentification requise

### Éléments à Observer

1. **Dans le navigateur ouvert (test debug) :**
   - La page se charge-t-elle correctement ?
   - Y a-t-il un CAPTCHA ou message d'erreur ?
   - Les données sont-elles visibles ?
   - Où sont les boutons de pagination ?

2. **Dans les logs console :**
   - Quels sélecteurs sont trouvés ?
   - Y a-t-il des erreurs JavaScript ?
   - Le tableau de données est-il détecté ?

## 🛠️ Solutions Selon le Diagnostic

### Si les sélecteurs ont changé :
1. Copier les nouveaux sélecteurs trouvés dans les logs
2. Mettre à jour `server.js` avec les nouveaux sélecteurs
3. Redéployer

### Si protection anti-bot :
1. Ajouter plus de délais/randomisation
2. Changer le User-Agent
3. Utiliser un proxy/VPN
4. Implémenter une solution de contournement

### Si changement majeur de page :
1. Vérifier si l'URL est toujours valide
2. Analyser la nouvelle structure
3. Réécrire la logique de scraping

## 📝 Prochaines Étapes

1. **Lancer le test debug** : `./test-local.sh`
2. **Analyser les résultats** dans la console
3. **Identifier le problème** (sélecteurs, protection, etc.)
4. **Corriger le code** selon le diagnostic
5. **Retester localement** jusqu'à ce que ça marche
6. **Redéployer** sur Railway

## 🚨 Points d'Attention

- **Ne pas spammer** : Tester avec modération pour éviter d'être bloqué
- **User-Agent** : Utiliser un User-Agent récent et réaliste
- **Délais** : Respecter des délais réalistes entre les actions
- **Mode headless** : Commencer en mode visible pour debug, puis passer en headless

## 📞 Support

Si le problème persiste après diagnostic :
1. Documenter les résultats des tests
2. Capturer des screenshots si nécessaire
3. Analyser les logs d'erreur Railway
4. Considérer des alternatives (API officielle, autre source)
