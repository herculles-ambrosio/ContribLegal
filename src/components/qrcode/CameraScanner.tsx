'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Button from '../ui/Button';
import { FaCamera, FaExchangeAlt, FaSync } from 'react-icons/fa';

export interface CameraScannerProps {
  onScanSuccess: (qrCodeValue: string) => void;
  onError?: (errorMessage: string) => void;
}

export default function CameraScanner({ onScanSuccess, onError }: CameraScannerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Inicializa o scanner
  useEffect(() => {
    const qrCodeScanner = new Html5Qrcode('qrcode-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    
    html5QrCodeRef.current = qrCodeScanner;

    const initializeScanner = async () => {
      try {
        setIsInitializing(true);
        
        // Verifica se o navegador tem suporte para a API de câmera
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          const availableCameras = devices.map(device => ({
            id: device.id,
            label: device.label || `Câmera ${device.id}`
          }));
          
          setCameras(availableCameras);
          setSelectedCamera(availableCameras[0].id);
        } else {
          const errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        const errorMsg = 'Erro ao acessar a câmera: ' + (err instanceof Error ? err.message : String(err));
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Erro ao inicializar scanner:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeScanner();

    return () => {
      // Limpa quando o componente for desmontado
      if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCodeRef.current?.stop()
          .catch(error => console.error('Erro ao parar scanner:', error));
      }
    };
  }, [onError]);

  // Inicia o scanner quando uma câmera é selecionada
  useEffect(() => {
    if (!isInitializing && selectedCamera && !scannerStarted && html5QrCodeRef.current) {
      startScanner();
    }
  }, [isInitializing, selectedCamera, scannerStarted]);

  const startScanner = async () => {
    if (!selectedCamera || !html5QrCodeRef.current) return;
    
    try {
      setError(null);
      setScannerStarted(true);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        config,
        handleScanSuccess,
        handleScanFailure
      );
    } catch (err) {
      const errorMsg = 'Erro ao iniciar o scanner: ' + (err instanceof Error ? err.message : String(err));
      setScannerStarted(false);
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Erro ao iniciar o scanner:', err);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop()
        .then(() => {
          onScanSuccess(decodedText);
          setScannerStarted(false);
        })
        .catch(err => {
          console.error('Erro ao parar o scanner após sucesso:', err);
        });
    }
  };

  const handleScanFailure = (error: string) => {
    // Somente para depuração, não exibimos esses erros para o usuário
    // console.debug('Falha na leitura do QR code:', error);
  };

  const handleRetry = async () => {
    if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
      await html5QrCodeRef.current.stop();
      setScannerStarted(false);
    }
    
    setError(null);
    setIsInitializing(true);
    
    try {
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        const availableCameras = devices.map(device => ({
          id: device.id,
          label: device.label || `Câmera ${device.id}`
        }));
        
        setCameras(availableCameras);
        setSelectedCamera(availableCameras[0].id);
      } else {
        const errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Erro ao acessar a câmera: ' + (err instanceof Error ? err.message : String(err));
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const switchCamera = () => {
    if (!cameras || cameras.length <= 1) return;
    
    const stopScanner = async () => {
      if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
        await html5QrCodeRef.current.stop();
        setScannerStarted(false);
      }
      
      // Encontra a próxima câmera na lista
      const currentIndex = cameras.findIndex(camera => camera.id === selectedCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCamera(cameras[nextIndex].id);
    };
    
    stopScanner();
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        id="qrcode-reader" 
        ref={scannerContainerRef}
        className="w-full max-w-sm h-64 bg-gray-100 relative rounded-lg overflow-hidden"
      >
        {isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Inicializando câmera...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="h-10 w-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <Button onClick={handleRetry} variant="secondary" className="text-sm flex items-center gap-1">
                <FaSync size={14} /> Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {!isInitializing && !error && (
        <div className="mt-4 w-full max-w-sm">
          {cameras.length > 1 && (
            <Button 
              onClick={switchCamera} 
              variant="secondary"
              className="w-full text-sm flex items-center justify-center gap-1 mb-2"
              disabled={isInitializing}
            >
              <FaExchangeAlt size={14} />
              Trocar câmera ({cameras.findIndex(camera => camera.id === selectedCamera) + 1}/{cameras.length})
            </Button>
          )}
          <div className="text-sm text-center text-gray-600">
            <p>Posicione o QR Code do cupom fiscal dentro da área de leitura</p>
          </div>
        </div>
      )}
    </div>
  );
} 