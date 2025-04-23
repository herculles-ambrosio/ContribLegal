'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extrair os parâmetros da URL após autenticação
    const handleRedirectResult = async () => {
      try {
        // Verificar se tem parâmetros de autenticação do Supabase
        const code = searchParams.get('code');
        
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
  }, [router, searchParams]);

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
