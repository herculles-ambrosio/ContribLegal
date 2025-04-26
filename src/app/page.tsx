'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página de dashboard
    router.push('/dashboard');
  }, [router]);
  
  // Conteúdo que será mostrado até que o redirecionamento ocorra
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Contribuinte Legal</h1>
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Iniciando o sistema...</p>
      </div>
    </div>
  );
}
