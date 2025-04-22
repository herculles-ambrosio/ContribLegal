'use client';

import { FiscalReceiptData } from '@/lib/services/fiscalReceiptService';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import { FaDownload, FaTimes, FaCheck } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Estendendo o tipo jsPDF para incluir o método autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface FiscalReceiptModalProps {
  data: FiscalReceiptData;
  onClose: () => void;
  onConfirm: (data: FiscalReceiptData) => void;
}

export default function FiscalReceiptModal({ data, onClose, onConfirm }: FiscalReceiptModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Função para baixar os dados como PDF
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Adicionar título
      doc.setFontSize(16);
      doc.text('Dados do Cupom Fiscal', 105, 15, { align: 'center' });
      
      // Adicionar data e hora atual
      const now = new Date();
      doc.setFontSize(10);
      doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 195, 10, { align: 'right' });
      
      // Adicionar linha separadora
      doc.setLineWidth(0.5);
      doc.line(14, 20, 195, 20);
      
      // Adicionar dados do consumidor
      doc.setFontSize(12);
      doc.text('Dados do Consumidor', 14, 30);
      
      // Tabela com dados do consumidor
      doc.autoTable({
        startY: 35,
        head: [['Campo', 'Valor']],
        body: [
          ['Nome / Razão Social', data.consumer.name || 'Não informado'],
          ['CPF/CNPJ', data.consumer.documentNumber || 'Não informado'],
          ['UF', data.consumer.state || 'Não informado'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      // Adicionar dados do emitente
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(12);
      doc.text('Dados do Emitente', 14, finalY + 10);
      
      // Tabela com dados do emitente
      doc.autoTable({
        startY: finalY + 15,
        head: [['Campo', 'Valor']],
        body: [
          ['Nome / Razão Social', data.issuer.name || 'Não informado'],
          ['CNPJ', data.issuer.documentNumber || 'Não informado'],
          ['Endereço', data.issuer.address || 'Não informado'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      // Adicionar dados da nota fiscal
      const finalY2 = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(12);
      doc.text('Dados do Cupom Fiscal', 14, finalY2 + 10);
      
      // Tabela com dados da nota fiscal
      doc.autoTable({
        startY: finalY2 + 15,
        head: [['Campo', 'Valor']],
        body: [
          ['Chave de Acesso', data.receipt.accessKey || 'Não informado'],
          ['Valor Total', `R$ ${data.receipt.totalValue.toFixed(2).replace('.', ',')}` || 'R$ 0,00'],
          ['Data de Emissão', data.receipt.issueDate || 'Não informado'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      // Adicionar URL do QR Code
      const finalY3 = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(8);
      doc.text('URL QR Code:', 14, finalY3 + 10);
      doc.text(data.qrCodeUrl, 14, finalY3 + 15, { maxWidth: 180 });
      
      // Adicionar rodapé com marca d'água
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(10);
      doc.text('Contribuinte Legal - Documento gerado eletronicamente', 105, 285, { align: 'center' });
      
      // Salvar o PDF
      doc.save('cupom-fiscal.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  // Função para confirmar os dados e fechá-lo
  const handleConfirm = () => {
    setIsLoading(true);
    try {
      onConfirm(data);
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-75">
      <div className="relative w-full max-w-3xl p-6 mx-auto mt-10 mb-10 bg-white rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fechar"
        >
          <FaTimes size={20} />
        </button>

        <div className="mb-4 pb-4 border-b">
          <h2 className="text-2xl font-bold text-blue-700">Dados do Cupom Fiscal</h2>
          <p className="text-sm text-gray-500">Verifique os dados extraídos do QR Code</p>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          {/* Dados do consumidor */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Dados do Consumidor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome / Razão Social</p>
                <p className="font-medium">{data.consumer.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CPF/CNPJ</p>
                <p className="font-medium">{data.consumer.documentNumber || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">UF</p>
                <p className="font-medium">{data.consumer.state || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Dados do emitente */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Dados do Emitente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Nome / Razão Social</p>
                <p className="font-medium">{data.issuer.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="font-medium">{data.issuer.documentNumber || 'Não informado'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Endereço</p>
                <p className="font-medium">{data.issuer.address || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Dados da nota fiscal */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700 mb-3">Dados do Cupom Fiscal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Chave de Acesso</p>
                <p className="font-medium break-all">{data.receipt.accessKey || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="font-medium text-green-600">
                  R$ {data.receipt.totalValue.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Emissão</p>
                <p className="font-medium">{data.receipt.issueDate || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* URL do QR Code */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-500">URL do QR Code</p>
            <p className="text-xs overflow-x-auto whitespace-normal break-all">
              {data.qrCodeUrl}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 mt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <FaTimes size={14} />
            Cancelar
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="info"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <FaDownload size={14} />
              Download PDF
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirm}
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              <FaCheck size={14} />
              Confirmar e Usar Dados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 