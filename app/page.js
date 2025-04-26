// app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirecionar para a página de dashboard em vez de redirecionar para si mesmo
  redirect('/dashboard');
  
  // Este trecho nunca será executado devido ao redirecionamento acima
  return null;
} 