import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive ticker mapping for Brazilian market - Verified against B3, Status Invest, Investidor10, FundsExplorer, Clube FII
// Last verified: March 2026
const TICKER_MAP: Record<string, string> = {
  // ========== AÇÕES - VERIFICADAS B3/STATUS INVEST ==========
  
  // Petróleo & Gás
  "PETROBRAS PN": "PETR4", "PETROBRAS ON": "PETR3", "PETROBRAS": "PETR4",
  "PETRORIO": "PRIO3", "PRIO": "PRIO3", "PETRORIO ON": "PRIO3", "PETRORECSA": "PRIO3",
  "COSAN": "CSAN3", "COSAN ON": "CSAN3",
  "3R PETROLEUM": "RRRP3", "3R": "RRRP3",
  "BRAVA ENERGIA": "BRAV3", "BRAVA": "BRAV3",

  // Mineração & Siderurgia
  "VALE ON": "VALE3", "VALE": "VALE3",
  "GERDAU": "GGBR4", "GERDAU PN": "GGBR4", "GERDAU MET": "GOAU4", "METALURGICA GERDAU": "GOAU4",
  "USIMINAS": "USIM5", "USIMINAS PNA": "USIM5",
  "CSN": "CSNA3", "CSN ON": "CSNA3",
  "CSN MINERACAO": "CMIN3", "CSN MINERAÇÃO": "CMIN3",
  "FERBASA": "FESA4", "FERBASA PN": "FESA4",

  // Bancos & Financeiro
  "ITAU UNIBANCO": "ITUB4", "ITAU UNIBANCO PN": "ITUB4", "ITAU": "ITUB4",
  "ITAUSA": "ITSA4", "ITAUSA PN": "ITSA4",
  "BRADESCO PN": "BBDC4", "BRADESCO ON": "BBDC3", "BRADESCO": "BBDC4",
  "BANCO DO BRASIL": "BBAS3", "BB": "BBAS3", "BANCO DO BRASIL ON": "BBAS3",
  "BB SEGURIDADE": "BBSE3", "BBSEGURIDADE": "BBSE3", "BB SEGURIDADE ON": "BBSE3",
  "SANTANDER BR": "SANB11", "SANTANDER": "SANB11", "SANTANDER UNIT": "SANB11",
  "BTG PACTUAL": "BPAC11", "BTG": "BPAC11", "BTG PACTUAL UNIT": "BPAC11",
  "BANCO PAN": "BPAN4", "BPAN": "BPAN4",
  "BANRISUL": "BRSR6", "BANRISUL PNB": "BRSR6",
  "ABC BRASIL": "ABCB4", "ABC": "ABCB4",
  "B3 SA": "B3SA3", "B3": "B3SA3", "B3 ON": "B3SA3",
  "PORTO SEGURO": "PSSA3", "PORTO SEGURO ON": "PSSA3", "PORTO": "PSSA3",
  "CAIXA SEGURIDADE": "CXSE3", "CAIXA SEG": "CXSE3",
  "IRB BRASIL": "IRBR3", "IRB": "IRBR3",

  // Energia Elétrica
  "ELETROBRAS": "ELET6", "ELETROBRAS ON": "ELET3", "ELETROBRAS PNB": "ELET6", "ELETROBRAS PN": "ELET6", "ELETROBRAS PNA": "ELET6",
  "ENGIE BRASIL": "EGIE3", "ENGIE": "EGIE3", "ENGIE ON": "EGIE3",
  "EQUATORIAL": "EQTL3", "EQUATORIAL ON": "EQTL3",
  "CEMIG": "CMIG4", "CEMIG PN": "CMIG4", "CEMIG ON": "CMIG3",
  "COPEL": "CPLE6", "COPEL PNB": "CPLE6", "COPEL ON": "CPLE3",
  "TAESA": "TAEE11", "TAESA UNT": "TAEE11", "TAESA UNIT": "TAEE11",
  "ENEVA": "ENEV3", "ENEVA ON": "ENEV3",
  "ALUPAR": "ALUP11", "ALUPAR UNT": "ALUP11", "ALUPAR UNIT": "ALUP11",
  "SABESP": "SBSP3", "SABESP ON": "SBSP3",
  "SANEPAR": "SAPR11", "SANEPAR UNT": "SAPR11", "SANEPAR UNIT": "SAPR11",
  "CPFL ENERGIA": "CPFE3", "CPFL": "CPFE3",
  "ENERGISA": "ENGI11", "ENERGISA UNT": "ENGI11",
  "NEOENERGIA": "NEOE3", "NEOENERGIA ON": "NEOE3",
  "LIGHT": "LIGT3", "LIGHT ON": "LIGT3",
  "AUREN": "AURE3", "AUREN ENERGIA": "AURE3",
  "OMEGA ENERGIA": "MEGA3", "OMEGA": "MEGA3",
  "ISA CTEEP": "TRPL4", "CTEEP": "TRPL4", "TRANSMISSAO PAULISTA": "TRPL4",
  "ELETROMEDIA": "ELMD3",

  // Bebidas & Alimentos
  "AMBEV": "ABEV3", "AMBEV ON": "ABEV3",
  "JBS": "JBSS3", "JBS ON": "JBSS3",
  "MARFRIG": "MRFG3", "MARFRIG ON": "MRFG3",
  "BRF": "BRFS3", "BRF ON": "BRFS3",
  "MINERVA": "BEEF3", "MINERVA ON": "BEEF3",
  "ASSAI": "ASAI3", "ASSAI ON": "ASAI3",
  "CARREFOUR": "CRFB3", "CARREFOUR ON": "CRFB3", "ATACADAO": "CRFB3",
  "GRUPO MATEUS": "GMAT3", "MATEUS": "GMAT3",
  "M DIAS BRANCO": "MDIA3", "M.DIAS BRANCO": "MDIA3",
  "CAMIL": "CAML3",
  "SAO MARTINHO": "SMTO3",

  // Varejo
  "MAGAZINE LUIZA": "MGLU3", "MAGALU": "MGLU3",
  "LOJAS RENNER": "LREN3", "RENNER": "LREN3",
  "AREZZO": "ARZZ3", "AREZZO ON": "ARZZ3",
  "VIVARA": "VIVA3", "VIVARA ON": "VIVA3",
  "PETZ": "PETZ3", "PETZ ON": "PETZ3",
  "NATURA": "NTCO3", "NATURA ON": "NTCO3",
  "GRUPO SOMA": "SOMA3", "SOMA": "SOMA3",
  "TRACK FIELD": "TFCO4", "TRACK&FIELD": "TFCO4",
  "SMARTFIT": "SMFT3", "SMART FIT": "SMFT3",
  "CASAS BAHIA": "BHIA3", "VIA": "BHIA3",
  "PAGUE MENOS": "PGMN3",

  // Saúde
  "RAIA DROGASIL": "RADL3", "RD SAUDE": "RADL3", "RD": "RADL3",
  "HAPVIDA": "HAPV3", "HAPVIDA ON": "HAPV3",
  "FLEURY": "FLRY3", "FLEURY ON": "FLRY3",
  "HYPERA": "HYPE3", "HYPERA ON": "HYPE3",
  "ODONTOPREV": "ODPV3",
  "BLAU FARMACEUTICA": "BLAU3", "BLAU": "BLAU3",
  "BIOMM": "BIOM3",
  "REDE DOR": "RDOR3", "REDE D'OR": "RDOR3", "REDE D OR": "RDOR3",
  "ONCOCLÍNICAS": "ONCO3", "ONCOCLINICAS": "ONCO3",
  "DIMED": "PNVL3", "DIMED ON": "PNVL3", "PANVEL": "PNVL3",
  "QUALICORP": "QUAL3",

  // Construção Civil
  "CYRELA": "CYRE3", "CYRELA ON": "CYRE3",
  "MRV": "MRVE3", "MRV ON": "MRVE3",
  "EZTEC": "EZTC3", "EZTEC ON": "EZTC3",
  "DIRECIONAL": "DIRR3", "DIRECIONAL ON": "DIRR3",
  "TENDA": "TEND3", "TENDA ON": "TEND3",
  "EVEN": "EVEN3", "EVEN ON": "EVEN3",
  "LAVVI": "LAVV3",
  "CURY": "CURY3",
  "TRISUL": "TRIS3",
  "MELNICK": "MELK3",
  "JHSF": "JHSF3",
  "MITRE": "MTRE3",
  "PLANO E PLANO": "PLPL3", "PLANO&PLANO": "PLPL3",
  "MOURA DUBEUX": "MDNE3",

  // Transporte & Logística
  "RUMO": "RAIL3", "RUMO ON": "RAIL3",
  "LOCALIZA": "RENT3", "LOCALIZA ON": "RENT3",
  "MOVIDA": "MOVI3", "MOVIDA ON": "MOVI3",
  "SIMPAR": "SIMH3", "SIMPAR ON": "SIMH3",
  "VAMOS": "VAMO3", "VAMOS ON": "VAMO3",
  "SANTOS BRP": "STBP3", "SANTOS BRASIL": "STBP3",
  "ECORODOVIAS": "ECOR3", "ECOR": "ECOR3",
  "TEGMA": "TGMA3",
  "EMBRAER": "EMBR3", "EMBRAER ON": "EMBR3",
  "RANDON": "RAPT4", "RANDON PN": "RAPT4",
  "TUPY": "TUPY3", "TUPY ON": "TUPY3",
  "MILLS": "MILS3",
  // CCR mudou para MOTV3 (Motiva) em maio/2025
  "CCR": "MOTV3", "CCR ON": "MOTV3", "MOTIVA": "MOTV3",
  // GOL mudou para GOLL54 após reestruturação (jun/2025)
  "GOL": "GOLL54", "GOL PN": "GOLL54", "GOLL4": "GOLL54",
  // AZUL mudou para AZUL54 após reestruturação (dez/2025)
  "AZUL": "AZUL54", "AZUL PN": "AZUL54", "AZUL4": "AZUL54",

  // Tecnologia
  "TOTVS": "TOTS3", "TOTVS ON": "TOTS3",
  "WEG": "WEGE3", "WEG ON": "WEGE3",
  "POSITIVO": "POSI3", "POSITIVO TEC": "POSI3",
  "INTELBRAS": "INTB3",
  "MULTILASER": "MLAS3",
  "BEMOBI": "BMOB3",
  "LOCAWEB": "LWSA3",
  "CLEARSALE": "CLSA3",
  "MÉLIUZ": "CASH3", "MELIUZ": "CASH3",

  // Telecom
  "TIM": "TIMS3", "TIM ON": "TIMS3",
  "TELEFONICA BRASIL": "VIVT3", "VIVO": "VIVT3", "TELEFONICA": "VIVT3",
  "OI": "OIBR3", "OI ON": "OIBR3",

  // Papel & Celulose
  "KLABIN": "KLBN11", "KLABIN UNT": "KLBN11", "KLABIN UNIT": "KLBN11",
  "SUZANO": "SUZB3", "SUZANO ON": "SUZB3",
  "IRANI": "RANI3",

  // Agronegócio
  "BRASILAGRO": "AGRO3", "BRASILAGRO ON": "AGRO3",
  "SLC AGRICOLA": "SLCE3", "SLC": "SLCE3",

  // Químico & Petroquímico
  "UNIPAR": "UNIP6", "UNIPAR PNB": "UNIP6", "UNIPAR ON": "UNIP3",
  "BRASKEM": "BRKM5", "BRASKEM PNA": "BRKM5",

  // Seguros
  "WIZ CO": "WIZC3", "WIZ": "WIZC3", "WIZ SOLUCOES": "WIZC3",

  // Shopping Centers
  "MULTIPLAN": "MULT3", "MULTIPLAN ON": "MULT3",
  "IGUATEMI": "IGTI11", "IGUATEMI UNT": "IGTI11", "IGUATEMI UNIT": "IGTI11",
  "ALLOS": "ALOS3", "ALLOS ON": "ALOS3", "ALIANSCE SONAE": "ALOS3",

  // Diversos
  "SCHULZ": "SHUL4",

  // ========== ATIVOS DESLISTADOS (manter para notas históricas) ==========
  // CIELO - deslistada da B3 em 2024 (OPA concluída)
  "CIELO": "CIEL3", "CIELO ON": "CIEL3",
  // SUL AMERICA - incorporada pela Rede D'Or em 2022
  "SUL AMERICA": "SULA11",
  // ENERGIAS BR - deslistada em 2023 (OPA EDP)
  "ENERGIAS BR": "ENBR3",
  // UNIDAS/LCAM3 - incorporada pela Localiza
  "UNIDAS": "LCAM3",

  // ========== FIIs - VERIFICADOS FUNDS EXPLORER / CLUBE FII ==========
  
  // Logística
  "FII HGLG": "HGLG11", "HGLG": "HGLG11", "FII HGLG PAX": "HGLG11", "CSHG LOGISTICA": "HGLG11",
  "FII BTLG": "BTLG11", "BTG LOGISTIC": "BTLG11", "BTLG LOGISTICA": "BTLG11", "BTLG": "BTLG11",
  "FII XPLG": "XPLG11", "XP LOG": "XPLG11", "XPLG": "XPLG11",
  "FII VILG": "VILG11", "VINCI LOGISTICA": "VILG11", "VILG": "VILG11",
  "FII BRESCO": "BRCO11", "BRESCO": "BRCO11", "BRESCO LOGISTICA": "BRCO11",
  "FII LVBI": "LVBI11", "VBI LOGISTICA": "LVBI11", "LVBI": "LVBI11",

  // Shopping / Varejo
  "FII XP MALLS": "XPML11", "XPML": "XPML11", "XP MALLS": "XPML11",
  "FII MALL": "MALL11", "MALLS BRASIL": "MALL11", "MALL": "MALL11",
  "FII VISC": "VISC11", "VINCI SHOPPING": "VISC11", "VISC": "VISC11",
  "FII HSML": "HSML11", "HSI MALLS": "HSML11", "HSML": "HSML11",
  "FII HGBS": "HGBS11", "CSHG BRASIL SHOP": "HGBS11", "HGBS": "HGBS11",

  // Renda Urbana / Corporativo
  "FII HGRU": "HGRU11", "CSHG RENDA URB": "HGRU11", "HGRU": "HGRU11",
  "FII PVBI": "PVBI11", "VBI PRIME": "PVBI11", "PVBI": "PVBI11",
  "FII RBRP": "RBRP11", "RBRP": "RBRP11",
  "FII TRXF": "TRXF11", "TRX REAL ESTATE": "TRXF11", "TRXF": "TRXF11",
  "FII GUARD": "GARE11", "GUARDIAN": "GARE11", "GUARD11": "GARE11", "GARE": "GARE11",
  "FII KNRI": "KNRI11", "FII KINEA": "KNRI11", "KINEA RENDA": "KNRI11", "FII KINEA UN": "KNRI11", "KNRI": "KNRI11",

  // Recebíveis / Papel
  "FII KNCR": "KNCR11", "KINEA RENDIMENTOS": "KNCR11", "KNCR": "KNCR11",
  "FII KNIP": "KNIP11", "KINEA INDICES": "KNIP11", "KNIP": "KNIP11",
  "FII KNSC": "KNSC11", "KINEA SEC": "KNSC11", "KNSC": "KNSC11",
  "FII IRDM": "IRDM11", "IRIDIUM": "IRDM11", "IRDM": "IRDM11",
  "FII RECR": "RECR11", "REC RECEBIVEIS": "RECR11", "RECR": "RECR11",
  "FII CPTS": "CPTS11", "CAPITANIA SEC": "CPTS11", "CPTS": "CPTS11",
  "FII RBRR": "RBRR11", "RBR RENDIMENTO": "RBRR11", "RBRR": "RBRR11",
  "FII MXRF": "MXRF11", "MAXI RENDA": "MXRF11", "MXRF": "MXRF11",
  "FII XPCI": "XPCI11", "XP CREDITO": "XPCI11", "XPCI": "XPCI11",
  "FII VGIR": "VGIR11", "VALORA RE": "VGIR11", "VGIR": "VGIR11",
  "FII RZAK": "RZAK11", "RIZA AKIN": "RZAK11",
  "FII HGCR": "HGCR11", "CSHG RECEB": "HGCR11",
  "FII VRTA": "VRTA11", "FATOR VERITA": "VRTA11", "VRTA": "VRTA11",
  "FII NCHB": "NCHB11", "NCH BRASIL": "NCHB11",
  "FII PLCR": "PLCR11", "PLURAL RECEB": "PLCR11",
  "FII RBRY": "RBRY11", "RBR CREDITO": "RBRY11",

  // Agro
  "FII RZTR": "RZTR11", "RIZA TERRAX": "RZTR11", "RZTR": "RZTR11",
  "FII TG ATIVO REAL": "TGAR11", "TGAR": "TGAR11", "TG ATIVO REAL": "TGAR11",
  "FII BTAL": "BTAL11", "BTAL": "BTAL11", "BTG TERRAS AGRICOLAS": "BTAL11", "BTG TERRAS": "BTAL11",

  // FOF (Fundo de Fundos)
  "FII KFOF": "KFOF11", "KINEA FOF": "KFOF11", "KFOF": "KFOF11",
  "FII BCFF": "BCFF11", "BTG FOF": "BCFF11", "BCFF": "BCFF11",
  "FII HFOF": "HFOF11", "HEDGE FOF": "HFOF11", "HFOF": "HFOF11",
  "FII RBRF": "RBRF11", "RBR ALPHA": "RBRF11", "RBRF": "RBRF11",
  // Outros FIIs
  // MCCI11 - FII Mauá Capital Recebíveis Imobiliários (mais comum nas notas da Inter Invest)
  // MAUA11 - FII Mauá Capital FOF (raramente aparece)
  // Por padrão, "FII MAUA" ou "MAUA" nas notas = MCCI11
  "FII MAUA": "MCCI11", "MAUA CAPITAL": "MCCI11", "MAUA": "MCCI11",
  "FII MCCI": "MCCI11", "MCCI": "MCCI11", "MAUA CAPITAL RECEBIVEIS": "MCCI11", "MAUA RECEBIVEIS": "MCCI11",
  // Correção: IA às vezes retorna MAUA11 erroneamente - mapear para MCCI11
  "MAUA11": "MCCI11",
  // Known AI misreads from PDFs - MAUA42/MAUA12 etc são leituras erradas de MCCI11
  "MAUA42": "MCCI11", "MAUA12": "MCCI11", "MAUA21": "MCCI11", "MCCI12": "MCCI11", "MCCI42": "MCCI11",
  // FII MAUA FOF (fundo de fundos) - apenas quando explicitamente mencionado
  "FII MAUA FOF": "MAUA11", "MAUA FOF": "MAUA11", "MAUA CAPITAL FOF": "MAUA11",
  
  "PMLL11": "PMLL11",
};

function normalizeTickerName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Known valid B3 suffixes for stocks and units
const VALID_STOCK_SUFFIXES = ['3', '4', '5', '6', '11', '33', '34'];

// Master set of known tickers (from TICKER_MAP values) for cross-validation
const KNOWN_TICKERS = new Set(Object.values(TICKER_MAP));

function resolveTickerFromName(rawName: string): string {
  let normalized = normalizeTickerName(rawName);
  
  // Strip fractional market suffix "F" (e.g. PETR4F -> PETR4, VALE3F -> VALE3)
  if (/^[A-Z]{4}\d{1,2}F$/.test(normalized)) {
    normalized = normalized.slice(0, -1);
  }
  
  // Already a valid ticker pattern (4 letters + 1-2 digits)?
  if (/^[A-Z]{4}\d{1,2}$/.test(normalized)) {
    // Direct map match (handles corrections like GUARD11->GARE11, GOLL4->GOLL54)
    if (TICKER_MAP[normalized]) return TICKER_MAP[normalized];
    
    // Validate suffix
    const suffix = normalized.replace(/^[A-Z]+/, '');
    if (!VALID_STOCK_SUFFIXES.includes(suffix)) {
      const prefix = normalized.replace(/\d+$/, '');
      // Search for known ticker with same prefix
      const knownTicker = [...KNOWN_TICKERS].find(t => t.startsWith(prefix));
      if (knownTicker) {
        console.log(`Corrected invalid suffix: "${normalized}" -> "${knownTicker}"`);
        return knownTicker;
      }
      // Try common patterns: prefix+11 (FII) or prefix+3 (ON)
      if (KNOWN_TICKERS.has(prefix + '11')) return prefix + '11';
      if (KNOWN_TICKERS.has(prefix + '3')) return prefix + '3';
    }
    
    return normalized;
  }
  
  // US tickers (all letters, no digits, 1-5 chars)
  if (/^[A-Z]{1,5}$/.test(normalized) && !TICKER_MAP[normalized]) {
    return normalized;
  }

  // Exact match in map
  if (TICKER_MAP[normalized]) return TICKER_MAP[normalized];

  // Partial matches - only for keys >= 4 chars
  const candidates: { key: string; ticker: string; score: number }[] = [];
  for (const [key, ticker] of Object.entries(TICKER_MAP)) {
    if (key.length < 4) continue;
    if (normalized.includes(key)) {
      candidates.push({ key, ticker, score: key.length });
    } else if (key.includes(normalized) && normalized.length >= 5) {
      candidates.push({ key, ticker, score: normalized.length });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    console.log(`Partial match: "${normalized}" -> "${candidates[0].ticker}" (via "${candidates[0].key}")`);
    return candidates[0].ticker;
  }

  console.warn(`UNRESOLVED TICKER: "${normalized}" - could not map to any known B3 ticker`);
  return normalized;
}

// Deduplicate operations: merge ops with same ticker+type (common AI extraction error)
function deduplicateOperations(ops: Array<{ ativo: string; tipo: string; quantidade: number; preco_unitario: number; valor_total: number }>): typeof ops {
  const seen = new Map<string, typeof ops[0]>();
  const result: typeof ops = [];
  
  for (const op of ops) {
    const key = `${op.ativo}|${op.tipo}|${op.preco_unitario}`;
    const existing = seen.get(key);
    
    if (existing) {
      // Same ticker, same type, same price = likely duplicate from AI
      console.warn(`DUPLICATE DETECTED: ${op.ativo} ${op.tipo} @ ${op.preco_unitario} - merging quantities`);
      // Keep the one with higher quantity (AI sometimes splits one line into two)
      if (op.quantidade > existing.quantidade) {
        seen.set(key, op);
        const idx = result.indexOf(existing);
        if (idx >= 0) result[idx] = op;
      }
    } else {
      // Different price = legitimate separate operations (e.g. fractional + standard lot)
      seen.set(key, op);
      result.push(op);
    }
  }
  
  if (result.length < ops.length) {
    console.log(`Dedup: ${ops.length} ops -> ${result.length} ops (removed ${ops.length - result.length} duplicates)`);
  }
  
  return result;
}

// Sanitize any PII that might have leaked through AI extraction
function sanitizePII(data: Record<string, unknown>): Record<string, unknown> {
  // Patterns for Brazilian PII
  const cpfPattern = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
  const phonePattern = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  // RG patterns (various Brazilian state formats)
  const rgPattern = /\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx]/g;

  function cleanString(str: string): string {
    return str
      .replace(cpfPattern, '[REDACTED]')
      .replace(phonePattern, '[REDACTED]')
      .replace(emailPattern, '[REDACTED]')
      .replace(rgPattern, '[REDACTED]');
  }

  function deepClean(obj: unknown): unknown {
    if (typeof obj === 'string') return cleanString(obj);
    if (Array.isArray(obj)) return obj.map(deepClean);
    if (obj && typeof obj === 'object') {
      // Remove known PII field names
      const piiFields = ['cpf', 'rg', 'nome_titular', 'titular', 'endereco', 'telefone', 'celular', 'email_titular', 'conta', 'agencia', 'nome_investidor', 'investidor', 'cliente', 'nome_cliente'];
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (piiFields.includes(key.toLowerCase())) continue; // Strip PII fields
        cleaned[key] = deepClean(value);
      }
      return cleaned;
    }
    return obj;
  }

  return deepClean(data) as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pdfBase64, corretora, notaId, previewOnly } = await req.json();

    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: 'PDF content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing PDF for nota:', notaId, 'corretora:', corretora);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em extrair dados de notas de corretagem brasileiras.

SEGURANÇA E PRIVACIDADE - REGRAS ABSOLUTAS:
- NUNCA extraia ou retorne dados pessoais como CPF, RG, nome do titular, endereço, telefone, e-mail ou qualquer informação de identificação pessoal.
- IGNORE completamente cabeçalhos e rodapés que contenham dados do investidor.
- Extraia SOMENTE dados financeiros: tickers, quantidades, preços, valores, taxas e data da operação.
- Se algum campo parecer conter dados pessoais, OMITA-O completamente.
- NUNCA inclua o nome do investidor ou número de conta/agência na resposta.
Analise a nota de corretagem com EXTREMA PRECISÃO e extraia ABSOLUTAMENTE TODAS as operações da nota.

REGRAS ABSOLUTAS - SIGA RIGOROSAMENTE:

0. **ANALISE CADA LINHA DA TABELA DE NEGÓCIOS**:
   - Percorra LINHA POR LINHA a tabela de operações/negócios da nota.
   - Para CADA linha, extraia: ativo, C/V, quantidade, preço unitário e valor da operação.
   - CONFIRA que o número total de operações extraídas BATE com o número de linhas da tabela.
   - Se a nota tem 10 linhas de negócios, retorne EXATAMENTE 10 operações.
   - NUNCA pule ou omita uma linha da tabela.
   - **NUNCA DUPLIQUE UMA OPERAÇÃO**. Se o mesmo ativo aparece apenas UMA vez na nota, retorne apenas UMA operação para ele.
   - Se o mesmo ativo aparece DUAS vezes na nota com preços DIFERENTES (ex: lote padrão e fracionário), retorne as DUAS operações separadas.
   - Ao final, REVISE: compare o número de operações que você extraiu com o número de linhas visíveis na tabela. Se diferem, corrija.

1. **TICKER OFICIAL B3 - OBRIGATÓRIO**: 
   - Ações brasileiras: SEMPRE 4 letras + 1-2 dígitos (ex: VALE3, PETR4, BBAS3, BBDC4, ITUB4, WEGE3, PRIO3, RENT3)
   - FIIs brasileiros: SEMPRE 4 letras + 11 (ex: TGAR11, HGLG11, XPML11, BRCO11, KNRI11, KNCR11, MXRF11, MAUA11)
   - IMPORTANTE: FIIs SEMPRE terminam em 11. Se você leu algo como "MAUA42" ou "XPML12", está errado. FIIs são XXXX11.
   - Mudanças recentes: CCR→MOTV3, GOL→GOLL54, AZUL→AZUL54, ALIANSCE SONAE→ALOS3
   - NUNCA use o nome por extenso como ticker. Se a nota diz "PETROBRAS PN", retorne "PETR4".
   - Se a nota diz "ELETROBRAS" sem especificar ON/PN, retorne "ELET6" (PN é o mais negociado).
   - Se a nota diz "ELETROBRAS ON", retorne "ELET3". Se diz "ELETROBRAS PN" ou "ELETROBRAS PNB", retorne "ELET6".
   - Se a nota diz "UNIPAR" retorne "UNIP6". Se diz "PETRORIO" retorne "PRIO3".
   - Se a nota diz "BB SEGURIDADE" retorne "BBSE3". Se diz "VAMOS" retorne "VAMO3".
   - Se a nota diz "FII HGLG" ou "CSHG LOGISTICA" retorne "HGLG11".
   - Se a nota diz "FII BRESCO" retorne "BRCO11". Se diz "GUARDIAN" retorne "GARE11".
   - Se a nota diz "MAUA" ou "FII MAUA" ou "MAUA CAPITAL" retorne "MCCI11" (NÃO MAUA11! O FII mais comum é MCCI11).
   - Se a nota diz "WIZ" ou "WIZ CO" retorne "WIZC3".
   - Se a nota diz "ENGIE" ou "ENGIE BRASIL" retorne "EGIE3" (NÃO confundir com ENERGISA=ENGI11).
    - Ações US: Use ticker direto (ORCL, GOOG, AMZN, IVV, SPY, etc.)
    - **MOEDA**: Mantenha os valores na moeda ORIGINAL da nota. Notas brasileiras têm valores em R$ (reais). Notas internacionais têm valores em US$ (dólares). NÃO converta entre moedas. Os preços e valores devem ser EXATAMENTE como aparecem na nota.

2. **NÃO INVENTE OPERAÇÕES**: Extraia SOMENTE os ativos que aparecem EXPLICITAMENTE na nota. NUNCA adicione ativos que não estão na nota.

3. **QUANTIDADES E MERCADO FRACIONÁRIO**: 
   - Leia o número EXATO da coluna "Quantidade". Não arredonde, não altere.
   - No mercado fracionário, as quantidades podem ser MENORES que o lote padrão (ex: 1, 5, 13, 47 ações em vez de 100).
   - Se o ticker na nota terminar com "F" (ex: PETR4F, VALE3F, BBAS3F), isso indica mercado fracionário. REMOVA o "F" do ticker e use o ticker padrão (PETR4, VALE3, BBAS3), mas MANTENHA a quantidade exata.
   - Operações fracionárias são tão válidas quanto operações em lote padrão. NUNCA ignore ou pule operações fracionárias.
   - Se houver operações do mesmo ativo no lote padrão E no fracionário na mesma nota, retorne AMBAS como operações separadas.

4. **PREÇO UNITÁRIO**: O valor da coluna "Preço/Ajuste" ou "Preço". É o preço por unidade SEM taxas.

5. **VALOR DA OPERAÇÃO**: Quantidade × Preço unitário. Coluna "Valor Operação" ou "Valor Bruto".

6. **TAXAS E CUSTOS - MUITO IMPORTANTE**:
   - Identifique TODOS os custos: corretagem, emolumentos, taxa de liquidação, taxa de registro, ISS, IRRF, taxa ANA, taxa de custódia.
   - Some TODOS esses valores no campo "taxas".
   - Os custos aparecem no rodapé/resumo: "Resumo dos Negócios", "Resumo Financeiro", "Clearing", "Custos Operacionais".
   - NÃO deixe taxas como 0 se existirem custos. Verifique CADA seção da nota.

7. **C/V**: "C" para Compra, "V" para Venda. Leia da coluna "C/V" ou "Negócio".

8. **SE NÃO SOUBER O TICKER**: Retorne o nome EXATO como aparece na nota. O sistema fará o mapeamento. NUNCA invente um ticker.

Retorne APENAS um JSON válido:
{
  "data_operacao": "YYYY-MM-DD",
  "operacoes": [
    {
      "ativo": "TICKER_B3",
      "tipo": "C" ou "V",
      "quantidade": número,
      "preco_unitario": número decimal,
      "valor_total": número decimal
    }
  ],
  "taxas": número decimal (SOMA de TODOS os custos),
  "taxas_detalhadas": {
    "taxa_liquidacao": número ou 0,
    "emolumentos": número ou 0,
    "corretagem": número ou 0,
    "iss": número ou 0,
    "irrf": número ou 0,
    "taxa_registro": número ou 0,
    "taxa_ana": número ou 0,
    "taxa_custodia": número ou 0,
    "outras": número ou 0
  },
  "valor_total_compras": número decimal,
  "valor_total_vendas": número decimal
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extraia os dados desta nota de corretagem da ${corretora}. 
ATENÇÃO:
- Extraia SOMENTE os ativos que realmente aparecem na nota, não invente nenhum
- Use tickers oficiais da B3 (4 letras + 1-2 dígitos)
- Identifique TODAS as taxas e custos e some no campo taxas
- Se não souber o ticker, retorne o nome como está na nota`
              },
              {
                type: "image_url",
                image_url: {
                  url: pdfBase64.startsWith('data:') ? pdfBase64 : `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    // Log only operation count, never raw content (PII protection)
    console.log('AI response received, length:', content?.length || 0);

    if (!content) {
      throw new Error('No response from AI');
    }

    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response');
      return new Response(JSON.stringify({ 
        error: 'Falha ao interpretar dados do PDF. Tente enviar uma imagem mais nítida.'
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize any PII that may have leaked from the AI extraction
    extractedData = sanitizePII(extractedData);

    // Post-process: resolve all tickers using our mapping
    if (extractedData.operacoes) {
      for (const op of extractedData.operacoes) {
        if (op.ativo) {
          const resolved = resolveTickerFromName(op.ativo);
          if (resolved !== op.ativo) {
            console.log(`Ticker resolved: "${op.ativo}" -> "${resolved}"`);
          }
          op.ativo = resolved;
        }
      }
      
      // Deduplicate operations (AI sometimes returns the same line twice)
      extractedData.operacoes = deduplicateOperations(extractedData.operacoes);
    }

    // ── Price validation: compare extracted prices with historical quotes ──
    const priceWarnings: string[] = [];
    if (extractedData.operacoes && extractedData.data_operacao) {
      const uniqueTickers = [...new Set(extractedData.operacoes.map((op: { ativo: string }) => op.ativo))];
      
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        
        const quoteResponse = await fetch(`${supabaseUrl}/functions/v1/get-stock-quotes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ tickers: uniqueTickers, date: extractedData.data_operacao }),
        });
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          const quotes = quoteData.quotes || {};
          
          for (const op of extractedData.operacoes) {
            const historicalQuote = quotes[op.ativo];
            if (historicalQuote && op.preco_unitario) {
              const historicalPrice = historicalQuote.price;
              const extractedPrice = op.preco_unitario;
              const diff = Math.abs(extractedPrice - historicalPrice);
              const diffPercent = (diff / historicalPrice) * 100;
              
              // Flag if price differs by more than 5%
              if (diffPercent > 5) {
                const warning = `${op.ativo}: preço extraído ${extractedPrice.toFixed(2)} vs cotação histórica ${historicalPrice.toFixed(2)} na data ${extractedData.data_operacao} (diferença de ${diffPercent.toFixed(1)}%)`;
                priceWarnings.push(warning);
                console.warn(`PRICE MISMATCH: ${warning}`);
              } else {
                console.log(`Price OK for ${op.ativo}: extracted=${extractedPrice.toFixed(2)}, historical=${historicalPrice.toFixed(2)} (diff ${diffPercent.toFixed(1)}%)`);
              }
            }
          }
        }
      } catch (priceCheckError) {
        console.error('Error checking historical prices:', priceCheckError);
      }
    }
    
    // Add warnings to extracted data
    if (priceWarnings.length > 0) {
      extractedData.priceWarnings = priceWarnings;
    }

    // If preview mode, just return extracted data without saving
    if (previewOnly) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: extractedData,
        preview: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update nota with extracted data
    if (notaId && extractedData) {
      const updateData: Record<string, unknown> = {};
      
      if (extractedData.data_operacao) {
        updateData.data_operacao = extractedData.data_operacao;
      }
      if (extractedData.taxas !== null && extractedData.taxas !== undefined) {
        updateData.taxas = extractedData.taxas;
      }
      if (extractedData.taxas_detalhadas) {
        updateData.taxas_detalhadas = extractedData.taxas_detalhadas;
      }
      if (extractedData.valor_total_compras !== null && extractedData.valor_total_compras !== undefined) {
        updateData.valor_compras = extractedData.valor_total_compras;
      }
      if (extractedData.valor_total_vendas !== null && extractedData.valor_total_vendas !== undefined) {
        updateData.valor_vendas = extractedData.valor_total_vendas;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('notas_corretagem')
          .update(updateData)
          .eq('id', notaId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating nota:', updateError);
        }
      }

      // Insert operations with proportional fee distribution across ALL operations
      if (extractedData.operacoes && extractedData.operacoes.length > 0) {
        const validOps = extractedData.operacoes
          .filter((op: { ativo?: string }) => op.ativo);

        const totalTaxas = extractedData.taxas || 0;

        // Calculate total financial value of ALL operations for proportional distribution
        const totalValorOps = validOps.reduce((acc: number, op: { valor_total?: number; quantidade?: number; preco_unitario?: number }) => {
          return acc + (op.valor_total || (op.quantidade || 0) * (op.preco_unitario || 0));
        }, 0);

        const operacoesToInsert = validOps.map((op: { ativo: string; tipo: string; quantidade: number; preco_unitario: number; valor_total: number }) => {
          const qtd = op.quantidade || 0;
          const valorBruto = op.valor_total || (qtd * (op.preco_unitario || 0));
          const isCompra = op.tipo === 'C';

          // Distribute fees proportionally to ALL operations (buy operations get fees added to cost)
          let valorComTaxas = valorBruto;
          if (isCompra && totalValorOps > 0 && totalTaxas > 0) {
            const proporcao = valorBruto / totalValorOps;
            valorComTaxas = valorBruto + (totalTaxas * proporcao);
          }

          const precoMedioComTaxas = qtd > 0 ? valorComTaxas / qtd : (op.preco_unitario || 0);

          return {
            user_id: user.id,
            nota_id: notaId,
            ativo: op.ativo.toUpperCase(),
            tipo: op.tipo === 'C' || op.tipo === 'V' ? op.tipo : 'C',
            quantidade: parseFloat(qtd.toFixed(8)),
            preco_unitario: parseFloat(precoMedioComTaxas.toFixed(6)),
            valor_total: parseFloat(valorComTaxas.toFixed(2)),
          };
        });

        if (operacoesToInsert.length > 0) {
          console.log(`Inserting ${operacoesToInsert.length} operations for nota ${notaId}`);
          
          const { error: insertError } = await supabase
            .from('operacoes')
            .insert(operacoesToInsert);

          if (insertError) {
            console.error('Error inserting operations:', insertError);
          } else {
            console.log(`Inserted ${operacoesToInsert.length} operations. Total taxas distributed: ${totalTaxas}`);
            
            // ALWAYS sync ALL users' tickers after inserting new operations
            try {
              const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-ticker-changes`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({}), // Empty = sync ALL users
              });
              const syncResult = await syncResponse.json();
              console.log('Ticker sync result (ALL users):', syncResult);
            } catch (syncError) {
              console.error('Error syncing tickers:', syncError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process PDF' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
