-- 💡 PROPOSITION : Trigger automatique pour enrichissement
-- À ajouter dans Supabase SQL Editor

-- Fonction qui extrait et met à jour les métriques
CREATE OR REPLACE FUNCTION enrich_cielo_metrics_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si cielo_complete_data a été mis à jour et n'est pas null
  IF NEW.cielo_complete_data IS NOT NULL AND 
     (OLD.cielo_complete_data IS NULL OR OLD.cielo_complete_data != NEW.cielo_complete_data) THEN
    
    -- Appeler une fonction d'enrichissement (à créer séparément)
    -- Ou déclencher un job en arrière-plan
    PERFORM pg_notify('cielo_enrichment', NEW.wallet_address);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur wallet_registry
CREATE TRIGGER trigger_cielo_enrichment
  AFTER UPDATE OF cielo_complete_data ON wallet_registry
  FOR EACH ROW
  EXECUTE FUNCTION enrich_cielo_metrics_trigger();

-- Écouter les notifications pour lancer l'enrichissement
-- (nécessiterait un service Node.js qui écoute pg_notify)
