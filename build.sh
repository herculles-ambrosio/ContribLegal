#!/bin/bash

# Script de build personalizado para corrigir problemas de estrutura
echo "Verificando estrutura de pastas..."

# Garantir que as pastas app e pages existam na raiz
mkdir -p app pages

# Copiar arquivos da estrutura src/app para a raiz se necessário
if [ ! -f "app/page.js" ] && [ -f "src/app/page.tsx" ]; then
  echo "Copiando arquivos da pasta src/app para app..."
  cp -r src/app/* app/
fi

# Executar o build do Next.js
echo "Executando build do Next.js..."
next build 