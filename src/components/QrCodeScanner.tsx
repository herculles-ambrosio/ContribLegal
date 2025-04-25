'use client';

import { useState } from 'react';
import CameraScanner from './qrcode/CameraScanner';
import ManualQrInput from './qrcode/ManualQrInput';
import Button from './ui/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

interface QrCodeScannerProps {
  onSubmit: (qrCodeValue: string) => void;
}

export default function QrCodeScanner({ onSubmit }: QrCodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(
    typeof window !== 'undefined' && window.isSecureContext
  );

  // Manipuladores de eventos
  const handleScanSuccess = (qrCodeValue: string) => {
    setError(null);
    onSubmit(qrCodeValue);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'camera' ? 'manual' : 'camera');
    setError(null);
  };

  // Renderizar mensagem de aviso se não estiver em contexto seguro
  if (!isSecureContext) {
    return (
      <div className="p-4 text-center bg-yellow-50 border-2 border-yellow-500 rounded-lg">
        <div className="flex items-center justify-center mb-3">
          <FaExclamationTriangle className="text-yellow-500 mr-2" size={24} />
          <h3 className="font-semibold text-lg">Aviso de Segurança</h3>
        </div>
        <p className="mb-3">
          O acesso à câmera só é permitido em contextos seguros (HTTPS). Use um dos métodos abaixo:
        </p>
        <ul className="text-left mb-4 list-disc pl-5">
          <li>Acesse esta página via HTTPS</li>
          <li>Use o domínio localhost</li>
          <li>Digite manualmente o código QR</li>
        </ul>
        <ManualQrInput onSubmit={handleScanSuccess} />
      </div>
    );
  }

  return (
    <div className="qr-scanner-wrapper">
      {/* Botões de alternância entre modos */}
      <div className="mb-4 flex justify-center space-x-2">
        <Button
          onClick={() => setMode('camera')}
          variant={mode === 'camera' ? 'primary' : 'secondary'}
          className="flex-1"
        >
          Usar Câmera
        </Button>
        <Button
          onClick={() => setMode('manual')}
          variant={mode === 'manual' ? 'primary' : 'secondary'}
          className="flex-1"
        >
          Digitar Código
        </Button>
      </div>

      {/* Exibir mensagem de erro */}
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Renderizar componente baseado no modo atual */}
      {mode === 'camera' ? (
        <CameraScanner onScanSuccess={handleScanSuccess} onError={handleError} />
      ) : (
        <ManualQrInput onSubmit={handleScanSuccess} />
      )}
    </div>
  );
} 