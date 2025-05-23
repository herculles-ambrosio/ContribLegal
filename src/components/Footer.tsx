import Link from 'next/link';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-blue text-white pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-4 flex flex-row items-center space-x-4">
              <Image 
                src="/LOGO_CL_trans.png" 
                alt="Contribuinte Legal" 
                width={140} 
                height={55} 
                className="rounded-lg" 
                style={{ objectFit: 'contain' }}
                priority
              />
              <Image 
                src="/Htechminas transparente.png" 
                alt="HTech Minas" 
                width={90} 
                height={30} 
                style={{ objectFit: 'contain' }}
              />
            </div>
            <p className="text-sm mb-3">
              Sistema para cadastro de documentos fiscais e participação em sorteios de prêmios.
            </p>
            <p className="text-sm opacity-75">
              © {currentYear} H-Tech Minas. Todos os direitos reservados.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-blue-400 pb-2">Links Úteis</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="hover:text-blue-300 transition-colors flex items-center">
                  <span className="mr-2">›</span> Início
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-blue-300 transition-colors flex items-center">
                  <span className="mr-2">›</span> Sobre o Programa
                </Link>
              </li>
              <li>
                <Link href="/regulamento" className="hover:text-blue-300 transition-colors flex items-center">
                  <span className="mr-2">›</span> Regulamento
                </Link>
              </li>
              <li>
                <Link href="/premios" className="hover:text-blue-300 transition-colors flex items-center">
                  <span className="mr-2">›</span> Prêmios
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-blue-400 pb-2">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <FaEnvelope className="text-blue-300" />
                <span>contato@contribuintelegal.com.br</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaPhone className="text-blue-300" />
                <span>(31) 9999-9999</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-blue-300" />
                <span>Lajinha, MG</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 