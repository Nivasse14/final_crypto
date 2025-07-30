#!/bin/bash

# SUPPRESSION DE TOUT LE CHAOS - GARDER SEULEMENT SIMPLE/
echo "🧹 NETTOYAGE RADICAL"

# Aller dans le dossier parent et supprimer tout sauf SIMPLE
cd /Users/helenemounissamy/scanDune

# Garder seulement les essentiels
mkdir -p KEEP_BACKUP
mv SIMPLE KEEP_BACKUP/
mv .git KEEP_BACKUP/ 2>/dev/null || true
mv supabase KEEP_BACKUP/ 2>/dev/null || true

# Supprimer tout le reste
rm -rf * 2>/dev/null || true
rm -rf .* 2>/dev/null || true

# Remettre seulement SIMPLE
mv KEEP_BACKUP/SIMPLE/* .
mv KEEP_BACKUP/.git . 2>/dev/null || true
mv KEEP_BACKUP/supabase . 2>/dev/null || true

# Nettoyer
rm -rf KEEP_BACKUP

echo "✅ PROJET ULTRA-SIMPLIFIÉ !"
echo "📁 Fichiers restants:"
ls -la

echo ""
echo "🎯 PROCHAINE ÉTAPE:"
echo "   1. Exécuter fix.sql dans Supabase"
echo "   2. Tester: node test.js"
