'use client';

import { useState, useEffect } from 'react';
import CameraScanner from './qrcode/CameraScanner';
import ManualQrInput from './qrcode/ManualQrInput';
import Button from './ui/Button';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FiscalReceiptData } from '@/lib/services/fiscalReceiptService';
import toast from 'react-hot-toast';

interface QrCodeScannerProps {
  onSubmit: (qrCodeValue: string) => void;
}

export default function QrCodeScanner({ onSubmit }: QrCodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(
    typeof window !== 'undefined' && window.isSecureContext
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageData, setPageData] = useState<FiscalReceiptData | null>(null);

  // Manipuladores de eventos
  const handleScanSuccess = async (qrCodeValue: string) => {
    setError(null);
    
    if (!qrCodeValue) {
      setError('QR Code vazio ou inválido.');
      return;
    }
    
    // Se a URL iniciar com http, processar a extração
    if (/^https?:\/\//i.test(qrCodeValue)) {
      console.log('QrCodeScanner: Processando URL:', qrCodeValue);
      
      try {
        setIsProcessing(true);
        
        // Importação dinâmica para melhor performance
        const { fetchReceiptPage } = await import('@/lib/services/fiscalReceiptService');
        
        // Acessar a URL e extrair dados
        const data = await fetchReceiptPage(qrCodeValue);
        
        if (data) {
          console.log('Dados extraídos com sucesso:', data);
          setPageData(data);
          
          // Exibir toast com as informações básicas extraídas
          toast.success(`Dados extraídos: ${data.issuer.name} - R$ ${data.receipt.totalValue.toFixed(2)}`);
          
          // Abrir a URL em uma nova aba para visualização se necessário
          if (typeof window !== 'undefined') {
            window.open(qrCodeValue, '_blank');
          }
        } else {
          console.warn('Não foi possível extrair dados da página');
          toast.error('Não foi possível extrair dados da página. Continuando processo normal.');
        }
      } catch (error) {
        console.error('Erro ao processar página:', error);
        toast.error('Erro ao processar página. Continuando processo normal.');
      } finally {
        setIsProcessing(false);
      }
    }
    
    // Passar o valor para o componente pai (acontece independente de conseguir ou não os dados)
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

  // Renderizar informações extraídas quando disponíveis
  if (pageData && !isProcessing) {
    return (
      <div className="p-4 border rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold mb-2">Dados Extraídos do Cupom Fiscal</h3>
        
        <div className="mb-4 space-y-2">
          <div>
            <span className="text-sm text-gray-600">Emitente:</span>
            <p className="font-medium">{pageData.issuer.name}</p>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Valor Total:</span>
            <p className="font-medium text-green-700">
              R$ {pageData.receipt.totalValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Data de Emissão:</span>
            <p className="font-medium">{pageData.receipt.issueDate}</p>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            <p>URL do QR Code: {pageData.qrCodeUrl.substring(0, 50)}...</p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            onClick={() => {
              // Para fins de debug, exibe todos os dados
              console.log('Dados completos:', pageData);
              alert(JSON.stringify(pageData, null, 2));
            }}
            variant="secondary"
            className="text-xs"
          >
            Debug Dados
          </Button>
          
          <Button
            onClick={() => onSubmit(pageData.qrCodeUrl)}
            className="text-sm"
          >
            Confirmar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-wrapper">
      {/* Indicador de processamento */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-blue-600">Processando QR Code e extraindo dados...</p>
        </div>
      )}
    
      {/* Botões de alternância entre modos */}
      <div className="mb-4 flex justify-center space-x-2">
        <Button
          onClick={() => setMode('camera')}
          variant={mode === 'camera' ? 'primary' : 'secondary'}
          className="flex-1"
          disabled={isProcessing}
        >
          Usar Câmera
        </Button>
        <Button
          onClick={() => setMode('manual')}
          variant={mode === 'manual' ? 'primary' : 'secondary'}
          className="flex-1"
          disabled={isProcessing}
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