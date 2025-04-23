'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Componente interno que usa useSearchParams
function AuthCallbackContent() {
  const router = useRouter();
  
  useEffect(() => {
    // Obter o código da URL usando window.location
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    const handleRedirectResult = async () => {
      try {
        if (code) {
          // Processar o resultado da autenticação
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Erro na autenticação:', error);
            router.push('/login?error=Falha na autenticação');
            return;
          }
          
          // Redirecionar para a página principal em caso de sucesso
          router.push('/');
        } else {
          // Se não houver código, voltar para a página de login
          router.push('/login');
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        router.push('/login?error=Erro desconhecido');
      }
    };

    handleRedirectResult();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Processando autenticação</h1>
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-gray-600">
          Por favor, aguarde enquanto processamos sua autenticação...
        </p>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
