'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
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
    // Configurações otimizadas para o scanner de QR code
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
          // Priorizar câmera traseira para melhor leitura de QR code
          const rearCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('traseira') ||
            device.label.toLowerCase().includes('rear'));
          
          const availableCameras = devices.map(device => ({
            id: device.id,
            label: device.label || `Câmera ${device.id}`
          }));
          
          setCameras(availableCameras);
          
          // Se encontrar uma câmera traseira, use-a; caso contrário, use a primeira
          if (rearCamera) {
            setSelectedCamera(rearCamera.id);
          } else {
            setSelectedCamera(availableCameras[0].id);
          }
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
  
  // Pré-processa o link do QR Code para garantir que seja válido
  const preprocessQrResult = (decodedText: string): string => {
    console.log('Pré-processando QR code:', decodedText);
    
    // Remove espaços em branco e caracteres indesejados
    let cleanText = decodedText.trim();
    
    // Verifica se o texto já é uma URL
    if (/^https?:\/\//i.test(cleanText)) {
      console.log('Texto já é uma URL válida');
      return cleanText;
    }
    
    // Se for apenas números (44 dígitos = chave de acesso), pode ser tratado diretamente
    if (/^\d{44}$/.test(cleanText)) {
      console.log('QR code é uma chave de acesso de 44 dígitos');
      return cleanText;
    }
    
    // Verifica se contém uma URL completa em algum lugar no texto
    const urlRegex = /(https?:\/\/[^\s<>"']+)/i;
    const urlMatch = cleanText.match(urlRegex);
    if (urlMatch) {
      console.log('URL extraída do texto do QR code:', urlMatch[0]);
      // Extrair a URL completa até encontrar espaço ou outro delimitador
      let fullUrl = urlMatch[0];
      
      // Alguns QR codes podem ter a URL terminando com aspas ou outros caracteres
      if (fullUrl.endsWith('"') || fullUrl.endsWith("'") || 
          fullUrl.endsWith('>') || fullUrl.endsWith(')')) {
        fullUrl = fullUrl.slice(0, -1);
      }
      
      // Se a URL contiver caracteres de escape \, removê-los
      fullUrl = fullUrl.replace(/\\(.)/g, '$1');
      
      return fullUrl;
    }
    
    // Verifica se parece ser um texto codificado ou truncado que contém http ou https
    if (cleanText.includes('http') || cleanText.includes('https')) {
      console.log('Texto contém fragmentos de URL, tentando reconstruir');
      
      // Tenta extrair uma possível URL começando com http ou https
      const httpPos = cleanText.indexOf('http');
      if (httpPos >= 0) {
        const possibleUrl = cleanText.substring(httpPos);
        console.log('Possível URL reconstruída:', possibleUrl);
        return possibleUrl;
      }
    }
    
    // Se não conseguimos identificar como URL, retornamos o texto original
    console.log('Retornando texto original não modificado');
    return cleanText;
  };

  const startScanner = async () => {
    if (!selectedCamera || !html5QrCodeRef.current) return;
    
    try {
      setError(null);
      setScannerStarted(true);
      
      // Configurações otimizadas para melhor desempenho
      const config = {
        fps: 15, // Aumentado para melhor desempenho
        qrbox: { width: 300, height: 300 }, // Área de escaneamento maior
        aspectRatio: 1.0,
        disableFlip: false, // Permitir virar a imagem
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Usar detector de código de barras nativo se disponível
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      };
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        config,
        (decodedText) => handleScanSuccess(decodedText),
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
    console.log('QR Code lido com sucesso:', decodedText);
    
    // Pré-processar o QR code para garantir que é uma URL válida
    const processedText = preprocessQrResult(decodedText);
    
    // Verificar se o texto é uma URL e abrir diretamente
    if (/^https?:\/\//i.test(processedText)) {
      console.log('Abrindo URL do QR code:', processedText);
      
      // Abrir o link em uma nova aba
      if (typeof window !== 'undefined') {
        window.open(processedText, '_blank');
      }
    }
    
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop()
        .then(() => {
          onScanSuccess(processedText);
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
        const rearCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('traseira') ||
          device.label.toLowerCase().includes('rear'));
          
        const availableCameras = devices.map(device => ({
          id: device.id,
          label: device.label || `Câmera ${device.id}`
        }));
        
        setCameras(availableCameras);
        
        // Se encontrar uma câmera traseira, use-a; caso contrário, use a primeira
        if (rearCamera) {
          setSelectedCamera(rearCamera.id);
        } else {
          setSelectedCamera(availableCameras[0].id);
        }
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
        className="w-full max-w-sm h-72 bg-gray-100 relative rounded-lg overflow-hidden"
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
        
        {!isInitializing && !error && scannerStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-dashed border-blue-500 rounded-lg"></div>
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