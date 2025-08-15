#!/bin/bash

# Script de réparation pour Next.js - Résout les problèmes courants de build
# Usage: ./fix-nextjs.sh

echo "🔧 SCRIPT DE RÉPARATION NEXT.JS"
echo "==============================="
echo ""

# Se placer dans le bon répertoire
cd "$(dirname "$0")"
FRONTEND_DIR="$(pwd)"
echo "📂 Répertoire: $FRONTEND_DIR"
echo ""

# 1. Nettoyer les caches
echo "🧹 1. Nettoyage des caches..."
echo "Suppression du dossier .next..."
rm -rf .next
echo "Suppression des node_modules/.cache..."
rm -rf node_modules/.cache
echo ""

# 2. Vérifier les dépendances
echo "📦 2. Vérification des dépendances essentielles..."
MISSING=0

DEPS=("next" "react" "react-dom" "@supabase/supabase-js" "tailwindcss" "typescript")

for DEP in "${DEPS[@]}"; do
  if ! grep -q "\"$DEP\":" package.json; then
    echo "❌ Dépendance manquante: $DEP"
    MISSING=1
  else
    echo "✅ $DEP trouvé"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "⚠️  Dépendances manquantes détectées. Installation..."
  echo ""
  npm install next react react-dom @supabase/supabase-js tailwindcss typescript
else
  echo ""
  echo "✅ Toutes les dépendances essentielles sont présentes"
fi

# 3. Vérifier la configuration de Next.js
echo ""
echo "⚙️  3. Vérification de la configuration Next.js..."
if [ -f "next.config.js" ] || [ -f "next.config.ts" ]; then
  echo "✅ Configuration Next.js trouvée"
else
  echo "❌ Configuration Next.js manquante, création..."
  cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'res.cloudinary.com'],
  }
}

module.exports = nextConfig
EOL
  echo "✅ next.config.js créé"
fi

# 4. Vérifier la configuration Tailwind
echo ""
echo "🎨 4. Vérification de la configuration Tailwind..."
if [ -f "tailwind.config.ts" ] || [ -f "tailwind.config.js" ]; then
  echo "✅ Configuration Tailwind trouvée"
else
  echo "❌ Configuration Tailwind manquante, création..."
  cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL
  echo "✅ tailwind.config.js créé"
fi

# 5. Vérifier postcss.config.js
echo ""
echo "📝 5. Vérification de la configuration PostCSS..."
if [ -f "postcss.config.js" ] || [ -f "postcss.config.mjs" ]; then
  echo "✅ Configuration PostCSS trouvée"
else
  echo "❌ Configuration PostCSS manquante, création..."
  cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL
  echo "✅ postcss.config.js créé"
fi

# 6. Rebuild
echo ""
echo "🔨 6. Reconstruction de l'application..."
echo ""
npm run build

# 7. Vérification finale
echo ""
echo "🔍 7. Vérification finale..."
if [ -d ".next" ]; then
  echo "✅ Build réussi! Dossier .next créé"
  echo ""
  echo "🎉 RÉPARATION TERMINÉE AVEC SUCCÈS!"
  echo ""
  echo "Pour démarrer l'application:"
  echo "npm run dev"
  echo ""
  echo "URL: http://localhost:3000 (ou autre port disponible)"
else
  echo "❌ La reconstruction a échoué. Vérifiez les erreurs ci-dessus."
  echo ""
  echo "Suggestions:"
  echo "1. Vérifiez les erreurs TypeScript dans le code"
  echo "2. Vérifiez la compatibilité des dépendances"
  echo "3. Essayez de mettre à jour Next.js: npm install next@latest"
fi

echo ""
