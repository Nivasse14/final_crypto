-- Table pour gérer les jobs d'analyse en arrière-plan
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('quick', 'complete')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step TEXT NOT NULL DEFAULT 'Initializing...',
    estimated_completion TIMESTAMP WITH TIME ZONE,
    results JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_wallet_address ON analysis_jobs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_created_at ON analysis_jobs(created_at);

-- Vue pour les jobs actifs
CREATE OR REPLACE VIEW active_analysis_jobs AS
SELECT 
    id,
    wallet_address,
    status,
    analysis_type,
    started_at,
    progress_percentage,
    current_step,
    estimated_completion,
    EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 as duration_minutes
FROM analysis_jobs
WHERE status IN ('pending', 'running')
ORDER BY started_at DESC;

-- Fonction pour nettoyer les anciens jobs (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_analysis_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Supprimer les jobs terminés de plus de 7 jours
    DELETE FROM analysis_jobs 
    WHERE status IN ('completed', 'failed') 
    AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE analysis_jobs IS 'Table pour gérer les analyses de wallets en arrière-plan (quick vs complete)';
COMMENT ON COLUMN analysis_jobs.analysis_type IS 'Type d''analyse : quick (30s) ou complete (5-10min)';
COMMENT ON COLUMN analysis_jobs.progress_percentage IS 'Pourcentage de progression de l''analyse (0-100)';
COMMENT ON COLUMN analysis_jobs.results IS 'Résultats de l''analyse stockés en JSON';
