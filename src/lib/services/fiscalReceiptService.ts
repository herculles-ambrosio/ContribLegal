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
        
        throw new Error('HTML inválido ou muito curto');
      }
      
      // Usar Cheerio para analisar o HTML e extrair os dados
      const $ = load(html);
      
      // Tentar extrair o valor total do serviço e a data de emissão da aba "Informações Gerais da Nota"
      let serviceValue = 0;
      let issueDate = '';
      
      try {
        // Buscar pelo campo "Valor total do serviço"
        $('td, th, div, span').each((i, el) => {
          const text = $(el).text().trim();
          
          // Procurar pelo campo "Valor total do serviço" e seu valor adjacente
          if (text.includes('Valor total do serviço') || text.includes('Valor Total dos Serviços')) {
            console.log('Encontrado campo "Valor total do serviço"');
            
            // Pegar o próximo elemento que pode conter o valor
            let valueElement = $(el).next();
            let valueText = valueElement.text().trim();
            
            // Se não encontrou no próximo elemento, procurar em um elemento pai ou irmão
            if (!valueText || !valueText.includes('R$')) {
              // Tentar encontrar na mesma linha ou próximo elemento relevante
              valueText = $(el).parent().text().trim();
              
              // Extrair apenas a parte que contém R$
              const valueMatch = valueText.match(/R\$\s*[\d.,]+/);
              if (valueMatch) {
                valueText = valueMatch[0];
              }
            }
            
            console.log('Texto do valor encontrado:', valueText);
            
            // Extrair apenas os números do valor
            if (valueText) {
              const numericValue = valueText.replace(/[^\d,]/g, '').replace(',', '.');
              if (numericValue) {
                serviceValue = parseFloat(numericValue);
                console.log('Valor total do serviço extraído:', serviceValue);
              }
            }
          }
          
          // Procurar pela data de emissão
          if (text.includes('Data Emissão') || text.includes('Data de Emissão')) {
            console.log('Encontrado campo "Data Emissão"');
            
            // Pegar o próximo elemento que pode conter a data
            let dateElement = $(el).next();
            let dateText = dateElement.text().trim();
            
            // Se não encontrou no próximo elemento, procurar em um elemento pai ou irmão
            if (!dateText || !/\d{2}\/\d{2}\/\d{4}/.test(dateText)) {
              // Tentar encontrar na mesma linha ou próximo elemento relevante
              dateText = $(el).parent().text().trim();
              
              // Extrair apenas a parte que parece ser uma data
              const dateMatch = dateText.match(/\d{2}\/\d{2}\/\d{4}/);
              if (dateMatch) {
                dateText = dateMatch[0];
              }
            }
            
            console.log('Texto da data encontrado:', dateText);
            
            if (dateText) {
              issueDate = dateText;
              console.log('Data de emissão extraída:', issueDate);
            }
          }
        });
      } catch (extractionError) {
        console.error('Erro ao extrair valor do serviço ou data de emissão:', extractionError);
      }
      
      // Extrair dados do cupom, seguindo a estrutura da interface FiscalReceiptData
      
      let fiscalData: FiscalReceiptData = {
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
          accessKey: accessKeyFromUrl || '',
          totalValue: 0,
          serviceValue: serviceValue, // Adicionar o valor do serviço extraído
          issueDate: issueDate // Adicionar a data de emissão extraída
        },
        qrCodeUrl: qrCodeText
      };
      
      // Extrair dados do emissor (estabelecimento)
      try {
        // Tentar encontrar o nome do emissor/estabelecimento
        let issuerName = '';
        $('th:contains("IDENTIFICAÇÃO DO EMITENTE"), div:contains("DADOS DO EMITENTE")').closest('table, div').find('td, div').each((i, el) => {
          const text = $(el).text().trim();
          if (text && !text.includes('IDENTIFICAÇÃO') && !text.includes('DADOS') && text.length > 5) {
            if (!issuerName) {
              issuerName = text;
              console.log('Nome do emitente:', issuerName);
            }
          }
        });
        
        // Se não foi encontrado pelo método anterior, tentar outra abordagem
        if (!issuerName) {
          $('div.text-upper').each((i, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 5 && !issuerName) {
              issuerName = text;
              console.log('Nome do emitente (método alternativo):', issuerName);
            }
          });
        }
        
        if (issuerName) {
          fiscalData.issuer.name = issuerName;
        }
        
        // Tentar extrair CNPJ/CPF do emissor
        $('div:contains("CNPJ:"), span:contains("CNPJ:")').each((i, el) => {
          const text = $(el).text().trim();
          const cnpjMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
          if (cnpjMatch) {
            fiscalData.issuer.documentNumber = cnpjMatch[0];
            console.log('CNPJ do emitente:', fiscalData.issuer.documentNumber);
          }
        });
      } catch (error) {
        console.error('Erro ao extrair dados do emissor:', error);
      }
      
      // Extrair valor total da nota
      try {
        // Primeiro verificar se já temos o valor do serviço, se sim, usamos ele
        if (serviceValue > 0) {
          fiscalData.receipt.totalValue = serviceValue;
          console.log('Usando valor do serviço como valor total:', serviceValue);
        } else {
          // Caso contrário, tentar extrair pelos métodos tradicionais
          $('div:contains("Valor total da NF-e:"), span:contains("Valor total R$"), th:contains("VALOR TOTAL"), div:contains("Valor a Pagar R$")').each((i, el) => {
            const parentText = $(el).parent().text().trim();
            const valueMatch = parentText.match(/R\$\s*([\d.,]+)/);
            
            if (valueMatch && valueMatch[1]) {
              // Converter para número considerando formato brasileiro (vírgula como separador decimal)
              const valueStr = valueMatch[1].replace('.', '').replace(',', '.');
              fiscalData.receipt.totalValue = parseFloat(valueStr);
              console.log('Valor total extraído:', fiscalData.receipt.totalValue);
            }
          });
          
          // Se ainda não encontrou, procurar na página inteira
          if (!fiscalData.receipt.totalValue) {
            const totalValueRegex = /Valor (?:Total|total|a Pagar)[^R]*R\$\s*([\d.,]+)/;
            const pageText = $('body').text();
            const matches = pageText.match(totalValueRegex);
            
            if (matches && matches[1]) {
              const valueStr = matches[1].replace('.', '').replace(',', '.');
              fiscalData.receipt.totalValue = parseFloat(valueStr);
              console.log('Valor total extraído (método alternativo):', fiscalData.receipt.totalValue);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao extrair valor total:', error);
      }
      
      // Extrair a data de emissão se ainda não temos
      if (!fiscalData.receipt.issueDate) {
        try {
          // Procurar por padrões de data
          $('div:contains("Data de Emissão:"), span:contains("Data de Emissão")').each((i, el) => {
            const parentText = $(el).parent().text().trim();
            
            // Formato DD/MM/AAAA
            const dateMatch = parentText.match(/\d{2}\/\d{2}\/\d{4}/);
            if (dateMatch) {
              fiscalData.receipt.issueDate = dateMatch[0];
              console.log('Data de emissão extraída:', fiscalData.receipt.issueDate);
            }
          });
        } catch (error) {
          console.error('Erro ao extrair data de emissão:', error);
        }
      }
      
      return fiscalData;
      
    } catch (fetchError) {
      console.error('Erro ao buscar a página do cupom fiscal:', fetchError);
      
      // Se temos a chave de acesso, podemos retornar um objeto mínimo mesmo com erro de fetch
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
    console.error('Erro ao processar QR code do cupom fiscal:', error);
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