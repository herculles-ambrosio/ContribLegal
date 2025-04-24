'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '@/components/ui/Button';
import { FaSync, FaCamera, FaRedo, FaKeyboard, FaPaste } from 'react-icons/fa';

interface QrCodeScannerProps {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: any) => void;
  onClose?: () => void;
}

export default function QrCodeScanner({ onScanSuccess, onScanError, onClose }: QrCodeScannerProps) {
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<string>('Verificando ambiente...');
  const [hasError, setHasError] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQrValue, setManualQrValue] = useState('');
  const [isSecureContext, setIsSecureContext] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Verificar contexto seguro imediatamente quando o componente for montado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar explicitamente se estamos em um contexto seguro
    const secure = window.isSecureContext || 
                  window.location.protocol === 'https:' || 
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';
    
    console.log('Contexto seguro:', secure);
    setIsSecureContext(secure);
    
    if (!secure) {
      console.error('O site precisa estar em HTTPS para acessar a câmera');
      setMessage('Para usar a câmera, acesse este site via HTTPS. Use a entrada manual abaixo.');
      setHasError(true);
      setShowManualInput(true);
      if (onScanError) onScanError('Secure context required');
    } else {
      // Se estiver em contexto seguro, esperar um momento para o DOM render completamente
      setTimeout(() => {
        console.log('Inicializando scanner após delay...');
        initializeScanner();
      }, 500);
    }

    // Limpar recursos ao desmontar
    return () => {
      console.log('Desmontando componente QrCodeScanner');
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .catch(error => console.error('Erro ao parar scanner:', error));
      }
    };
  }, [onScanError]);

  // Função para inicializar o scanner diretamente sem verificações restritivas
  const initializeScanner = async () => {
    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Este navegador não suporta acesso à câmera');
        setMessage('Seu navegador não suporta acesso à câmera. Use a entrada manual abaixo.');
        setHasError(true);
        setShowManualInput(true);
        if (onScanError) onScanError('Media devices not supported');
        return;
      }
      
      // Garantir que o elemento existe antes de inicializar o scanner
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        console.error('Elemento qr-reader não encontrado no DOM');
        setMessage('Erro ao inicializar scanner: elemento HTML não encontrado.');
        setHasError(true);
        if (onScanError) onScanError('QR reader element not found');
        return;
      }
      
      // Criar uma instância do scanner com tratamento de erro melhorado
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        setHasError(false);
      } catch (scannerError) {
        console.error('Erro ao criar instância do scanner:', scannerError);
        setMessage('Falha ao inicializar o leitor de QR Code. Tente recarregar a página.');
        setHasError(true);
        setShowManualInput(true);
        if (onScanError) onScanError(scannerError);
        return;
      }
      
      try {
        // Tentar obter acesso à câmera antes de buscar a lista
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Liberar a câmera após o teste
        
        // Buscar câmeras disponíveis
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          console.log('Câmeras disponíveis:', devices);
          
          // Tentar usar a câmera traseira primeiro
          const rearCamera = devices.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('traseira') ||
            camera.label.toLowerCase().includes('environment')
          );
          
          // Usar a câmera traseira se disponível, senão usar a primeira
          const cameraId = rearCamera ? rearCamera.id : devices[0].id;
          setCurrentCamera(cameraId);
          
          // Iniciar o escaneamento com esta câmera
          await startScanner(cameraId);
        } else {
          throw new Error('Nenhuma câmera encontrada no dispositivo');
        }
      } catch (error: any) {
        console.error('Erro ao buscar câmeras:', error);
        
        // Verificar se é o erro específico de contexto não seguro
        if (error.toString().includes('secure context')) {
          setMessage('Para usar a câmera, você precisa acessar este site via HTTPS. Use a entrada manual abaixo.');
          setShowManualInput(true);
        } else if (error.toString().includes('Permission denied') || error.toString().includes('Permission dismissed')) {
          setMessage('Permissão da câmera negada. Verifique as configurações do seu navegador ou use a entrada manual.');
          setShowManualInput(true);
        } else {
          setMessage('Câmera não disponível. Use a entrada manual abaixo.');
          setShowManualInput(true);
        }
        
        setHasError(true);
        if (onScanError) onScanError(error);
      }
    } catch (error) {
      console.error('Erro ao inicializar scanner:', error);
      setMessage('Não foi possível inicializar o leitor de QR Code. Use a entrada manual.');
      setHasError(true);
      setShowManualInput(true);
      if (onScanError) onScanError(error);
    }
  };

  // Função para tentar novamente
  const handleRetry = () => {
    // Se não estiver em contexto seguro, não tentar novamente
    if (isSecureContext === false) {
      setMessage('Para usar a câmera, acesse este site via HTTPS. Use a entrada manual abaixo.');
      setShowManualInput(true);
      return;
    }

    setMessage('Tentando iniciar câmera novamente...');
    setHasError(false);
    
    // Parar o scanner atual se estiver em execução
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      
      // Remover a referência atual
      scannerRef.current = null;
    }
    
    // Limpar o elemento do scanner
    const scannerElement = document.getElementById('qr-reader');
    if (scannerElement) {
      scannerElement.innerHTML = '';
    }
    
    // Reiniciar o scanner
    setTimeout(() => {
      initializeScanner();
    }, 500);
  };

  // Alternar entre câmeras
  const switchCamera = async () => {
    if (!cameras || cameras.length <= 1) return;
    
    try {
      // Parar o scanner atual
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      
      // Encontrar a próxima câmera na lista
      const currentIndex = cameras.findIndex(camera => camera.id === currentCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCameraId = cameras[nextIndex].id;
      
      // Atualizar a câmera atual
      setCurrentCamera(nextCameraId);
      
      // Reiniciar o scanner com a nova câmera
      await startScanner(nextCameraId);
      
      setMessage(`Usando câmera: ${cameras[nextIndex].label || 'Desconhecida'}`);
    } catch (error) {
      console.error('Erro ao alternar câmeras:', error);
      setMessage('Erro ao alternar câmeras. Tente novamente.');
      setHasError(true);
    }
  };

  // Iniciar o scanner com a câmera especificada
  const startScanner = async (cameraId: string) => {
    if (!scannerRef.current) {
      console.error('Scanner não inicializado');
      return;
    }
    
    try {
      setIsScanning(true);
      console.log('Iniciando scanner com câmera ID:', cameraId);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log('QR Code detectado:', decodedText);
        // Parar o scanner após um sucesso
        if (scannerRef.current) {
          scannerRef.current.stop()
            .then(() => {
              setIsScanning(false);
              console.log('Scanner parado com sucesso após detecção');
              // Chamar o callback de sucesso imediatamente
              onScanSuccess(decodedText);
            })
            .catch(error => {
              console.error('Erro ao parar scanner após sucesso:', error);
              // Mesmo com erro, chamar o callback
              onScanSuccess(decodedText);
            });
        } else {
          // Se por algum motivo o scanner não estiver disponível, ainda assim chamar o callback
          console.log('Scanner não disponível ao tentar parar, chamando callback diretamente');
          onScanSuccess(decodedText);
        }
      };

      const config = {
        fps: 15,
        qrbox: {
          width: 320,
          height: 320,
        },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true
      };

      await scannerRef.current.start(
        cameraId, 
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Ignorar mensagens de erro comuns durante o escaneamento 
          // que não necessitam ser reportadas ao usuário
          if (
            typeof errorMessage === 'string' && (
              errorMessage.includes('No QR code found') ||
              errorMessage.includes('Scanning paused')
            )
          ) {
            return;
          }
          
          console.log('Erro durante o scan:', errorMessage);
        }
      );
      
      setMessage('Aponte a câmera para o QR code...');
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setMessage('Falha ao iniciar a câmera. Você pode inserir o QR code manualmente.');
      setIsScanning(false);
      setHasError(true);
      if (onScanError) onScanError(error);
    }
  };

  // Processar entrada manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualQrValue.trim()) {
      onScanSuccess(manualQrValue.trim());
    }
  };

  // Colar do clipboard
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
    <div className="qr-scanner-wrapper">
      <div className="md:flex gap-4">
        {/* Área de escaneamento da câmera - mostra apenas se estiver em contexto seguro */}
        {isSecureContext && (
          <div className={`${showManualInput ? 'hidden md:block' : 'block'} md:flex-1`}>
            <div 
              id="qr-reader" 
              ref={scannerContainerRef} 
              className="w-full h-80 overflow-hidden bg-gray-100 rounded-lg relative"
            ></div>
            
            <div className="text-center mt-2 mb-2">
              <p className={`text-sm ${isScanning ? 'text-blue-600' : (hasError ? 'text-red-500' : 'text-blue-600')}`}>
                {message}
              </p>
            </div>

            <div className="flex justify-center mt-2 mb-4 gap-2 flex-wrap">
              {hasError && isSecureContext === true && (
                <Button 
                  type="button"
                  variant="danger"
                  onClick={handleRetry}
                  className="text-sm md:text-base flex items-center gap-2"
                >
                  <FaRedo size={14} />
                  Tentar novamente
                </Button>
              )}
              
              {cameras.length > 1 && !hasError && (
                <Button 
                  type="button"
                  variant="info"
                  onClick={switchCamera}
                  className="text-sm md:text-base flex items-center gap-2"
                >
                  <FaSync size={14} />
                  Alternar câmera
                </Button>
              )}
              
              <Button 
                type="button"
                variant={showManualInput ? "primary" : "secondary"}
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-sm md:text-base flex items-center gap-2 md:hidden"
              >
                <FaKeyboard size={14} />
                {showManualInput ? "Usar câmera" : "Inserir manualmente"}
              </Button>
            </div>
          </div>
        )}
        
        {/* Área de entrada manual - sempre presente em dispositivos desktop, fica ao lado do scanner */}
        <div className={`${(showManualInput || isSecureContext === false) ? 'block' : 'hidden md:block'} md:flex-1`}>
          <div className="p-4 bg-gray-100 rounded-lg">
            {isSecureContext === false && (
              <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                <h4 className="font-bold">HTTPS Necessário</h4>
                <p className="text-sm">
                  O acesso à câmera só é permitido em sites HTTPS ou localhost por questões de segurança do navegador. 
                  Como alternativa, você pode usar a entrada manual abaixo.
                </p>
                <div className="mt-2 bg-white p-2 rounded text-xs">
                  <p className="font-semibold">Para resolver este problema:</p>
                  <ol className="list-decimal list-inside">
                    <li>Acesse o site via HTTPS</li>
                    <li>Use "localhost" em desenvolvimento local</li>
                    <li>Configure SSL no servidor web</li>
                  </ol>
                </div>
              </div>
            )}
            
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
                  autoFocus={isSecureContext === false}
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
              
              <div className="flex gap-2 justify-end">
                {isSecureContext === true && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-sm md:hidden"
                  >
                    Voltar para câmera
                  </Button>
                )}
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
        </div>
      </div>

      <style jsx>{`
        .qr-scanner-wrapper {
          width: 100%;
        }

        :global(#qr-reader) {
          width: 100% !important;
          border: none !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
          min-height: 320px !important;
        }

        :global(#qr-reader video) {
          width: 100% !important;
          height: auto !important;
          object-fit: cover !important;
          border-radius: 0.375rem !important;
        }

        :global(#qr-reader__scan_region) {
          background: rgba(0, 0, 0, 0.1) !important;
          overflow: hidden !important;
          position: relative !important;
        }

        :global(#qr-reader__scan_region img) {
          display: none !important;
        }

        :global(#qr-reader__dashboard) {
          display: none !important;
        }
        
        /* Estilo para as linhas de escaneamento */
        :global(#qr-reader__scan_region::before) {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 4px solid rgba(0, 123, 255, 0.7) !important;
          box-sizing: border-box !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
} 