/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilita a verificação do ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de typescript durante o build também
    ignoreBuildErrors: true,
  },
  // Configurações adicionais para garantir compatibilidade
  output: 'standalone',
  poweredByHeader: false,
  
  // Permitir origens específicas em ambiente de desenvolvimento
  experimental: {
    allowedDevOrigins: ['192.168.1.225', 'localhost'],
    // Desabilitar a geração de etags para evitar problemas de cache
    disableGenerationETags: true
  },
  
  // Diretório de origem
  distDir: '.next',
  
  // Define o diretório que contém o código-fonte da aplicação
  transpilePackages: ['src'],
  
  // Configuração para localizar as pastas app e pages
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Redirecionar a raiz para o dashboard (para garantir compatibilidade)
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig; 