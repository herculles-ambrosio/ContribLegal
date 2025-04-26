'use client';

import React, { useEffect, useState } from "react";
import CameraScanner from './qrcode/CameraScanner';
import ManualQrInput from './qrcode/ManualQrInput';
import Button from './ui/Button';
import { FaExclamationTriangle, FaTimes, FaSpinner } from 'react-icons/fa';
import { FiscalReceiptData } from '@/lib/services/fiscalReceiptService';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Input } from "./ui/input";
import { fetchReceiptPage } from "@/lib/services/fiscalReceiptService";

// Componente alternativo de ícones para evitar dependência externa
const Icons = {
  close: FaTimes,
  spinner: FaSpinner
};

interface QrCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrCode: string, extractedData?: FiscalReceiptData | null) => void;
}

export default function QrCodeScanner({ isOpen, onClose, onScanSuccess }: QrCodeScannerProps) {
  const [qrMode, setQrMode] = useState<"camera" | "manual">("camera");
  const [manualQrCode, setManualQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<FiscalReceiptData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [processingQrCode, setProcessingQrCode] = useState(false);

  useEffect(() => {
    // Resetar estado quando o modal for aberto
    if (isOpen) {
      setIsScanning(true);
      setError(null);
      setCameraError(null);
      setExtractedData(null);
      setManualQrCode("");
      setIsExtracting(false);
      setProcessingQrCode(false);
    } else {
      setIsScanning(false);
    }
  }, [isOpen]);

  const handleScanSuccess = async (qrCodeValue: string) => {
    console.log("QR code escaneado com sucesso:", qrCodeValue);
    
    // Verificar se já está processando para evitar duplicação
    if (processingQrCode) {
      console.log("Já está processando um QR code, ignorando nova leitura");
      return;
    }
    
    setProcessingQrCode(true);
    setIsScanning(false); // Parar a digitalização imediatamente após capturar o código
    
    try {
      // Verificar se o QR code é uma URL
      const isUrl = /^https?:\/\//i.test(qrCodeValue);
      
      if (isUrl) {
        // Tentar abrir a URL imediatamente
        console.log("Tentando abrir URL:", qrCodeValue);
        setIsExtracting(true);
        
        try {
          // Tentar abrir em nova aba primeiro
          const newTab = window.open(qrCodeValue, '_blank');
          
          if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
            console.log("Não foi possível abrir em nova aba. Tentando criar iframe...");
            
            // Se não conseguir abrir em nova aba, criar um iframe temporário
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = qrCodeValue;
            document.body.appendChild(iframe);
            
            // Perguntar ao usuário se deseja redirecionar
            if (confirm("Deseja abrir o link do cupom fiscal em uma nova janela?")) {
              document.location.href = qrCodeValue;
            }
            
            // Remover iframe após alguns segundos
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 5000);
          }
        } catch (windowError) {
          console.error("Erro ao tentar abrir a URL:", windowError);
          // Continuar mesmo se não conseguir abrir a janela
        }
        
        // Independentemente de ter conseguido abrir a URL, tentar extrair os dados
        try {
          // Importar dinamicamente para reduzir tamanho do bundle inicial
          const data = await fetchReceiptPage(qrCodeValue);
          console.log("Dados extraídos da página:", data);
          
          setExtractedData(data);
          
          if (data && (data.receipt.totalValue > 0 || data.issuer.name !== 'ESTABELECIMENTO COMERCIAL')) {
            toast.success("Dados extraídos com sucesso!");
            // Chamar callback com os dados extraídos
            onScanSuccess(qrCodeValue, data);
            onClose();
          } else {
            toast.error("Não foi possível extrair todos os dados. Continuando com o link do cupom.");
            onScanSuccess(qrCodeValue, null);
            onClose();
          }
        } catch (extractError) {
          console.error("Erro ao extrair dados da página:", extractError);
          toast.error("Erro ao extrair dados da página. Continuando com o link do cupom.");
          onScanSuccess(qrCodeValue, null);
          onClose();
        }
      } else {
        // Se não for URL, apenas retornar o valor do QR code
        console.log("QR code não é uma URL. Valor:", qrCodeValue);
        onScanSuccess(qrCodeValue);
        onClose();
      }
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      setError("Erro ao processar o QR code. Tente novamente.");
    } finally {
      setIsExtracting(false);
      setProcessingQrCode(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQrCode) {
      setError("Digite um código QR válido");
      return;
    }
    handleScanSuccess(manualQrCode);
  };

  const handleCameraError = (errorMsg: string) => {
    console.error("Erro na câmera:", errorMsg);
    setCameraError(errorMsg);
    // Mudar automaticamente para o modo manual se houver erro na câmera
    setQrMode("manual");
    toast.error("Não foi possível acessar a câmera. Por favor, insira o código manualmente.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
        <button
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <Icons.close className="h-5 w-5" />
        </button>
        
        <h2 className="mb-4 text-center text-xl font-bold">Leitor de QR Code</h2>
        
        <Tabs defaultValue="camera" value={qrMode} onValueChange={(v: string) => setQrMode(v as "camera" | "manual")}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="camera">Câmera</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="camera" className="space-y-4">
            {cameraError ? (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
                <p>Erro na câmera: {cameraError}</p>
                <p className="mt-2">Por favor, utilize a entrada manual.</p>
              </div>
            ) : (
              <>
                <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                  {isScanning && (
                    <CameraScanner 
                      onScanSuccess={handleScanSuccess} 
                      onError={handleCameraError}
                    />
                  )}
                </div>
                <p className="text-center text-sm text-gray-500">
                  Posicione o QR Code do cupom fiscal em frente à câmera
                </p>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="manual-qr-code" className="block text-sm font-medium text-gray-700">
                  URL ou Código do Cupom Fiscal
                </label>
                <Input
                  id="manual-qr-code"
                  value={manualQrCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualQrCode(e.target.value)}
                  placeholder="https://... ou código do cupom"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full">
                Confirmar
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        
        {isExtracting && (
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-500 flex items-center">
            <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
            Extraindo dados do cupom fiscal...
          </div>
        )}
        
        {extractedData && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm">
            <p className="font-medium text-green-700">Dados extraídos:</p>
            <div className="mt-2 space-y-1 text-green-600">
              {extractedData.receipt.totalValue > 0 && (
                <p>Valor: R$ {extractedData.receipt.totalValue.toFixed(2)}</p>
              )}
              {extractedData.receipt.issueDate && (
                <p>Data: {extractedData.receipt.issueDate}</p>
              )}
              {extractedData.issuer.name !== 'ESTABELECIMENTO COMERCIAL' && (
                <p>Emitente: {extractedData.issuer.name}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Caso tenha dificuldades com a leitura, insira o código manualmente</p>
        </div>
      </div>
    </div>
  );
} 