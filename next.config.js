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
    allowedDevOrigins: ['192.168.1.225'],
  },
  
  // Diretório de origem
  distDir: '.next'
};

module.exports = nextConfig; 