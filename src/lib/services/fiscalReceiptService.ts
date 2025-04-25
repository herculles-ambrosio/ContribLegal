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
    
    // Verificar se o texto contém uma URL válida
    let qrUrl = qrCodeText;
    
    // Extrair a chave de acesso do QR Code (primeiros 44 dígitos após p=)
    const accessKeyFromUrl = extractAccessKeyFromQRCode(qrCodeText);
    
    // Se o texto não parece ser uma URL, tentamos tratar como uma chave de acesso
    if (!qrCodeText.startsWith('http')) {
      console.log('QR Code não é uma URL. Tentando tratar como chave de acesso...');
      
      // Extrair apenas números e caracteres do QR code (caso seja uma chave de acesso)
      const keyPattern = qrCodeText.replace(/[^A-Za-z0-9]/g, '');
      
      if (keyPattern.length >= 30) {
        console.log('Detectada possível chave de acesso:', keyPattern);
        // Retornamos dados básicos com a chave de acesso
        return {
          consumer: {
            name: 'CONSUMIDOR NÃO IDENTIFICADO',
            documentNumber: 'NÃO INFORMADO',
            state: 'MG'
          },
          issuer: {
            name: 'NÃO IDENTIFICADO',
            documentNumber: 'NÃO INFORMADO'
          },
          receipt: {
            accessKey: keyPattern,
            totalValue: 0,
          },
          qrCodeUrl: qrCodeText
        };
      } else {
        console.error('QR Code não é uma URL válida nem uma chave de acesso');
        return null;
      }
    }
    
    // Verificar se o texto contém uma URL válida do portal da SEFAZ
    const isSefaz = qrCodeText.includes('portalsped.fazenda') || 
                   qrCodeText.includes('fazenda.mg.gov.br') ||
                   qrCodeText.includes('fazenda.gov.br') ||
                   qrCodeText.includes('sefaz') ||
                   qrCodeText.includes('nfce');
    
    if (!isSefaz) {
      console.warn('URL não parece ser de um portal da SEFAZ:', qrCodeText);
      // Ainda tentaremos processar, mas com baixa expectativa
    }

    console.log('Buscando página do cupom fiscal...');
    
    // Configurar timeout mais curto para evitar espera longa
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    try {
      // Usar a URL para obter o HTML da página do cupom fiscal
      const response = await fetch(qrCodeText, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Falha ao obter dados do cupom fiscal. Status: ${response.status}`);
        
        // Se temos a chave de acesso da URL, ainda podemos retornar um objeto mínimo
        if (accessKeyFromUrl) {
          return {
            consumer: {
              name: 'CONSUMIDOR NÃO IDENTIFICADO',
              documentNumber: 'NÃO INFORMADO',
              state: 'MG'
            },
            issuer: {
              name: 'ESTABELECIMENTO NÃO IDENTIFICADO',
              documentNumber: 'NÃO INFORMADO'
            },
            receipt: {
              accessKey: accessKeyFromUrl,
              totalValue: 0
            },
            qrCodeUrl: qrCodeText
          };
        }
        
        throw new Error(`Falha ao obter dados do cupom fiscal: ${response.statusText}`);
      }

      const html = await response.text();
      console.log('HTML recebido, tamanho:', html.length);
      
      if (html.length < 100) {
        console.error('HTML muito curto, provavelmente resposta inválida');
        
        // Se temos a chave de acesso da URL, ainda podemos retornar um objeto mínimo
        if (accessKeyFromUrl) {
          return {
            consumer: {
              name: 'CONSUMIDOR NÃO IDENTIFICADO',
              documentNumber: 'NÃO INFORMADO',
              state: 'MG'
            },
            issuer: {
              name: 'ESTABELECIMENTO NÃO IDENTIFICADO',
              documentNumber: 'NÃO INFORMADO'
            },
            receipt: {
              accessKey: accessKeyFromUrl,
              totalValue: 0
            },
            qrCodeUrl: qrCodeText
          };
        }
        
        return null;
      }
      
      const $ = load(html);
      
      // ==== BUSCA POR PADRÕES CONHECIDOS ====
      
      // ----- PADRÃO 1: Divs com títulos específicos -----
      console.log('Tentando extração pelo padrão 1 (divs com títulos)...');
      
      // Extrair os dados do consumidor
      let consumerName = $('div:contains("CONSUMIDOR")').next().find('div:contains("Nome / Razão Social:")').text().replace('Nome / Razão Social:', '').trim();
      let consumerDocument = $('div:contains("CONSUMIDOR")').next().find('div:contains("CNPJ/CPF:")').text().replace('CNPJ/CPF:', '').trim();
      let consumerState = $('div:contains("CONSUMIDOR")').next().find('div:contains("UF:")').text().replace('UF:', '').trim();
      
      // Extrair os dados do emitente
      let issuerName = $('div:contains("EMITENTE")').next().find('div:contains("Nome / Razão Social:")').text().replace('Nome / Razão Social:', '').trim();
      let issuerDocument = $('div:contains("EMITENTE")').next().find('div:contains("CNPJ:")').text().replace('CNPJ:', '').trim();
      let issuerAddress = $('div:contains("EMITENTE")').next().find('div:contains("Endereço:")').text().replace('Endereço:', '').trim();
      
      // Extrair a chave de acesso
      let accessKey = $('div:contains("CHAVE DE ACESSO")').next().text().trim();
      
      // Extrair o valor total
      let totalValueText = $('div:contains("VALOR TOTAL R$")').next().text().trim();
      let totalValue = 0;
      
      try {
        totalValue = parseFloat(totalValueText.replace(/\./g, '').replace(',', '.')) || 0;
      } catch (e) {
        console.warn('Erro ao converter valor total:', e);
      }
      
      // Extrair a data de emissão
      let issueDateElement = $('div:contains("DATA DE EMISSÃO")').next();
      let issueDate = issueDateElement.length ? issueDateElement.text().trim() : '';
      
      // ----- PADRÃO 2: Tabelas -----
      console.log('Tentando extração pelo padrão 2 (tabelas)...');
      if (!issuerName) {
        // Procurando em tabelas
        const tables = $('table');
        tables.each((i, table) => {
          const tableHtml = $(table).html() || '';
          
          if (tableHtml.includes('EMITENTE') || tableHtml.includes('CNPJ')) {
            $(table).find('tr').each((j, row) => {
              const rowText = $(row).text();
              
              if (rowText.includes('Nome / Razão Social:')) {
                issuerName = rowText.replace('Nome / Razão Social:', '').trim();
              } else if (rowText.includes('CNPJ:')) {
                issuerDocument = rowText.replace('CNPJ:', '').trim();
              } else if (rowText.includes('Endereço:')) {
                issuerAddress = rowText.replace('Endereço:', '').trim();
              } else if (rowText.includes('Chave de Acesso') || rowText.includes('CHAVE DE ACESSO')) {
                accessKey = $(row).find('td').last().text().trim();
              } else if (rowText.includes('VALOR TOTAL') || rowText.includes('Valor Total')) {
                totalValueText = $(row).find('td').last().text().trim();
                try {
                  totalValue = parseFloat(totalValueText.replace(/[^\d,]/g, '').replace(',', '.'));
                } catch (e) {
                  console.warn('Erro ao converter valor total da tabela:', e);
                }
              } else if (rowText.includes('Data de Emissão') || rowText.includes('DATA DE EMISSÃO')) {
                issueDate = $(row).find('td').last().text().trim();
              }
            });
          }
        });
      }
      
      // ----- PADRÃO 3: Busca genérica por textos -----
      console.log('Tentando extração pelo padrão 3 (busca por textos)...');
      if (!accessKey) {
        // Procurar por chave de acesso em todo o HTML
        const keyRegex = /\b\d{44}\b/g;
        const keyMatches = html.match(keyRegex);
        if (keyMatches && keyMatches.length > 0) {
          accessKey = keyMatches[0];
          console.log('Chave de acesso encontrada por regex:', accessKey);
        }
      }
      
      if (!totalValue) {
        // Procurar por padrões de valor total
        const valueRegex = /(?:valor\s+total|total)[^\d]*(R\$\s*)?[^\d]*(\d+(?:[,.]\d{1,2})?)/i;
        const valueMatch = html.match(valueRegex);
        if (valueMatch && valueMatch[2]) {
          try {
            totalValue = parseFloat(valueMatch[2].replace('.', '').replace(',', '.'));
            console.log('Valor total encontrado por regex:', totalValue);
          } catch (e) {
            console.warn('Erro ao converter valor total do regex:', e);
          }
        }
      }
      
      // Usar valores padrão para campos vazios
      consumerName = consumerName || 'CONSUMIDOR NÃO IDENTIFICADO';
      consumerDocument = consumerDocument || 'NÃO INFORMADO';
      consumerState = consumerState || 'MG';
      issuerName = issuerName || 'ESTABELECIMENTO NÃO IDENTIFICADO';
      issuerDocument = issuerDocument || 'NÃO INFORMADO';
      
      // Verificar campos obrigatórios
      if (!accessKey) {
        console.error('Não foi possível extrair a chave de acesso da página');
        
        // Usar a chave extraída da URL se disponível
        if (accessKeyFromUrl) {
          accessKey = accessKeyFromUrl;
          console.log('Usando chave de acesso extraída da URL:', accessKey);
        } else {
          // Último recurso: tentar extrair a chave de acesso da URL
          const urlKeyRegex = /[?&]p=([A-Za-z0-9|]+)/;
          const urlKeyMatch = qrCodeText.match(urlKeyRegex);
          if (urlKeyMatch && urlKeyMatch[1]) {
            accessKey = urlKeyMatch[1];
            console.log('Chave de acesso extraída da URL:', accessKey);
          } else {
            throw new Error('Não foi possível extrair a chave de acesso');
          }
        }
      }
      
      console.log('Dados extraídos:');
      console.log('- Emitente:', issuerName);
      console.log('- CNPJ:', issuerDocument);
      console.log('- Chave:', accessKey?.substr(0, 10) + '...');
      console.log('- Valor:', totalValue);
      console.log('- Data de Emissão:', issueDate);
      
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
          accessKey: accessKey || accessKeyFromUrl,
          totalValue,
          issueDate
        },
        qrCodeUrl: qrCodeText
      };
      
      return fiscalReceiptData;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Erro ao buscar a página do cupom fiscal:', fetchError);
      
      // Se temos a chave de acesso da URL, ainda podemos retornar um objeto mínimo
      if (accessKeyFromUrl) {
        return {
          consumer: {
            name: 'CONSUMIDOR NÃO IDENTIFICADO',
            documentNumber: 'NÃO INFORMADO',
            state: 'MG'
          },
          issuer: {
            name: 'ESTABELECIMENTO NÃO IDENTIFICADO',
            documentNumber: 'NÃO INFORMADO'
          },
          receipt: {
            accessKey: accessKeyFromUrl,
            totalValue: 0
          },
          qrCodeUrl: qrCodeText
        };
      }
      
      throw fetchError;
    }
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