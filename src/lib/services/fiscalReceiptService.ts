// Serviço para processar QR Codes de cupons fiscais
import { load } from 'cheerio';

// Interface para os dados do cupom fiscal
export interface FiscalReceiptData {
  // Dados do consumidor
  consumer: {
    name: string;
    documentNumber: string;
    state: string;
  };
  // Dados do emitente
  issuer: {
    name: string;
    documentNumber: string;
    address?: string;
  };
  // Dados da nota fiscal
  receipt: {
    accessKey: string;
    totalValue: number;
    issueDate?: string;
    serviceValue?: number; // Valor total do serviço
    items?: Array<{
      name: string;
      quantity: number;
      unitValue: number;
      totalValue: number;
    }>;
  };
  // Contém o URL original do QR Code
  qrCodeUrl: string;
}

/**
 * Extrai a chave de acesso de 44 dígitos do QR Code
 * @param qrCodeText URL do QR Code
 * @returns Chave de acesso extraída ou string vazia se não encontrada
 * @example
 * // Exemplo de uso:
 * const accessKey = extractAccessKeyFromQRCode('https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31250456126730000198650010000080061241229020|2|1|1|683921517D4F53911A64D25DDD747718C32A5400');
 * // Retorna: 31250456126730000198650010000080061241229020
 */
export function extractAccessKeyFromQRCode(qrCodeText: string): string {
  try {
    console.log('Tentando extrair chave de acesso do QR Code:', qrCodeText);
    
    // Verificar se é uma URL que contém o parâmetro p=
    if (qrCodeText.includes('?p=') || qrCodeText.includes('&p=')) {
      console.log('QR Code contém parâmetro p=');
      // Exemplo: https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=31250456126730000198650010000080061241229020|2|1|1|683921517D4F53911A64D25DDD747718C32A5400
      // Precisamos extrair os 44 dígitos numéricos após "p="
      
      // Extrair o valor completo do parâmetro p usando regex
      const urlKeyRegex = /[?&]p=([^&]+)/;
      const urlKeyMatch = qrCodeText.match(urlKeyRegex);
      
      if (urlKeyMatch && urlKeyMatch[1]) {
        const paramValue = urlKeyMatch[1];
        console.log('Valor do parâmetro p=', paramValue);
        
        // Na maioria dos casos, a chave de acesso é a primeira parte antes do pipe
        const parts = paramValue.split('|');
        const firstPart = parts[0];
        console.log('Primeira parte antes do pipe:', firstPart);
        
        // Extrair apenas dígitos do primeiro segmento
        const numericValue = firstPart.replace(/[^0-9]/g, '');
        console.log('Valor numérico extraído:', numericValue, 'comprimento:', numericValue.length);
        
        // Se temos exatamente 44 dígitos, é provavelmente a chave de acesso
        if (numericValue.length === 44) {
          console.log('Chave de acesso de 44 dígitos extraída com sucesso:', numericValue);
          return numericValue;
        } 
        // Se tivermos mais de 44 dígitos, pegamos os primeiros 44
        else if (numericValue.length > 44) {
          const accessKey = numericValue.substring(0, 44);
          console.log('Extraídos primeiros 44 dígitos da chave:', accessKey);
          return accessKey;
        }
        // Se tivermos menos de 44 dígitos, pode estar em um formato diferente
        else {
          console.warn('Valor extraído não tem 44 dígitos:', numericValue);
          
          // Tentar extrair todos os dígitos do parâmetro completo
          const allDigits = paramValue.replace(/[^0-9]/g, '');
          console.log('Todos os dígitos do parâmetro:', allDigits, 'comprimento:', allDigits.length);
          
          if (allDigits.length >= 44) {
            const accessKey = allDigits.substring(0, 44);
            console.log('Extraídos 44 dígitos do valor completo:', accessKey);
            return accessKey;
          }
          
          // Se ainda não conseguimos 44 dígitos, vamos tentar usar o texto completo do QR code
          const allQrDigits = qrCodeText.replace(/[^0-9]/g, '');
          console.log('Todos os dígitos do QR code completo:', allQrDigits.length);
          
          if (allQrDigits.length >= 44) {
            const accessKey = allQrDigits.substring(0, 44);
            console.log('Extraídos 44 dígitos do QR code completo:', accessKey);
            return accessKey;
          }
        }
      } else {
        console.log('Não foi possível extrair o valor do parâmetro p= usando regex');
      }
    } else if (qrCodeText.length >= 44 && /^\d+$/.test(qrCodeText.substring(0, 44))) {
      // Caso o QR code já seja a própria chave numérica
      console.log('QR code parece ser a própria chave numérica');
      return qrCodeText.substring(0, 44);
    } else {
      // Tenta encontrar 44 dígitos consecutivos em qualquer parte do texto
      console.log('Tentando encontrar 44 dígitos consecutivos em qualquer parte do texto');
      const digitGroups = qrCodeText.match(/\d{44,}/g);
      if (digitGroups && digitGroups.length > 0) {
        console.log('Encontrado grupo de 44+ dígitos:', digitGroups[0]);
        return digitGroups[0].substring(0, 44);
      }
      
      // Última tentativa: extrair todos os dígitos e pegar os primeiros 44 (se houver)
      const allDigits = qrCodeText.replace(/[^0-9]/g, '');
      console.log('Todos os dígitos encontrados:', allDigits.length);
      if (allDigits.length >= 44) {
        return allDigits.substring(0, 44);
      }
    }
    
    console.log('Não foi possível extrair a chave de acesso do QR Code');
    return '';
  } catch (error) {
    console.error('Erro ao extrair chave de acesso do QR Code:', error);
    return '';
  }
}

/**
 * Extrai o código QR de uma URL escaneada
 * @param qrCodeText Texto obtido da leitura do QR Code
 * @returns Dados estruturados do cupom fiscal ou null se não for possível processar
 */
export async function processFiscalReceiptQRCode(qrCodeText: string): Promise<FiscalReceiptData | null> {
  try {
    console.log('Processando QR Code:', qrCodeText);
    
    // Extrair a chave de acesso do QR Code
    const accessKeyFromUrl = extractAccessKeyFromQRCode(qrCodeText);
    console.log('Chave de acesso extraída:', accessKeyFromUrl);
    
    // Identificar se é uma URL ou chave direta
    const isUrl = qrCodeText.startsWith('http');
    
    // Processar dados apenas a partir da URL, sem fetch
    if (isUrl) {
      console.log('Processando dados da URL sem fazer fetch');
      
      // Verificar se o texto contém uma URL válida do portal da SEFAZ
      const isSefaz = qrCodeText.includes('portalsped.fazenda') || 
                     qrCodeText.includes('fazenda.mg.gov.br') || 
                     qrCodeText.includes('fazenda.gov.br') || 
                     qrCodeText.includes('sefaz') || 
                     qrCodeText.includes('nfce');
      
      if (!isSefaz) {
        console.warn('URL não parece ser de um portal da SEFAZ:', qrCodeText);
      }
      
      // Tentar extrair a data da emissão e valor da URL, se presentes
      let issueDate = extractDateFromUrl(qrCodeText);
      let totalValue = extractValueFromUrl(qrCodeText);
      
      // Retornar estrutura básica com os dados extraídos
      return {
        consumer: {
          name: 'CONSUMIDOR NÃO IDENTIFICADO',
          documentNumber: 'NÃO INFORMADO',
          state: 'MG'
        },
        issuer: {
          name: 'ESTABELECIMENTO COMERCIAL',
          documentNumber: 'NÃO INFORMADO'
        },
        receipt: {
          accessKey: accessKeyFromUrl || 'NÃO IDENTIFICADO',
          totalValue: totalValue || 0,
          issueDate: issueDate || formatCurrentDate()
        },
        qrCodeUrl: qrCodeText
      };
    } else {
      // Se não é URL, deve ser a própria chave de acesso
      console.log('QR Code não é uma URL. Tratando como chave de acesso direta.');
      
      // Extrair apenas números e caracteres do QR code (caso seja uma chave de acesso)
      const keyPattern = qrCodeText.replace(/[^A-Za-z0-9]/g, '');
      
      if (keyPattern.length >= 30) {
        console.log('Detectada possível chave de acesso:', keyPattern);
        // Usar a chave extraída ou a que foi processada diretamente
        const finalKey = accessKeyFromUrl || keyPattern;
        
        // Retornamos dados básicos com a chave de acesso
        return {
          consumer: {
            name: 'CONSUMIDOR NÃO IDENTIFICADO',
            documentNumber: 'NÃO INFORMADO',
            state: 'MG'
          },
          issuer: {
            name: 'ESTABELECIMENTO COMERCIAL',
            documentNumber: 'NÃO INFORMADO'
          },
          receipt: {
            accessKey: finalKey,
            totalValue: 0,
            issueDate: formatCurrentDate()
          },
          qrCodeUrl: qrCodeText
        };
      } else {
        console.error('QR Code não é uma URL válida nem uma chave de acesso');
        return null;
      }
    }
  } catch (error) {
    console.error('Erro ao processar QR code:', error);
    
    // Em caso de erro, tenta retornar pelo menos a chave de acesso
    const accessKey = extractAccessKeyFromQRCode(qrCodeText);
    if (accessKey) {
      return {
        consumer: {
          name: 'CONSUMIDOR NÃO IDENTIFICADO',
          documentNumber: 'NÃO INFORMADO',
          state: 'MG'
        },
        issuer: {
          name: 'ESTABELECIMENTO COMERCIAL',
          documentNumber: 'NÃO INFORMADO'
        },
        receipt: {
          accessKey: accessKey,
          totalValue: 0,
          issueDate: formatCurrentDate()
        },
        qrCodeUrl: qrCodeText
      };
    }
    
    return null;
  }
}

/**
 * Tenta extrair uma data de uma URL
 * @param url URL que pode conter parâmetros de data
 * @returns Data no formato YYYY-MM-DD ou vazio
 */
function extractDateFromUrl(url: string): string {
  try {
    // Procurar por padrões de data em parâmetros
    // Ex: dEmi=20240401 ou data=01/04/2024 ou dhEmi=20240401T120000
    const dateParams = ['dEmi', 'data', 'dhEmi', 'date', 'dt'];
    
    // Verificar cada parâmetro possível
    for (const param of dateParams) {
      const regex = new RegExp(`[?&]${param}=([^&]*)`, 'i');
      const match = url.match(regex);
      
      if (match && match[1]) {
        const dateValue = match[1];
        
        // Formato YYYYMMDD
        if (/^\d{8}/.test(dateValue)) {
          const year = dateValue.substring(0, 4);
          const month = dateValue.substring(4, 6);
          const day = dateValue.substring(6, 8);
          return `${year}-${month}-${day}`;
        }
        
        // Formato DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateValue)) {
          const parts = dateValue.split('/');
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    
    // Se não encontrou nenhuma data, retorna vazio
    return '';
  } catch (error) {
    console.error('Erro ao extrair data da URL:', error);
    return '';
  }
}

/**
 * Tenta extrair um valor monetário de uma URL
 * @param url URL que pode conter parâmetros de valor
 * @returns Valor numérico ou zero
 */
function extractValueFromUrl(url: string): number {
  try {
    // Procurar por padrões de valor em parâmetros
    // Ex: vNF=100.00 ou valor=100,00 ou vProd=100
    const valueParams = ['vNF', 'valor', 'vProd', 'vServ', 'value', 'val'];
    
    // Verificar cada parâmetro possível
    for (const param of valueParams) {
      const regex = new RegExp(`[?&]${param}=([^&]*)`, 'i');
      const match = url.match(regex);
      
      if (match && match[1]) {
        const valueString = match[1];
        
        // Converter para número (tratando tanto ponto quanto vírgula)
        const numericValue = valueString.replace(',', '.');
        const value = parseFloat(numericValue);
        
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    
    // Se não encontrou nenhum valor, retorna zero
    return 0;
  } catch (error) {
    console.error('Erro ao extrair valor da URL:', error);
    return 0;
  }
}

/**
 * Retorna a data atual formatada como YYYY-MM-DD
 */
function formatCurrentDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata os dados do cupom fiscal para exibição
 * @param data Dados do cupom fiscal
 * @returns Texto formatado com os dados principais do cupom fiscal
 */
export function formatFiscalReceiptData(data: FiscalReceiptData): string {
  if (!data) return 'Dados do cupom fiscal não disponíveis';

  return `
DADOS DO CUPOM FISCAL:
---------------------
CONSUMIDOR: ${data.consumer.name}
CPF/CNPJ: ${data.consumer.documentNumber}
UF: ${data.consumer.state}

EMITENTE: ${data.issuer.name}
CNPJ: ${data.issuer.documentNumber}
${data.issuer.address ? `ENDEREÇO: ${data.issuer.address}` : ''}

CHAVE DE ACESSO: ${data.receipt.accessKey}
VALOR TOTAL: R$ ${data.receipt.totalValue.toFixed(2).replace('.', ',')}
${data.receipt.issueDate ? `DATA DE EMISSÃO: ${data.receipt.issueDate}` : ''}
`.trim();
} 