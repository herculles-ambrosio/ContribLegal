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
    
    // Se for uma URL, tentar acessar e extrair informações
    if (isUrl) {
      console.log('QR Code é uma URL. Tentando extrair dados da página...');
      
      try {
        // Tentar fazer fetch da URL para extrair dados da página
        const pageData = await fetchReceiptPage(qrCodeText);
        
        if (pageData && (pageData.issuer.name || pageData.receipt.totalValue > 0)) {
          console.log('Dados extraídos com sucesso da página:', pageData);
          return pageData;
        } else {
          console.log('Não foi possível extrair dados da página, usando processamento padrão');
        }
      } catch (fetchError) {
        console.error('Erro ao fazer fetch da página:', fetchError);
        // Continuar com processamento sem fetch em caso de erro
      }
      
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
 * Faz fetch da página do QR code e extrai os dados
 * @param url URL do QR code
 * @returns Dados extraídos da página ou null em caso de erro
 */
export async function fetchReceiptPage(url: string): Promise<FiscalReceiptData | null> {
  console.log('Iniciando fetch da URL do QR code:', url);
  
  // Extrair a chave de acesso para uso posterior
  const accessKey = extractAccessKeyFromQRCode(url);
  
  try {    
    // Verificar se é PDF ou HTML
    const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
    
    if (isPdf) {
      console.log('URL parece ser um PDF. Tentando apenas extrair dados da URL...');
      // Para PDFs, tentamos apenas usar os dados da URL
      return createBasicReceiptData(url, accessKey);
    }
    
    // ABORDAGEM 1: Tentar acessar diretamente
    // Fazendo primeiro request sem proxy para páginas que não exigem cors
    try {
      console.log('Tentativa 1: Fazendo request direto para a URL:', url);
      const directResponse = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, 5000); // 5 segundos timeout
      
      if (directResponse.ok) {
        const html = await directResponse.text();
        console.log('HTML recebido (direto), tamanho:', html.length);
        
        if (html.length > 100) { // Verificar se não é uma resposta vazia
          const data = extractDataFromHtml(html, url, accessKey);
          if (data.receipt.totalValue > 0 || data.issuer.name !== 'ESTABELECIMENTO COMERCIAL') {
            console.log('Dados extraídos com sucesso (direto):', data);
            return data;
          }
        }
      }
    } catch (directError) {
      console.log('Erro no request direto:', directError);
      // Continuar para próxima abordagem
    }
    
    // ABORDAGEM 2: Usar proxy CORS
    try {
      console.log('Tentativa 2: Usando proxy CORS');
      
      // Usar um proxy CORS para evitar problemas de CORS
      const corsProxyUrl = 'https://corsproxy.io/?';
      const fetchUrl = corsProxyUrl + encodeURIComponent(url);
      
      console.log('Usando URL com proxy para fetch:', fetchUrl);
      
      const proxyResponse = await fetchWithTimeout(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, 10000); // 10 segundos timeout
      
      if (proxyResponse.ok) {
        const html = await proxyResponse.text();
        console.log('HTML recebido (via proxy), tamanho:', html.length);
        
        if (html.length > 100) {
          const data = extractDataFromHtml(html, url, accessKey);
          if (data.receipt.totalValue > 0 || data.issuer.name !== 'ESTABELECIMENTO COMERCIAL') {
            console.log('Dados extraídos com sucesso (via proxy):', data);
            return data;
          }
        }
      }
    } catch (proxyError) {
      console.log('Erro no request via proxy:', proxyError);
      // Continuar para próxima abordagem
    }
    
    // ABORDAGEM 3: Usar proxy alternativo
    try {
      console.log('Tentativa 3: Usando proxy alternativo');
      
      // Tentar outro proxy
      const altProxyUrl = 'https://api.allorigins.win/raw?url=';
      const altFetchUrl = altProxyUrl + encodeURIComponent(url);
      
      console.log('Usando URL com proxy alternativo:', altFetchUrl);
      
      const altProxyResponse = await fetchWithTimeout(altFetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, 10000);
      
      if (altProxyResponse.ok) {
        const html = await altProxyResponse.text();
        console.log('HTML recebido (via proxy alternativo), tamanho:', html.length);
        
        if (html.length > 100) {
          const data = extractDataFromHtml(html, url, accessKey);
          if (data.receipt.totalValue > 0 || data.issuer.name !== 'ESTABELECIMENTO COMERCIAL') {
            console.log('Dados extraídos com sucesso (via proxy alternativo):', data);
            return data;
          }
        }
      }
    } catch (altProxyError) {
      console.log('Erro no request via proxy alternativo:', altProxyError);
    }
    
    // Se chegou até aqui, nenhuma abordagem funcionou
    console.warn('Nenhuma abordagem de fetch funcionou. Usando dados básicos da URL');
    return createBasicReceiptData(url, accessKey);
    
  } catch (error) {
    console.error('Erro ao fazer fetch ou processar página:', error);
    return createBasicReceiptData(url, accessKey);
  }
}

/**
 * Versão de fetch com timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Cria dados básicos do cupom fiscal usando apenas URL e chave de acesso
 */
function createBasicReceiptData(url: string, accessKey: string): FiscalReceiptData {
  // Tentar extrair dados básicos da URL
  const totalValue = extractValueFromUrl(url);
  const issueDate = extractDateFromUrl(url) || formatCurrentDate();
  
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
      accessKey: accessKey || 'NÃO IDENTIFICADO',
      totalValue: totalValue,
      issueDate: issueDate
    },
    qrCodeUrl: url
  };
}

/**
 * Extrai dados do cupom fiscal a partir do HTML da página
 * @param html HTML da página
 * @param url URL original
 * @param accessKey Chave de acesso extraída anteriormente
 * @returns Dados estruturados do cupom fiscal
 */
function extractDataFromHtml(html: string, url: string, accessKey: string): FiscalReceiptData {
  console.log('Extraindo dados do HTML da página...');
  
  // Carregar HTML no Cheerio
  const $ = load(html);
  
  // Valores padrão que serão preenchidos com dados extraídos
  let issuerName = 'ESTABELECIMENTO COMERCIAL';
  let issuerDoc = 'NÃO INFORMADO';
  let totalValue = 0;
  let issueDate = '';
  
  // Tentar extrair informações do HTML
  
  // 1. Valor Total - procurar por padrões comuns
  const valorPatterns = [
    'Valor Total R$', 'VALOR TOTAL', 'Total R$', 'Valor a Pagar', 'VLR. TOTAL R$', 
    'VALOR A PAGAR', 'TOTAL', 'Valor Pago', 'VALOR PAGO', 'VALOR TOTAL DA NF',
    'VALOR DA NOTA', 'VALOR CUPOM', 'TOTAL DA COMPRA', 'TOTAL DA NF', 'Valor (R$)',
    'VALOR TOTAL DO DOCUMENTO'
  ];
  
  // Primeiro, tentar encontrar valores monetários específicos em elementos com os padrões
  for (const pattern of valorPatterns) {
    // Procurar pelo texto do padrão
    const valorElement = $('*:contains("' + pattern + '")');
    
    if (valorElement.length > 0) {
      // Para cada elemento encontrado, buscar um valor monetário próximo
      valorElement.each((_, el) => {
        if (totalValue > 0) return; // Se já encontrou um valor, não continuar
        
        // Texto do elemento e dos irmãos próximos
        const text = $(el).text().trim();
        const nextText = $(el).next().text().trim();
        const parentText = $(el).parent().text().trim();
        
        // Extrair valor monetário - padrões comuns no Brasil: R$ 123,45 ou 123,45
        const moneyRegex = /R\$\s*([\d.,]+)|(\d+[,.]\d{2})/i;
        
        // Verificar no próprio texto do elemento
        let match = text.match(moneyRegex);
        if (match && (match[1] || match[2])) {
          const valueStr = (match[1] || match[2]).replace(/\./g, '').replace(',', '.');
          const parsedValue = parseFloat(valueStr);
          if (!isNaN(parsedValue) && parsedValue > 0) {
            totalValue = parsedValue;
            console.log('Valor encontrado em:', pattern, '->', totalValue);
          }
        }
        
        // Verificar nos elementos próximos
        if (totalValue === 0 && nextText) {
          match = nextText.match(moneyRegex);
          if (match && (match[1] || match[2])) {
            const valueStr = (match[1] || match[2]).replace(/\./g, '').replace(',', '.');
            const parsedValue = parseFloat(valueStr);
            if (!isNaN(parsedValue) && parsedValue > 0) {
              totalValue = parsedValue;
              console.log('Valor encontrado em elemento irmão:', totalValue);
            }
          }
        }
        
        // Verificar no elemento pai
        if (totalValue === 0) {
          match = parentText.match(moneyRegex);
          if (match && (match[1] || match[2])) {
            const valueStr = (match[1] || match[2]).replace(/\./g, '').replace(',', '.');
            const parsedValue = parseFloat(valueStr);
            if (!isNaN(parsedValue) && parsedValue > 0) {
              totalValue = parsedValue;
              console.log('Valor encontrado no elemento pai:', totalValue);
            }
          }
        }
      });
    }
    
    if (totalValue > 0) break; // Sair do loop se encontrou um valor
  }
  
  // Se não encontrou valor em padrões específicos, procurar em toda a página
  if (totalValue === 0) {
    console.log('Tentando encontrar valor monetário em toda a página...');
    
    // Buscar todos os valores monetários na página
    const pageText = $('body').text();
    const moneyMatches = pageText.match(/R\$\s*(\d+[,.]\d{2})/g);
    
    if (moneyMatches && moneyMatches.length > 0) {
      // Pegar o maior valor encontrado, assumindo que seja o total
      let maxValue = 0;
      
      moneyMatches.forEach(match => {
        const valueStr = match.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
        const parsedValue = parseFloat(valueStr);
        if (!isNaN(parsedValue) && parsedValue > maxValue) {
          maxValue = parsedValue;
        }
      });
      
      if (maxValue > 0) {
        totalValue = maxValue;
        console.log('Valor mais alto encontrado na página:', totalValue);
      }
    }
  }
  
  // 2. Nome do Emitente e CNPJ
  const emitentePattterns = [
    'EMITENTE', 'RAZÃO SOCIAL', 'ESTABELECIMENTO', 'EMPRESA',
    'NOME EMPRESARIAL', 'EMISSOR', 'VENDEDOR', 'CNPJ', 'IDENTIFICAÇÃO DO EMITENTE'
  ];
  
  for (const pattern of emitentePattterns) {
    const emitenteElement = $('*:contains("' + pattern + '")');
    
    if (emitenteElement.length > 0) {
      emitenteElement.each((_, el) => {
        if (issuerName !== 'ESTABELECIMENTO COMERCIAL' && issuerDoc !== 'NÃO INFORMADO') {
          return; // Se já encontrou todos os dados, não continuar
        }
        
        const text = $(el).text().trim();
        const nextText = $(el).next().text().trim();
        const parentText = $(el).parent().text().trim();
        const siblingTexts = [];
        
        // Coletar textos de irmãos próximos
        let sibling = $(el).next();
        for (let i = 0; i < 3 && sibling.length; i++) {
          siblingTexts.push(sibling.text().trim());
          sibling = sibling.next();
        }
        
        // Procurar nome do emitente
        if (issuerName === 'ESTABELECIMENTO COMERCIAL') {
          // Verificar se estamos lidando com o nome ou cnpj
          if (pattern.includes('CNPJ') || text.includes('CNPJ')) {
            // Procurar o CNPJ
            const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}/;
            let match;
            
            if ((match = text.match(cnpjRegex)) || 
                (nextText && (match = nextText.match(cnpjRegex))) || 
                (parentText && (match = parentText.match(cnpjRegex)))) {
              issuerDoc = match[0];
              console.log('CNPJ encontrado:', issuerDoc);
            }
          } else {
            // Tentar encontrar o nome
            for (const siblingText of siblingTexts) {
              if (siblingText && siblingText.length > 5 && !siblingText.includes('CNPJ') && !/^\d+$/.test(siblingText)) {
                // Provavelmente é o nome do emitente
                issuerName = siblingText.substring(0, 100); // Limitar tamanho
                console.log('Nome do emitente encontrado:', issuerName);
                break;
              }
            }
            
            // Se não encontrou nos irmãos, tentar extrair do texto atual
            if (issuerName === 'ESTABELECIMENTO COMERCIAL' && parentText.length > pattern.length + 5) {
              const nameCandidate = parentText.replace(new RegExp(pattern, 'i'), '').trim();
              if (nameCandidate && nameCandidate.length > 5 && !/^\d+$/.test(nameCandidate)) {
                issuerName = nameCandidate.substring(0, 100);
                console.log('Nome do emitente extraído do texto atual:', issuerName);
              }
            }
          }
        }
      });
    }
  }
  
  // 3. Data de Emissão
  const dataPatterns = [
    'DATA DE EMISSÃO', 'EMISSÃO', 'DATA EMISSÃO', 'DATA', 
    'EMITIDO EM', 'DATA E HORA', 'DATA/HORA', 'DT. EMISSÃO',
    'EMITIDA EM', 'DATA DA COMPRA', 'DATA DA VENDA'
  ];
  
  for (const pattern of dataPatterns) {
    if (issueDate) break; // Se já encontrou, parar busca
    
    const dataElement = $('*:contains("' + pattern + '")');
    
    if (dataElement.length > 0) {
      dataElement.each((_, el) => {
        if (issueDate) return; // Se já encontrou, não continuar
        
        // Texto do elemento e dos irmãos próximos
        const text = $(el).text().trim();
        const nextText = $(el).next().text().trim();
        const parentText = $(el).parent().text().trim();
        
        // Diferentes padrões de data
        const dateRegexes = [
          /(\d{2}\/\d{2}\/\d{4})/,                    // DD/MM/YYYY
          /(\d{2}-\d{2}-\d{4})/,                     // DD-MM-YYYY
          /(\d{4}-\d{2}-\d{2})/,                     // YYYY-MM-DD 
          /(\d{1,2}\/\d{1,2}\/\d{2,4})/,             // D/M/YYYY ou DD/MM/YY
          /(\d{1,2}\.\d{1,2}\.\d{2,4})/,             // D.M.YYYY ou DD.MM.YY
          /(\d{1,2}\-\d{1,2}\-\d{2,4})/              // D-M-YYYY ou DD-MM-YY
        ];
        
        // Verificar cada regex em cada texto
        const textsToCheck = [text, nextText, parentText];
        
        for (const currentText of textsToCheck) {
          if (issueDate) break;
          
          for (const regex of dateRegexes) {
            const match = currentText.match(regex);
            if (match && match[1]) {
              issueDate = formatDateString(match[1]);
              console.log('Data encontrada:', match[1], '-> formatada:', issueDate);
              break;
            }
          }
        }
      });
    }
  }
  
  // Se não encontrou data no HTML, tentar extrair da URL
  if (!issueDate) {
    issueDate = extractDateFromUrl(url) || formatCurrentDate();
    console.log('Data extraída da URL ou usada data atual:', issueDate);
  }
  
  // Retornar os dados extraídos
  return {
    consumer: {
      name: 'CONSUMIDOR NÃO IDENTIFICADO',
      documentNumber: 'NÃO INFORMADO',
      state: 'MG'
    },
    issuer: {
      name: issuerName,
      documentNumber: issuerDoc
    },
    receipt: {
      accessKey: accessKey || 'NÃO IDENTIFICADO',
      totalValue: totalValue,
      issueDate: issueDate
    },
    qrCodeUrl: url
  };
}

/**
 * Formata uma string de data para o formato padrão YYYY-MM-DD
 * @param dateString String de data em diferentes formatos
 * @returns Data formatada
 */
function formatDateString(dateString: string): string {
  try {
    // Vários formatos possíveis
    if (dateString.includes('/')) {
      // Formato DD/MM/YYYY ou DD/MM/YY
      const parts = dateString.split('/');
      if (parts.length === 3) {
        let year = parts[2];
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        
        // Se o ano tem 2 dígitos, assumir que é 20XX para datas recentes
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
    } else if (dateString.includes('-')) {
      // Verificar se já está no formato YYYY-MM-DD
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return dateString; // Já está no formato correto
      } else if (parts.length === 3) {
        // Formato DD-MM-YYYY ou DD-MM-YY
        let year = parts[2];
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        
        // Se o ano tem 2 dígitos, assumir que é 20XX
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
    } else if (dateString.includes('.')) {
      // Formato DD.MM.YYYY ou DD.MM.YY
      const parts = dateString.split('.');
      if (parts.length === 3) {
        let year = parts[2];
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        
        // Se o ano tem 2 dígitos, assumir que é 20XX
        if (year.length === 2) {
          year = `20${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
    }
    
    // Se não conseguiu formatar, tentar usar o Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Se não conseguiu formatar, retornar como está
    return dateString;
  } catch (error) {
    console.error('Erro ao formatar string de data:', error);
    return dateString;
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