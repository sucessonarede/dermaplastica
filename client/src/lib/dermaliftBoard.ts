import type jsPDF from "jspdf";
import {
  CORMORANT_LIGHT_B64,
  CORMORANT_REGULAR_B64,
  CORMORANT_SEMIBOLD_B64,
} from "./fonts/cormorant";

/**
 * Página 1 do Projeto Dermalift — a prancha visual.
 *
 * Não é o orçamento: é o mapa do planejamento facial da paciente, mostrando
 * que o Dermalift atua de forma complementar em quatro necessidades, regiões
 * e profundidades diferentes. O financeiro fica na página seguinte.
 *
 * O layout é uma grade rígida: todas as bandas horizontais têm Y fixo, para
 * que as quatro colunas permaneçam alinhadas independentemente de quantos
 * procedimentos cada pilar tenha.
 */

type RGB = [number, number, number];

/* -------------------------------------------------------------------------- */
/* Paleta — amostrada da arte de referência                                    */
/* -------------------------------------------------------------------------- */

const BRANCO: RGB = [255, 255, 255];
const OURO: RGB = [180, 147, 89];
const OURO_CLARO: RGB = [218, 201, 172];
const TINTA: RGB = [74, 56, 44];
const TINTA_NOME: RGB = [85, 67, 55];
const CINZA: RGB = [118, 103, 93];
const CONCEITO: RGB = [107, 92, 83];
const ROTULO: RGB = [97, 79, 70];
const ITEM: RGB = [56, 51, 52];

/* -------------------------------------------------------------------------- */
/* Os quatro pilares                                                            */
/* -------------------------------------------------------------------------- */

/** Chave do protocolo no banco → coluna da prancha. */
export const PILAR_DA_COLUNA = {
  sustentacao: "lift",
  estruturacao: "sculpt",
  embelezamento: "beauty",
  revitalizacao: "skin",
} as const;

export type ColunaKey = (typeof PILAR_DA_COLUNA)[keyof typeof PILAR_DA_COLUNA];

interface Coluna {
  key: ColunaKey;
  numero: string;
  titulo: string;
  subtitulo: string;
  conceito: string;
  /** Arquivo do rosto-base, servido de /public. */
  imagem: string;
  /**
   * Profundidade do ponto luminoso no corte da pele, de 0 (superfície) a 1
   * (subcutâneo). É o que comunica que uma etapa não substitui a outra.
   */
  profundidade: number;
}

const COLUNAS: Coluna[] = [
  {
    key: "lift",
    numero: "01",
    titulo: "LIFT",
    subtitulo: "SUSTENTAÇÃO",
    conceito:
      "Reposicionar e sustentar os tecidos, devolvendo firmeza e combatendo a flacidez.",
    imagem: "/dermalift/rosto-lift.jpg",
    profundidade: 0.87,
  },
  {
    key: "sculpt",
    numero: "02",
    titulo: "SCULPT",
    subtitulo: "ESTRUTURAÇÃO",
    conceito:
      "Recuperar contornos, proporções e pontos estruturais para devolver equilíbrio ao rosto.",
    imagem: "/dermalift/rosto-sculpt.jpg",
    profundidade: 0.63,
  },
  {
    key: "beauty",
    numero: "03",
    titulo: "BEAUTY",
    subtitulo: "HARMONIA",
    conceito: "Refinar detalhes que harmonizam e valorizam seus traços naturais.",
    imagem: "/dermalift/rosto-beauty.jpg",
    profundidade: 0.4,
  },
  {
    key: "skin",
    numero: "04",
    titulo: "SKIN",
    subtitulo: "QUALIDADE DA PELE",
    conceito: "Melhorar a qualidade da pele, textura, viço e luminosidade.",
    imagem: "/dermalift/rosto-skin.jpg",
    profundidade: 0.12,
  },
];

/* -------------------------------------------------------------------------- */
/* Grade — medidas tiradas da arte de referência, em mm                        */
/* -------------------------------------------------------------------------- */

const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;

/** As colunas sangram de margem a margem: quatro faixas iguais. */
const LARGURA_COLUNA = LARGURA_PAGINA / 4;

const Y = {
  logo: 8,
  alturaLogo: 21.5,

  fioDuploA: 35.4,
  fioDuploB: 37.6,
  espessuraFio: 1.1,

  projeto: 51.2,
  dermalift: 63.6,
  rejuvenescimento: 69.6,
  barra: 74.3,
  alturaBarra: 1.1,
  larguraBarra: 26.4,
  nome: 85.2,

  numero: 100.5,
  titulo: 109.3,
  subtitulo: 114.5,

  rostoTopo: 124,
  rostoAltura: 63,

  conceito: 193.9,
  entrelinhaConceito: 3.3,

  ornamento: 204,
  alturaOrnamento: 3.7,

  seuPlano: 212,
  planoTopo: 217.5,
  alturaPlano: 21,

  pele: 242.9,
  ladoPele: 28.1,

  rodape: 288.2,
};

/** Extremos dos fios verticais que separam as colunas. */
const FIO_TOPO = 94.5;
const FIO_BASE = 274.4;

const LOGO = "/dermalift/logo-flavia.jpg";
const ORNAMENTO = "/dermalift/monograma-ft.jpg";

/* -------------------------------------------------------------------------- */
/* Utilidades de texto                                                          */
/* -------------------------------------------------------------------------- */

const SERIF = "Cormorant";

/** Registra a fonte serifada no documento. Idempotente. */
export function registrarFontes(doc: jsPDF): void {
  if ((doc.getFontList() as Record<string, string[]>)[SERIF]) return;
  doc.addFileToVFS("Cormorant-Light.ttf", CORMORANT_LIGHT_B64);
  doc.addFont("Cormorant-Light.ttf", SERIF, "normal");
  doc.addFileToVFS("Cormorant-Regular.ttf", CORMORANT_REGULAR_B64);
  doc.addFont("Cormorant-Regular.ttf", SERIF, "italic");
  doc.addFileToVFS("Cormorant-SemiBold.ttf", CORMORANT_SEMIBOLD_B64);
  doc.addFont("Cormorant-SemiBold.ttf", SERIF, "bold");
}

/** Peso intermediário da serifada, registrado no slot "italic" do jsPDF. */
const SERIF_MEDIO = "italic" as const;

interface OpcoesTexto {
  fonte?: string;
  estilo?: "normal" | "bold" | "italic";
  tamanho: number;
  cor: RGB;
  /** Espaço extra entre caracteres, em mm. É o que dá o ar de alta-costura. */
  espacamento?: number;
}

/** Largura real de um texto, já contando o espaçamento entre letras. */
function larguraDe(doc: jsPDF, texto: string, espacamento: number): number {
  return doc.getTextWidth(texto) + Math.max(0, texto.length - 1) * espacamento;
}

function aplicar(doc: jsPDF, o: OpcoesTexto): void {
  doc.setFont(o.fonte ?? "helvetica", o.estilo ?? "normal");
  doc.setFontSize(o.tamanho);
  doc.setTextColor(o.cor[0], o.cor[1], o.cor[2]);
}

/**
 * Escreve um texto centralizado com espaçamento entre letras. O jsPDF não
 * considera o charSpace ao alinhar, então centralizamos na mão.
 */
function centralizado(
  doc: jsPDF,
  texto: string,
  xCentro: number,
  y: number,
  o: OpcoesTexto
): void {
  aplicar(doc, o);
  const esp = o.espacamento ?? 0;
  const x = xCentro - larguraDe(doc, texto, esp) / 2;
  doc.text(texto, x, y, esp ? { charSpace: esp } : undefined);
}

/** Barra horizontal cheia. */
function barra(doc: jsPDF, x: number, y: number, largura: number, altura: number, cor: RGB) {
  doc.setFillColor(cor[0], cor[1], cor[2]);
  doc.rect(x, y, largura, altura, "F");
}

/* -------------------------------------------------------------------------- */
/* Corte da pele                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Corte transversal da pele com um ponto luminoso na profundidade daquele
 * pilar, dentro de um quadro de fio dourado. Desenhado em vetor: imprime
 * nítido em qualquer tamanho e o ponto fica exatamente onde deve.
 */
function desenharPele(
  doc: jsPDF,
  x: number,
  y: number,
  lado: number,
  profundidade: number
): void {
  const FIM_EPIDERME = 0.12;
  const FIM_DERME = 0.58;

  const camadas: Array<{ ate: number; cor: RGB }> = [
    { ate: FIM_EPIDERME, cor: [242, 224, 212] },
    { ate: FIM_DERME, cor: [226, 190, 175] },
    { ate: 1, cor: [243, 220, 206] },
  ];

  let inicio = 0;
  for (const camada of camadas) {
    doc.setFillColor(camada.cor[0], camada.cor[1], camada.cor[2]);
    doc.rect(x, y + lado * inicio, lado, lado * (camada.ate - inicio), "F");
    inicio = camada.ate;
  }

  // Estrato córneo
  doc.setFillColor(250, 239, 231);
  doc.rect(x, y, lado, lado * 0.028, "F");

  // Fibras da derme
  doc.setDrawColor(213, 170, 154);
  doc.setLineWidth(0.08);
  for (let i = 1; i <= 3; i++) {
    const fy = y + lado * (FIM_EPIDERME + ((FIM_DERME - FIM_EPIDERME) * i) / 4);
    doc.line(x + lado * 0.07, fy, x + lado * 0.93, fy);
  }

  // Lóbulos de gordura no subcutâneo — leem como tecido, não como gráfico
  doc.setDrawColor(226, 192, 176);
  doc.setLineWidth(0.11);
  const raio = lado * 0.058;
  for (let linha = 0; ; linha++) {
    const cy = y + lado * FIM_DERME + raio * 1.15 + linha * raio * 1.9;
    if (cy + raio > y + lado - raio * 0.15) break;
    const deslocamento = linha % 2 ? raio : 0;
    for (let cx = x + raio * 1.1 + deslocamento; cx < x + lado - raio * 0.6; cx += raio * 2.15) {
      doc.circle(cx, cy, raio, "S");
    }
  }

  // Divisórias entre camadas
  doc.setDrawColor(211, 166, 149);
  doc.setLineWidth(0.1);
  doc.line(x, y + lado * FIM_EPIDERME, x + lado, y + lado * FIM_EPIDERME);
  doc.line(x, y + lado * FIM_DERME, x + lado, y + lado * FIM_DERME);

  /* --------------------------------------------------- ponto luminoso --- */

  const xLuz = x + lado * 0.5;
  const yLuz = y + lado * profundidade;

  doc.setDrawColor(255, 253, 246);
  doc.setLineWidth(0.5);
  doc.line(xLuz, y, xLuz, yLuz);
  doc.setDrawColor(OURO[0], OURO[1], OURO[2]);
  doc.setLineWidth(0.16);
  doc.line(xLuz, y, xLuz, yLuz);

  const anyDoc = doc as unknown as {
    setGState: (g: unknown) => void;
    GState: new (o: Record<string, number>) => unknown;
  };
  const temGState = typeof anyDoc.setGState === "function";

  for (const halo of [
    { r: lado * 0.15, opacidade: 0.2 },
    { r: lado * 0.095, opacidade: 0.36 },
    { r: lado * 0.05, opacidade: 0.65 },
  ]) {
    if (temGState) anyDoc.setGState(new anyDoc.GState({ opacity: halo.opacidade }));
    doc.setFillColor(255, 247, 226);
    doc.circle(xLuz, yLuz, halo.r, "F");
  }
  if (temGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));

  doc.setFillColor(OURO[0], OURO[1], OURO[2]);
  doc.circle(xLuz, yLuz, lado * 0.021, "F");

  // Moldura dourada, por último, para fechar o quadro
  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.3);
  doc.rect(x, y, lado, lado, "S");
}

/* -------------------------------------------------------------------------- */
/* Carregamento das imagens                                                     */
/* -------------------------------------------------------------------------- */

function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* -------------------------------------------------------------------------- */
/* Desenho da prancha                                                           */
/* -------------------------------------------------------------------------- */

export interface DadosPrancha {
  patientName: string;
  /** Procedimentos escolhidos, por coluna. */
  plano: Partial<Record<ColunaKey, string[]>>;
}

export async function desenharPranchaDermalift(
  doc: jsPDF,
  dados: DadosPrancha
): Promise<void> {
  registrarFontes(doc);

  const [logo, ornamento, ...rostos] = await Promise.all([
    carregarImagem(LOGO),
    carregarImagem(ORNAMENTO),
    ...COLUNAS.map((c) => carregarImagem(c.imagem)),
  ]);

  const centro = LARGURA_PAGINA / 2;

  /* ------------------------------------------------------------- fundo --- */

  barra(doc, 0, 0, LARGURA_PAGINA, ALTURA_PAGINA, BRANCO);

  /* ---------------------------------------------------------- cabeçalho --- */

  // O logotipo já traz o monograma e a assinatura da clínica — nada de texto
  // composto aqui, para a marca chegar à paciente como foi desenhada.
  if (logo) {
    const altura = Y.alturaLogo;
    const largura = (altura * logo.width) / logo.height;
    doc.addImage(logo, "JPEG", centro - largura / 2, Y.logo, largura, altura);
  }

  // Fio duplo de sangria a sangria, fechando o cabeçalho da marca
  barra(doc, 0, Y.fioDuploA, LARGURA_PAGINA, Y.espessuraFio, OURO);
  barra(doc, 0, Y.fioDuploB, LARGURA_PAGINA, Y.espessuraFio, OURO);

  centralizado(doc, "PROJETO", centro, Y.projeto, {
    tamanho: 15,
    cor: TINTA,
    espacamento: 2.8,
  });

  centralizado(doc, "DERMALIFT", centro, Y.dermalift, {
    fonte: SERIF,
    tamanho: 37,
    cor: OURO,
    espacamento: 3.2,
  });

  centralizado(doc, "REJUVENESCIMENTO PERSONALIZADO", centro, Y.rejuvenescimento, {
    tamanho: 9,
    cor: CINZA,
    espacamento: 0.7,
  });

  barra(doc, centro - Y.larguraBarra / 2, Y.barra, Y.larguraBarra, Y.alturaBarra, OURO);

  desenharNome(doc, (dados.patientName || "").toUpperCase(), centro, Y.nome);

  /* ------------------------------------------------------- fios da grade --- */

  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.25);
  for (let i = 1; i < 4; i++) {
    const x = LARGURA_COLUNA * i;
    doc.line(x, FIO_TOPO, x, FIO_BASE);
  }

  /* ----------------------------------------------------------- colunas --- */

  COLUNAS.forEach((coluna, indice) => {
    const xInicio = LARGURA_COLUNA * indice;
    const xCentro = xInicio + LARGURA_COLUNA / 2;
    const larguraTexto = LARGURA_COLUNA - 12;

    centralizado(doc, coluna.numero, xCentro, Y.numero, {
      fonte: SERIF,
      tamanho: 23,
      cor: OURO,
      espacamento: 0.8,
    });

    centralizado(doc, coluna.titulo, xCentro, Y.titulo, {
      fonte: SERIF,
      estilo: "bold",
      tamanho: 23,
      cor: TINTA,
      espacamento: 0.5,
    });

    centralizado(doc, coluna.subtitulo, xCentro, Y.subtitulo, {
      tamanho: 8,
      cor: CINZA,
      espacamento: 0.35,
    });

    /* rosto — topo fixo, para os quatro se alinharem */
    const rosto = rostos[indice];
    if (rosto) {
      const altura = Y.rostoAltura;
      const largura = (altura * rosto.width) / rosto.height;
      doc.addImage(rosto, "JPEG", xCentro - largura / 2, Y.rostoTopo, largura, altura);
    }

    /* frase conceitual */
    aplicar(doc, { tamanho: 7.5, cor: CONCEITO });
    const linhas = doc.splitTextToSize(coluna.conceito, larguraTexto) as string[];
    linhas.forEach((linha, i) => {
      centralizado(doc, linha, xCentro, Y.conceito + i * Y.entrelinhaConceito, {
        tamanho: 7.5,
        cor: CONCEITO,
      });
    });

    /* monograma como ornamento de seção */
    if (ornamento) {
      const altura = Y.alturaOrnamento;
      const largura = (altura * ornamento.width) / ornamento.height;
      doc.addImage(ornamento, "JPEG", xCentro - largura / 2, Y.ornamento, largura, altura);
    }

    centralizado(doc, "SEU PLANO", xCentro, Y.seuPlano, {
      estilo: "bold",
      tamanho: 7,
      cor: ROTULO,
      espacamento: 0.9,
    });

    /* procedimentos — a altura da banda é fixa; o texto é que se ajusta */
    const itens = dados.plano[coluna.key] ?? [];
    if (itens.length) {
      desenharPlano(doc, itens, xCentro, Y.planoTopo, larguraTexto, Y.alturaPlano);
    }

    /* corte da pele */
    desenharPele(doc, xCentro - Y.ladoPele / 2, Y.pele, Y.ladoPele, coluna.profundidade);
  });

  /* ------------------------------------------------------------ rodapé --- */

  ajustarNaLargura(
    doc,
    "UM PROJETO. DIFERENTES CAMADAS. UM RESULTADO CONSTRUÍDO POR INTEIRO.",
    centro,
    Y.rodape,
    LARGURA_PAGINA - 26,
    { fonte: SERIF, estilo: "bold", tamanho: 13, cor: ROTULO, espacamento: 0.55 }
  );
}

/**
 * Escreve um texto centralizado encolhendo-o até caber em `disponivel`.
 *
 * Reduz primeiro o espaçamento entre letras — que é generoso e é o primeiro a
 * sobrar — e só depois o corpo, preservando o ar da composição.
 */
function ajustarNaLargura(
  doc: jsPDF,
  texto: string,
  xCentro: number,
  y: number,
  disponivel: number,
  base: OpcoesTexto
): void {
  if (!texto) return;
  const espBase = base.espacamento ?? 0;

  for (let passo = 0; passo < 12; passo++) {
    const fatorEsp = Math.max(0, 1 - passo * 0.22);
    const fatorCorpo = passo <= 4 ? 1 : 1 - (passo - 4) * 0.06;
    const opcoes: OpcoesTexto = {
      ...base,
      tamanho: base.tamanho * fatorCorpo,
      espacamento: espBase * fatorEsp,
    };
    aplicar(doc, opcoes);
    if (larguraDe(doc, texto, opcoes.espacamento ?? 0) <= disponivel || passo === 11) {
      centralizado(doc, texto, xCentro, y, opcoes);
      return;
    }
  }
}

/**
 * Nome da paciente, centralizado e bem espaçado.
 *
 * Nomes longos são comuns; em vez de deixar estourar a margem, reduzimos
 * primeiro o espaçamento entre letras (que é generoso) e só depois o corpo.
 */
function desenharNome(doc: jsPDF, nome: string, xCentro: number, y: number): void {
  if (!nome) return;
  const disponivel = LARGURA_PAGINA - 30;

  const tentativas = [
    { tamanho: 19, espacamento: 1.6 },
    { tamanho: 19, espacamento: 1 },
    { tamanho: 16, espacamento: 0.8 },
    { tamanho: 13.5, espacamento: 0.6 },
    { tamanho: 11.5, espacamento: 0.4 },
  ];

  for (let i = 0; i < tentativas.length; i++) {
    const { tamanho, espacamento } = tentativas[i];
    const opcoes: OpcoesTexto = {
      fonte: SERIF,
      estilo: SERIF_MEDIO,
      tamanho,
      cor: TINTA_NOME,
      espacamento,
    };
    aplicar(doc, opcoes);
    if (larguraDe(doc, nome, espacamento) <= disponivel || i === tentativas.length - 1) {
      centralizado(doc, nome, xCentro, y, opcoes);
      return;
    }
  }
}

/**
 * Escreve a lista de procedimentos dentro de uma caixa de altura fixa.
 *
 * A estética depende de as quatro colunas terminarem na mesma linha, então,
 * quando um pilar tem procedimentos demais, reduzimos corpo e entrelinha em
 * vez de deixar a coluna crescer.
 */
function desenharPlano(
  doc: jsPDF,
  itens: string[],
  xCentro: number,
  y: number,
  largura: number,
  alturaMaxima: number
): void {
  const escalas = [
    { tamanho: 9.5, entrelinha: 4.6 },
    { tamanho: 8.5, entrelinha: 4.1 },
    { tamanho: 7.5, entrelinha: 3.6 },
    { tamanho: 6.6, entrelinha: 3.2 },
  ];

  for (let i = 0; i < escalas.length; i++) {
    const { tamanho, entrelinha } = escalas[i];
    const opcoes: OpcoesTexto = { estilo: "bold", tamanho, cor: ITEM };
    aplicar(doc, opcoes);

    const linhas: string[] = [];
    for (const item of itens) {
      linhas.push(...(doc.splitTextToSize(item, largura) as string[]));
    }

    const cabe = linhas.length * entrelinha <= alturaMaxima;
    const ultima = i === escalas.length - 1;
    if (!cabe && !ultima) continue;

    const visiveis = cabe
      ? linhas
      : linhas.slice(0, Math.max(1, Math.floor(alturaMaxima / entrelinha)));

    visiveis.forEach((linha, indice) => {
      centralizado(doc, linha, xCentro, y + indice * entrelinha, opcoes);
    });
    return;
  }
}
