'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FaFileInvoice, FaCalendarAlt, FaMoneyBillWave, FaUpload, FaQrcode, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import useDeviceDetect from '@/hooks/useDeviceDetect';
import { processFiscalReceiptQRCode, FiscalReceiptData } from '@/lib/services/fiscalReceiptService';

// Carregar o FiscalReceiptModal dinamicamente
const FiscalReceiptModal = dynamic(() => import('@/components/FiscalReceiptModal'), {
  ssr: false,
  loading: () => <p className="text-center py-4">Carregando...</p>
});

// Extender a interface Window para incluir nossa propriedade
declare global {
  interface Window {
    qrErrorShown?: boolean;
  }
}

// Importar o scanner de QR code dinamicamente (apenas no cliente)
const QrCodeScanner = dynamic(() => import('@/components/QrCodeScanner'), {
  ssr: false, // Não renderizar no servidor
  loading: () => <p className="text-center py-4">Carregando scanner...</p>
});

type TipoDocumento = 'nota_servico' | 'cupom_fiscal' | 'imposto';

export default function CadastrarDocumento() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const { isMobile } = useDeviceDetect();
  const [formData, setFormData] = useState({
    tipo: 'cupom_fiscal' as TipoDocumento,
    numero_documento: '',
    data_emissao: '',
    valor: '',
    arquivo: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessingQRCode, setIsProcessingQRCode] = useState(false);
  const [fiscalReceiptData, setFiscalReceiptData] = useState<FiscalReceiptData | null>(null);
  const [showFiscalReceiptModal, setShowFiscalReceiptModal] = useState(false);

  const tiposDocumento = [
    { value: 'nota_servico', label: 'Nota Fiscal de Serviço' },
    { value: 'cupom_fiscal', label: 'Cupom Fiscal' },
    { value: 'imposto', label: 'Comprovante de Pagamento de Imposto' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Log especial para o campo tipo
    if (name === 'tipo') {
      console.log('Tipo de documento alterado para:', value);
    }
    
    // Tratamento especial para o campo valor
    if (name === 'valor') {
      // Remove tudo que não for número ou vírgula
      let numericValue = value.replace(/[^\d,]/g, '');
      
      // Garante apenas uma vírgula
      const parts = numericValue.split(',');
      let formattedValue = parts[0];
      
      // Adiciona parte decimal limitada a 2 casas
      if (parts.length > 1) {
        formattedValue += ',' + parts[1].slice(0, 2);
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Função para formatar o valor como moeda BRL quando o campo perde o foco
  const handleValorBlur = () => {
    if (formData.valor) {
      try {
        // Converte para número (substituindo vírgula por ponto)
        const valorTexto = formData.valor.replace(/\./g, '').replace(',', '.');
        const numeroValor = parseFloat(valorTexto);
        
        if (!isNaN(numeroValor)) {
          // Formata como valor monetário brasileiro (duas casas decimais)
          const valorFormatado = numeroValor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          setFormData(prev => ({ ...prev, valor: valorFormatado }));
        }
      } catch (error) {
        console.error('Erro ao formatar valor:', error);
        // Em caso de erro, deixa o valor como está
      }
    } else {
      // Se o campo estiver vazio, preenche com 0,00
      setFormData(prev => ({ ...prev, valor: '0,00' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, arquivo: file }));
    
    if (errors.arquivo) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.arquivo;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.numero_documento) {
      newErrors.numero_documento = 'Número do documento é obrigatório';
    }
    
    if (!formData.data_emissao) {
      newErrors.data_emissao = 'Data de emissão é obrigatória';
    }
    
    if (!formData.valor) {
      newErrors.valor = 'Valor é obrigatório';
    } else {
      try {
        // Converte valores com formato brasileiro (vírgula como separador decimal)
        const valorTexto = formData.valor.replace(/\./g, '').replace(',', '.');
        const valorNumerico = parseFloat(valorTexto);
        
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
          newErrors.valor = 'Valor deve ser um número positivo';
        }
      } catch (error) {
        newErrors.valor = 'Valor deve ser um número positivo';
      }
    }
    
    if (!formData.arquivo) {
      newErrors.arquivo = 'Arquivo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScanQR = async () => {
    try {
      // Mostrar o scanner antes de verificar permissões
      // Isso evita problemas em alguns navegadores que só verificam permissões
      // quando o componente de scanner já está visível
      setShowScanner(true);
      
      // A verificação será feita pelo componente QrCodeScanner
      // que já possui tratamento adequado para diferentes navegadores
      setCameraPermission(true);
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setCameraPermission(false);
      setShowScanner(false);
      toast.error('Não foi possível iniciar o scanner. Tente novamente ou use outro dispositivo.');
    }
  };

  const handleQrCodeResult = async (result: string) => {
    // Fechar o scanner
    setShowScanner(false);
    
    console.log('QR Code lido:', result);
    
    // Processamento baseado no tipo de QR code
    let qrCodeContent = result.trim();
    
    // Verificar se é um link (URL)
    if (qrCodeContent.startsWith('http://') || qrCodeContent.startsWith('https://')) {
      console.log('QR Code é uma URL válida, abrindo no navegador:', qrCodeContent);
      
      // Extrair a chave de acesso para preencher o número do documento
      try {
        const { extractAccessKeyFromQRCode } = await import('@/lib/services/fiscalReceiptService');
        const accessKey = extractAccessKeyFromQRCode(qrCodeContent);
        
        if (accessKey) {
          setFormData(prev => ({
            ...prev,
            numero_documento: accessKey
          }));
          
          toast.success('Chave de acesso extraída com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao extrair chave de acesso:', error);
      }
      
      // Abrir o link em uma nova aba
      window.open(qrCodeContent, '_blank');
      toast.success('Link do QR Code aberto em uma nova aba. Por favor, copie os dados de lá.');
      
      return;
    }
    
    // Se não for uma URL, é provavelmente uma chave de acesso direta
    if (/^\d{44}$/.test(qrCodeContent)) {
      console.log('QR Code parece ser uma chave de acesso direta:', qrCodeContent);
      
      setFormData(prev => ({
        ...prev,
        numero_documento: qrCodeContent
      }));
      
      toast.success('Chave de acesso lida com sucesso!');
      return;
    }
    
    // Processamento legado para outros formatos
    setIsProcessingQRCode(true);
    toast.loading('Processando QR Code...');
    
    try {
      // Se o tipo de documento selecionado for 'cupom_fiscal', tentar extrair a chave de acesso diretamente
      if (formData.tipo === 'cupom_fiscal') {
        const { extractAccessKeyFromQRCode } = await import('@/lib/services/fiscalReceiptService');
        console.log('Extraindo chave de acesso diretamente...');
        
        const accessKey = extractAccessKeyFromQRCode(qrCodeContent);
        console.log('Chave de acesso extraída:', accessKey);
        
        if (accessKey) {
          // Preencher o número do documento com a chave de acesso extraída
          setFormData(prev => ({
            ...prev,
            numero_documento: accessKey
          }));
          
          toast.dismiss();
          toast.success('Chave de acesso extraída com sucesso!');
        }
      }
      
      // Usar como texto direto se nada mais funcionar
      if (!formData.numero_documento) {
        setFormData(prev => ({ 
          ...prev, 
          numero_documento: qrCodeContent.substring(0, 100) // Limitar o tamanho
        }));
      }
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      toast.dismiss();
      toast.error('Erro ao processar o QR code');
      
      // Mesmo com erro, tentar usar o texto do QR code como número do documento
      if (!formData.numero_documento) {
        setFormData(prev => ({ 
          ...prev, 
          numero_documento: qrCodeContent.substring(0, 100) // Limitar o tamanho
        }));
      }
    } finally {
      setIsProcessingQRCode(false);
      toast.dismiss();
    }
  };

  const handleQrCodeError = (error: any) => {
    console.error('Erro na leitura do QR code:', error);
    
    // Mensagens mais específicas baseadas no tipo de erro
    let errorMessage = 'Erro ao ler o QR code. Tente novamente.';
    
    if (typeof error === 'string') {
      if (error === 'Secure context required') {
        errorMessage = 'Para acessar a câmera, o site deve estar em HTTPS. Tente acessar via HTTPS ou use a entrada manual.';
      } else if (error.includes('Camera access denied')) {
        errorMessage = 'Acesso à câmera negado. Por favor, permita o acesso nas configurações do navegador.';
      } else if (error.includes('No cameras detected')) {
        errorMessage = 'Nenhuma câmera disponível no seu dispositivo.';
      } else if (error.includes('Failed to initialize scanner')) {
        errorMessage = 'Falha ao inicializar o scanner. Tente recarregar a página.';
      } else if (error.includes('Falha ao acessar as câmeras')) {
        errorMessage = 'Falha ao acessar as câmeras. Verifique as permissões.';
      } else if (error.includes('secure context')) {
        errorMessage = 'Acesso à câmera requer HTTPS. Tente acessar o site pelo protocolo HTTPS ou use a entrada manual.';
      }
    }
    
    // Não fechar o scanner automaticamente em caso de erro, pois o próprio componente
    // mostrará um botão "Tentar novamente" para o usuário
    
    // Evitar mostrar o mesmo erro repetidamente em um curto período
    if (!window.qrErrorShown) {
      window.qrErrorShown = true;
      toast.error(errorMessage);
      
      // Limpar a flag após um tempo
      setTimeout(() => {
        window.qrErrorShown = false;
      }, 5000);
    }
  };

  const handleConfirmFiscalReceipt = (data: FiscalReceiptData) => {
    console.log('Aplicando dados do cupom fiscal ao formulário:', data);
    // Processar a data de emissão para o formato esperado pelo input (YYYY-MM-DD)
    let formattedDate = '';
    
    if (data.receipt.issueDate) {
      try {
        // Tentar detectar o formato da data (pode vir em diferentes formatos dependendo da SEFAZ)
        const dateStr = data.receipt.issueDate.trim();
        console.log('Data original:', dateStr);
        
        // Formatos comuns: DD/MM/YYYY, DD/MM/YY, YYYY-MM-DD, etc.
        if (dateStr.includes('/')) {
          // Formato DD/MM/YYYY ou DD/MM/YY
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let year = parts[2];
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            
            // Se o ano tem 2 dígitos, assumir que é 20XX (para datas recentes)
            if (year.length === 2) {
              year = `20${year}`;
            }
            
            formattedDate = `${year}-${month}-${day}`;
            console.log('Data formatada (DD/MM/YYYY):', formattedDate);
          }
        } else if (dateStr.includes('-')) {
          // Formato YYYY-MM-DD (já está no formato esperado)
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            // Verificar se está realmente no formato YYYY-MM-DD
            const year = parts[0];
            if (year.length === 4) {
              formattedDate = dateStr;
              console.log('Data já está no formato correto (YYYY-MM-DD)');
            } else {
              // Pode estar no formato DD-MM-YYYY
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const correctedYear = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              formattedDate = `${correctedYear}-${month}-${day}`;
              console.log('Data formatada (DD-MM-YYYY):', formattedDate);
            }
          }
        } else {
          // Tentar parsear a data usando o objeto Date
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
            console.log('Data formatada (usando objeto Date):', formattedDate);
          } else {
            console.warn('Não foi possível processar a data:', dateStr);
          }
        }
      } catch (error) {
        console.error('Erro ao processar data de emissão:', error);
      }
    }
    
    // Formatar o valor total para o formato brasileiro (com vírgula como separador decimal)
    let formattedValue = '';
    if (typeof data.receipt.totalValue === 'number' && !isNaN(data.receipt.totalValue)) {
      formattedValue = data.receipt.totalValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      console.log('Valor formatado:', formattedValue);
    }
    
    // Preencher o formulário com os dados extraídos do cupom fiscal
    setFormData(prev => ({
      ...prev,
      numero_documento: data.receipt.accessKey || prev.numero_documento,
      valor: formattedValue || prev.valor,
      data_emissao: formattedDate || prev.data_emissao
    }));
    
    // Fechar o modal de dados fiscais
    setShowFiscalReceiptModal(false);
    
    toast.success('Dados do cupom fiscal aplicados ao formulário');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado para cadastrar documentos');
      }
      
      const userId = session.user.id;
      
      // Verificar tamanho do arquivo
      if (formData.arquivo && formData.arquivo.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo não pode ser maior que 5MB');
      }
      
      // Verificar tipo do arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (formData.arquivo && !allowedTypes.includes(formData.arquivo.type)) {
        throw new Error('Tipo de arquivo não permitido. Use apenas PDF, JPG ou PNG');
      }
      
      // Gerar nome único para o arquivo
      const fileExt = formData.arquivo!.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt)) {
        throw new Error('Extensão de arquivo inválida');
      }
      
      const fileName = `${userId}/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      
      console.log('Iniciando upload do arquivo...', {
        fileName,
        fileSize: formData.arquivo!.size,
        fileType: formData.arquivo!.type
      });
      
      // Fazer upload do arquivo para o Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from('documentos')
        .upload(fileName, formData.arquivo!, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Erro detalhado no upload:', uploadError);
        throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
      }
      
      if (!uploadData?.path) {
        throw new Error('Erro ao obter o caminho do arquivo após upload');
      }
      
      console.log('Arquivo enviado com sucesso:', uploadData);
      
      // Gerar número aleatório para sorteio (entre 000000000 e 999999999)
      const numeroSorteio = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      
      console.log('Criando registro do documento...');
      console.log('Tipo de documento selecionado:', formData.tipo);
      
      // Formatar o valor para garantir 2 casas decimais (convertendo vírgula para ponto)
      const valorTexto = formData.valor.replace(/\./g, '').replace(',', '.');
      const valorNumerico = parseFloat(valorTexto);
      const valorFormatado = parseFloat(valorNumerico.toFixed(2));
      
      // Preparar os dados a serem inseridos usando any para contornar os erros de tipo
      const documentoData: any = {
        usuario_id: userId,
        tipo: formData.tipo,
        numero_documento: formData.numero_documento,
        data_emissao: formData.data_emissao,
        valor: valorFormatado,
        arquivo_url: uploadData.path,
        numero_sorteio: numeroSorteio,
        status: 'AGUARDANDO VALIDAÇÃO'
      };
      
      // Armazenar dados adicionais do cupom fiscal em campos de texto, se disponíveis
      if (fiscalReceiptData) {
        // Se tivermos os dados do cupom fiscal, podemos armazená-los no campo observacoes 
        // ou atributos_adicionais se existirem, ou criar uma tabela separada futuramente
        console.log('Dados do cupom fiscal capturados:', fiscalReceiptData);
      }
      
      console.log('Dados a serem inseridos:', documentoData);
      
      // Criar registro do documento no banco de dados
      const { error: insertError, data: documentoInserido } = await supabase
        .from('documentos')
        .insert(documentoData)
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Erro ao inserir documento:', insertError);
        
        // Se houver erro na inserção, tentar remover o arquivo
        console.log('Removendo arquivo após erro na inserção...');
        const { error: removeError } = await supabase
          .storage
          .from('documentos')
          .remove([uploadData.path]);
          
        if (removeError) {
          console.error('Erro ao remover arquivo:', removeError);
        }
        
        throw new Error(`Erro ao cadastrar documento: ${insertError.message}`);
      }
      
      console.log('Documento cadastrado com sucesso!');
      toast.success(`Documento cadastrado com sucesso!`);
      router.push('/meus-documentos');
      
    } catch (error: any) {
      console.error('Erro completo ao cadastrar documento:', error);
      toast.error(error.message || 'Ocorreu um erro ao cadastrar o documento');
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = () => {
    // Implemente a lógica para alternar entre câmeras
    console.log('Alternando câmera');
  };

  return (
    <Layout isAuthenticated>
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="max-w-2xl w-full p-6 shadow-xl" variant="blue-gradient">
          <div className="flex flex-col items-center mb-8">
            <Image 
              src="/LOGO_CL_trans.png" 
              alt="Contribuinte Legal" 
              width={180} 
              height={70} 
              className="mb-6" 
              priority
              style={{ objectFit: 'contain' }}
            />
            <h1 className="text-3xl font-bold text-center text-white">Cadastrar Novo Documento</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="tipo" className="block mb-2 text-sm font-medium text-white">
                  Tipo de Documento
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 border border-blue-400/30 bg-blue-900/20 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {tiposDocumento.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <Input
                  label="Número do Documento"
                  name="numero_documento"
                  placeholder="Número da nota ou comprovante"
                  icon={FaFileInvoice}
                  value={formData.numero_documento}
                  onChange={handleChange}
                  error={errors.numero_documento}
                  fullWidth
                  required
                  variant="dark"
                />
              </div>
              
              <Input
                label="Data de Emissão"
                name="data_emissao"
                type="date"
                icon={FaCalendarAlt}
                value={formData.data_emissao}
                onChange={handleChange}
                error={errors.data_emissao}
                fullWidth
                required
                variant="dark"
              />
              
              <div className="relative">
                <label htmlFor="valor" className="block mb-2 text-sm font-medium text-white">
                  Valor (R$)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMoneyBillWave className="text-blue-300" />
                  </div>
                  <input
                    type="text"
                    name="valor"
                    id="valor"
                    className={`pl-10 block w-full border rounded-md py-2 px-3 bg-blue-900/20 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.valor ? 'border-red-500' : 'border-blue-400/30'
                    }`}
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={handleChange}
                    onBlur={handleValorBlur}
                    required
                  />
                </div>
                {errors.valor && (
                  <p className="mt-1 text-sm text-red-400">{errors.valor}</p>
                )}
                <p className="mt-1 text-xs text-blue-200">
                  Digite o valor no formato: 1234,56 (use vírgula como separador decimal)
                </p>
              </div>
              
              <div>
                <label htmlFor="arquivo" className="block mb-2 text-sm font-medium text-white">
                  Arquivo do Documento
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-2 border-dashed border-blue-400/30 bg-blue-900/10 rounded-lg cursor-pointer hover:bg-blue-800/20 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <FaUpload className="w-8 h-8 text-blue-300" />
                      <p className="pt-1 text-sm text-blue-200">
                        {formData.arquivo 
                          ? formData.arquivo.name 
                          : 'Clique para selecionar ou arraste o arquivo aqui'}
                      </p>
                    </div>
                    <input 
                      id="arquivo" 
                      name="arquivo" 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {errors.arquivo && (
                  <p className="mt-2 text-sm text-red-400">{errors.arquivo}</p>
                )}
                <p className="mt-1 text-xs text-blue-200">
                  Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 5MB)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-8 flex-nowrap w-full">
              <Button
                type="button"
                variant="info"
                onClick={handleScanQR}
                disabled={showScanner || isProcessingQRCode}
                className="w-10 h-10 min-w-[2.5rem] flex items-center justify-center rounded-full flex-shrink-0"
                aria-label="Escanear código QR"
                style={{ marginRight: '0.5rem' }}
                isLoading={isProcessingQRCode}
              >
                <FaQrcode size={18} />
              </Button>
              <div className="flex gap-2 md:gap-4 justify-end ml-auto">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => router.push('/meus-documentos')}
                  className="text-xs md:text-base"
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={isLoading}
                  className="py-3 text-xs md:text-base font-medium shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                  animated
                >
                  Cadastrar
                </Button>
              </div>
            </div>
          </form>
          
          {showScanner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-80 p-2">
              <div className="bg-white p-4 rounded-lg shadow-xl max-w-xl w-full mx-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">Escanear Cupom Fiscal</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowScanner(false);
                      setCameraPermission(false);
                    }}
                    className="text-sm p-2"
                    aria-label="Fechar"
                  >
                    ✕
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Posicione o QR Code no centro do quadrado pontilhado e mantenha-o a uma distância adequada.
                </p>
                
                <div className="border-2 border-blue-500 rounded-lg overflow-hidden mb-3" id="scanner-container">
                  <QrCodeScanner 
                    onSubmit={handleQrCodeResult}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Dica:</strong> Certifique-se de que o QR Code esteja bem iluminado e a câmera esteja focada.
                  </div>
                  
                  <Button
                    type="button"
                    variant="info"
                    onClick={switchCamera}
                    className="text-xs md:text-sm flex items-center gap-1"
                  >
                    <FaSync size={12} />
                    Alternar câmera
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {showFiscalReceiptModal && fiscalReceiptData && (
            <FiscalReceiptModal
              data={fiscalReceiptData}
              onClose={() => setShowFiscalReceiptModal(false)}
              onConfirm={handleConfirmFiscalReceipt}
            />
          )}
        </Card>
      </div>
    </Layout>
  );
} 