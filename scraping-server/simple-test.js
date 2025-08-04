const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Serveur de scraping opérationnel',
        timestamp: new Date().toISOString()
    });
});

app.post('/scrape', (req, res) => {
    console.log('🔍 Test endpoint /scrape appelé');
    res.json({
        jobId: 'test-' + Date.now(),
        status: 'started',
        message: 'Test job démarré (mode simulation)',
        estimatedDuration: '2-3 minutes'
    });
});

app.get('/status/:jobId', (req, res) => {
    console.log(`📊 Statut demandé pour job: ${req.params.jobId}`);
    res.json({
        jobId: req.params.jobId,
        status: 'completed',
        message: 'Test job terminé',
        results: {
            walletsCount: 42,
            pagesScraped: 5,
            duration: '2m 15s'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
    console.log('🔍 Endpoints disponibles:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   POST http://localhost:${PORT}/scrape`);
    console.log(`   GET  http://localhost:${PORT}/status/:jobId`);
    console.log('');
    console.log('🧪 Pour tester:');
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/scrape`);
});
