import { redirect } from "next/navigation";

// Esta página existe apenas para garantir que a estrutura de pastas seja reconhecida pela Vercel
export default function PageIndex() {
  // Redirecionamos para a estrutura App Router
  if (typeof window !== 'undefined') {
    window.location.href = '/';
    return null;
  }
  
  return <div>Redirecionando...</div>;
} 