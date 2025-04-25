/**
 * Script para garantir a estrutura correta de diretórios antes do build na Vercel
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando script de build para Vercel...');

// Garantir que as pastas app e pages existam na raiz
if (!fs.existsSync('app')) {
  console.log('Criando pasta app...');
  fs.mkdirSync('app', { recursive: true });
}

if (!fs.existsSync('pages')) {
  console.log('Criando pasta pages...');
  fs.mkdirSync('pages', { recursive: true });
}

// Criar arquivos mínimos necessários se não existirem
if (!fs.existsSync('app/page.js')) {
  console.log('Criando app/page.js...');
  fs.writeFileSync('app/page.js', `
    export default function HomePage() {
      return <div>Home Page</div>;
    }
  `);
}

if (!fs.existsSync('app/layout.js')) {
  console.log('Criando app/layout.js...');
  fs.writeFileSync('app/layout.js', `
    export default function RootLayout({ children }) {
      return (
        <html>
          <head>
            <title>Contribuinte Legal</title>
          </head>
          <body>{children}</body>
        </html>
      );
    }
  `);
}

// Copiar conteúdo da pasta src/app se necessário
if (fs.existsSync('src/app')) {
  console.log('Verificando arquivos em src/app...');
  
  try {
    const srcAppFiles = fs.readdirSync('src/app');
    
    // Copiar arquivos essenciais da pasta src/app para app se não existirem
    srcAppFiles.forEach(file => {
      const srcPath = path.join('src/app', file);
      const destPath = path.join('app', file);
      
      // Verificar se é pasta ou arquivo
      if (fs.lstatSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          console.log(`Copiando pasta ${file} para app/...`);
          // Como não temos fs.cpSync no Node.js padrão, executamos um comando do sistema
          try {
            if (process.platform === 'win32') {
              execSync(`xcopy /E /I "${srcPath}" "${destPath}"`);
            } else {
              execSync(`cp -r "${srcPath}" "${destPath}"`);
            }
          } catch (err) {
            console.error(`Erro ao copiar pasta: ${err.message}`);
          }
        }
      } else if (!fs.existsSync(destPath)) {
        console.log(`Copiando arquivo ${file} para app/...`);
        fs.copyFileSync(srcPath, destPath);
      }
    });
  } catch (err) {
    console.error(`Erro ao ler diretório src/app: ${err.message}`);
  }
}

// Executar o build do Next.js
console.log('Executando build do Next.js...');
try {
  execSync('npx next build', { stdio: 'inherit' });
} catch (err) {
  console.error(`Erro durante o build: ${err.message}`);
  process.exit(1);
} 