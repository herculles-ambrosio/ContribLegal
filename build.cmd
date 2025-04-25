@echo off
echo Verificando estrutura de pastas...

REM Garantir que as pastas app e pages existam na raiz
if not exist app mkdir app
if not exist pages mkdir pages

REM Copiar arquivos da estrutura src/app para a raiz se necessário
if not exist app\page.js if exist src\app\page.tsx (
  echo Copiando arquivos da pasta src/app para app...
  xcopy /E /I src\app\* app\
)

REM Executar o build do Next.js
echo Executando build do Next.js...
npx next build 