'use client';

import { useState } from 'react';
import Button from '../ui/Button';
import { FaPaste } from 'react-icons/fa';

export interface ManualQrInputProps {
  onSubmit: (qrCodeValue: string) => void;
}

export default function ManualQrInput({ onSubmit }: ManualQrInputProps) {
  const [manualQrValue, setManualQrValue] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQrValue.trim()) {
      onSubmit(manualQrValue.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setManualQrValue(text);
    } catch (error) {
      console.error('Erro ao ler clipboard:', error);
      alert('Não foi possível acessar a área de transferência. Tente colar manualmente (Ctrl+V).');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Inserir QR Code manualmente</h3>
      <p className="text-sm text-gray-600 mb-4">
        Cole o link do QR Code do cupom fiscal ou digite-o manualmente abaixo:
      </p>
      
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={manualQrValue}
            onChange={(e) => setManualQrValue(e.target.value)}
            placeholder="https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handlePaste}
            className="text-sm flex items-center gap-1"
          >
            <FaPaste size={14} />
            Colar
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          <p className="font-medium mb-1">Como encontrar o link do QR Code:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Procure o QR Code na parte inferior do cupom fiscal</li>
            <li>Use outro aplicativo para escanear o QR Code e copiar o link</li>
            <li>Cole o link no campo acima</li>
          </ol>
          <p className="mt-2">Exemplo de formato:</p>
          <code className="block mt-1 overflow-x-auto whitespace-nowrap text-xs">
            https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31250425102146015443650040001107141020411084|2|1|1|0172D6F09E7E1B814AD910004D4A9D003AA35C2D
          </code>
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            className="text-sm"
            disabled={!manualQrValue.trim()}
          >
            Confirmar
          </Button>
        </div>
      </form>
    </div>
  );
} 