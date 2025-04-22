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
 * Extrai o código QR de uma URL escaneada
 * @param qrCodeText Texto obtido da leitura do QR Code
 * @returns Dados estruturados do cupom fiscal ou null se não for possível processar
 */
export async function processFiscalReceiptQRCode(qrCodeText: string): Promise<FiscalReceiptData | null> {
  try {
    // Verificar se o texto contém uma URL válida do portal da SEFAZ-MG
    if (!qrCodeText.includes('portalsped.fazenda.mg.gov.br') && 
        !qrCodeText.includes('fazenda.mg.gov.br')) {
      console.error('QR Code não é de um cupom fiscal de Minas Gerais');
      return null;
    }

    // Usar a URL para obter o HTML da página do cupom fiscal
    const response = await fetch(qrCodeText);
    if (!response.ok) {
      throw new Error(`Falha ao obter dados do cupom fiscal: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extrair os dados do consumidor
    const consumerName = $('div:contains("CONSUMIDOR")').next().find('div:contains("Nome / Razão Social:")').text().replace('Nome / Razão Social:', '').trim() || 'CONSUMIDOR NÃO IDENTIFICADO';
    const consumerDocument = $('div:contains("CONSUMIDOR")').next().find('div:contains("CNPJ/CPF:")').text().replace('CNPJ/CPF:', '').trim() || 'NÃO INFORMADO';
    const consumerState = $('div:contains("CONSUMIDOR")').next().find('div:contains("UF:")').text().replace('UF:', '').trim() || 'MG';

    // Extrair os dados do emitente
    const issuerName = $('div:contains("EMITENTE")').next().find('div:contains("Nome / Razão Social:")').text().replace('Nome / Razão Social:', '').trim();
    const issuerDocument = $('div:contains("EMITENTE")').next().find('div:contains("CNPJ:")').text().replace('CNPJ:', '').trim();
    const issuerAddress = $('div:contains("EMITENTE")').next().find('div:contains("Endereço:")').text().replace('Endereço:', '').trim();

    // Extrair a chave de acesso
    const accessKey = $('div:contains("CHAVE DE ACESSO")').next().text().trim();

    // Extrair o valor total
    const totalValueText = $('div:contains("VALOR TOTAL R$")').next().text().trim();
    const totalValue = parseFloat(totalValueText.replace(/\./g, '').replace(',', '.')) || 0;

    // Extrair a data de emissão
    const issueDateElement = $('div:contains("DATA DE EMISSÃO")').next();
    const issueDate = issueDateElement.length ? issueDateElement.text().trim() : '';

    // Estruturar os dados do cupom fiscal
    const fiscalReceiptData: FiscalReceiptData = {
      consumer: {
        name: consumerName,
        documentNumber: consumerDocument,
        state: consumerState
      },
      issuer: {
        name: issuerName,
        documentNumber: issuerDocument,
        address: issuerAddress
      },
      receipt: {
        accessKey,
        totalValue,
        issueDate
      },
      qrCodeUrl: qrCodeText
    };

    return fiscalReceiptData;
  } catch (error) {
    console.error('Erro ao processar QR Code do cupom fiscal:', error);
    return null;
  }
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