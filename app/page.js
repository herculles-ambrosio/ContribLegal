// app/page.js
import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona para a página principal
  redirect('/');
  
  // Este trecho nunca será executado devido ao redirecionamento acima
  return null;
} 