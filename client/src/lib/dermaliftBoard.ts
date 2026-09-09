import type jsPDF from "jspdf";
import { CORMORANT_LIGHT_B64, CORMORANT_REGULAR_B64 } from "./fonts/cormorant";

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

const FUNDO: RGB = [246, 238, 235];
const BRONZE: RGB = [127, 97, 67];
const TITULO: RGB = [45, 42, 38];
const SUBTITULO: RGB = [122, 118, 114];
const CONCEITO: RGB = [105, 101, 98];
const ROTULO: RGB = [150, 146, 143];
const ITEM: RGB = [88, 85, 82];
const RODAPE: RGB = [125, 121, 118];
const FIO: RGB = [223, 214, 208];

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
  /** Cor do algarismo — cada coluna tem o seu tom. */
  cor: RGB;
  /** Arquivo do rosto-base, servido de /public. */
  imagem: string;
  /**
   * Profundidade do ponto luminoso na miniatura da pele, de 0 (superfície)
   * a 1 (subcutâneo). É o que comunica que uma etapa não substitui a outra.
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
    cor: [151, 109, 112],
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
    cor: [162, 139, 115],
    imagem: "/dermalift/rosto-sculpt.jpg",
    profundidade: 0.63,
  },
  {
    key: "beauty",
    numero: "03",
    titulo: "BEAUTY",
    subtitulo: "HARMONIA",
    conceito: "Refinar detalhes que harmonizam e valorizam seus traços naturais.",
    cor: [153, 117, 117],
    imagem: "/dermalift/rosto-beauty.jpg",
    profundidade: 0.4,
  },
  {
    key: "skin",
    numero: "04",
    titulo: "SKIN",
    subtitulo: "QUALIDADE DA PELE",
    conceito: "Melhorar a qualidade da pele, textura, viço e luminosidade.",
    cor: [158, 131, 107],
    imagem: "/dermalift/rosto-skin.jpg",
    profundidade: 0.12,
  },
];

/* -------------------------------------------------------------------------- */
/* Grade vertical — todos os Y são fixos                                        */
/* -------------------------------------------------------------------------- */

const MARGEM = 13;
const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const LARGURA_COLUNA = LARGURA_UTIL / 4;

const Y = {
  monograma: 13,
  alturaMonograma: 14,
  clinica: 34,
  especialidade: 38.5,

  projetoDe: 47,
  dermalift: 59.5,
  rejuvenescimento: 65.5,
  ornamentoTopo: 72,
  paciente: 78.5,

  numero: 91,
  titulo: 99,
  subtitulo: 103.5,

  rostoTopo: 107,
  rostoAltura: 62,

  conceito: 175,

  ornamentoPilar: 189,
  seuPlano: 195,
  planoTopo: 201,
  alturaPlano: 22,

  peleTopo: 227,
  peleAltura: 26,

  rodape: 280,
};

/** Extremos do fio vertical que separa as colunas. */
const FIO_TOPO = 85;
const FIO_BASE = 258;

/** Monograma da clínica, servido de /public. */
const MONOGRAMA = "/dermalift/monograma-ft.jpg";

/* -------------------------------------------------------------------------- */
/* Utilidades de texto                                                          */
/* -------------------------------------------------------------------------- */

const SERIF = "Cormorant";

/** Registra a fonte serifada no documento. Idempotente. */
export function registrarFontes(doc: jsPDF): void {
  const jaTem = (doc.getFontList() as Record<string, string[]>)[SERIF];
  if (jaTem) return;
  doc.addFileToVFS("Cormorant-Light.ttf", CORMORANT_LIGHT_B64);
  doc.addFont("Cormorant-Light.ttf", SERIF, "normal");
  doc.addFileToVFS("Cormorant-Regular.ttf", CORMORANT_REGULAR_B64);
  doc.addFont("Cormorant-Regular.ttf", SERIF, "bold");
}

interface OpcoesTexto {
  fonte?: string;
  estilo?: "normal" | "bold";
  tamanho: number;
  cor: RGB;
  /** Espaço extra entre caracteres, em mm. É o que dá o ar de alta-costura. */
  espacamento?: number;
}

/** Largura real de um texto, já contando o espaçamento entre letras. */
function larguraDe(doc: jsPDF, texto: string, espacamento: number): number {
  const base = doc.getTextWidth(texto);
  return base + Math.max(0, texto.length - 1) * espacamento;
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

/**
 * Nome da paciente, centralizado e bem espaçado.
 *
 * Nomes longos são comuns; em vez de deixar estourar a margem, reduzimos
 * primeiro o espaçamento entre letras (que é generoso) e só depois o corpo.
 */
function desenharNome(doc: jsPDF, nome: string, xCentro: number, y: number): void {
  if (!nome) return;
  const disponivel = LARGURA_UTIL - 8;

  const tentativas = [
    { tamanho: 14, espacamento: 2.8 },
    { tamanho: 14, espacamento: 1.9 },
    { tamanho: 12.5, espacamento: 1.4 },
    { tamanho: 11, espacamento: 1 },
    { tamanho: 9.5, espacamento: 0.6 },
  ];

  for (let i = 0; i < tentativas.length; i++) {
    const { tamanho, espacamento } = tentativas[i];
    const opcoes: OpcoesTexto = {
      fonte: SERIF,
      estilo: "bold",
      tamanho,
      cor: TITULO,
      espacamento,
    };
    aplicar(doc, opcoes);
    const cabe = larguraDe(doc, nome, espacamento) <= disponivel;
    if (cabe || i === tentativas.length - 1) {
      centralizado(doc, nome, xCentro, y, opcoes);
      return;
    }
  }
}

/** Losango minúsculo usado como ornamento entre as seções. */
function ornamento(doc: jsPDF, x: number, y: number, raio: number, cor: RGB): void {
  doc.setFillColor(cor[0], cor[1], cor[2]);
  doc.triangle(x, y - raio, x - raio * 0.62, y, x, y + raio, "F");
  doc.triangle(x, y - raio, x + raio * 0.62, y, x, y + raio, "F");
}

/* -------------------------------------------------------------------------- */
/* Miniatura do corte da pele                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Corte transversal da pele com um ponto luminoso na profundidade daquele
 * pilar. Desenhado em vetor: imprime nítido em qualquer tamanho e o ponto
 * pode ser posicionado com precisão.
 */
function desenharPele(
  doc: jsPDF,
  x: number,
  y: number,
  largura: number,
  altura: number,
  profundidade: number,
  cor: RGB
): void {
  const FIM_EPIDERME = 0.12;
  const FIM_DERME = 0.58;

  const camadas: Array<{ ate: number; cor: RGB }> = [
    { ate: FIM_EPIDERME, cor: [238, 214, 202] }, // epiderme
    { ate: FIM_DERME, cor: [216, 172, 158] }, // derme
    { ate: 1, cor: [237, 209, 195] }, // subcutâneo
  ];

  let inicio = 0;
  for (const camada of camadas) {
    doc.setFillColor(camada.cor[0], camada.cor[1], camada.cor[2]);
    doc.rect(x, y + altura * inicio, largura, altura * (camada.ate - inicio), "F");
    inicio = camada.ate;
  }

  // Estrato córneo: fio mais claro rente à superfície
  doc.setFillColor(247, 231, 220);
  doc.rect(x, y, largura, altura * 0.03, "F");

  // Fibras da derme
  doc.setDrawColor(205, 156, 141);
  doc.setLineWidth(0.08);
  for (let i = 1; i <= 3; i++) {
    const fy = y + altura * (FIM_EPIDERME + ((FIM_DERME - FIM_EPIDERME) * i) / 4);
    doc.line(x + largura * 0.08, fy, x + largura * 0.92, fy);
  }

  // Lóbulos de gordura no subcutâneo — leem como tecido, não como gráfico
  doc.setDrawColor(219, 181, 166);
  doc.setLineWidth(0.11);
  const raio = altura * 0.062;
  for (let linha = 0; ; linha++) {
    const cy = y + altura * FIM_DERME + raio * 1.15 + linha * raio * 1.9;
    if (cy + raio > y + altura - raio * 0.15) break;
    const deslocamento = linha % 2 ? raio : 0;
    for (let cx = x + raio * 1.1 + deslocamento; cx < x + largura - raio * 0.6; cx += raio * 2.15) {
      doc.circle(cx, cy, raio, "S");
    }
  }

  // Linhas divisórias entre as camadas
  doc.setDrawColor(203, 162, 147);
  doc.setLineWidth(0.1);
  doc.line(x, y + altura * FIM_EPIDERME, x + largura, y + altura * FIM_EPIDERME);
  doc.line(x, y + altura * FIM_DERME, x + largura, y + altura * FIM_DERME);

  // Contorno externo do bloco
  doc.setDrawColor(198, 168, 155);
  doc.setLineWidth(0.22);
  doc.rect(x, y, largura, altura, "S");

  /* --------------------------------------------------- ponto luminoso --- */

  const xLuz = x + largura * 0.5;
  const yLuz = y + altura * profundidade;

  // Trajeto até a profundidade tratada
  doc.setDrawColor(255, 252, 244);
  doc.setLineWidth(0.45);
  doc.line(xLuz, y, xLuz, yLuz);
  doc.setDrawColor(cor[0], cor[1], cor[2]);
  doc.setLineWidth(0.15);
  doc.line(xLuz, y, xLuz, yLuz);

  // Halo: círculos concêntricos com opacidade decrescente simulam o brilho
  const anyDoc = doc as unknown as {
    setGState: (g: unknown) => void;
    GState: new (o: Record<string, number>) => unknown;
  };
  const temGState = typeof anyDoc.setGState === "function";

  const halos = [
    { r: altura * 0.16, opacidade: 0.18 },
    { r: altura * 0.1, opacidade: 0.32 },
    { r: altura * 0.055, opacidade: 0.6 },
  ];
  for (const halo of halos) {
    if (temGState) anyDoc.setGState(new anyDoc.GState({ opacity: halo.opacidade }));
    doc.setFillColor(255, 246, 224);
    doc.circle(xLuz, yLuz, halo.r, "F");
  }
  if (temGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));

  // Núcleo, no tom do pilar
  doc.setFillColor(cor[0], cor[1], cor[2]);
  doc.circle(xLuz, yLuz, altura * 0.022, "F");
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

  const [monograma, ...rostos] = await Promise.all([
    carregarImagem(MONOGRAMA),
    ...COLUNAS.map((c) => carregarImagem(c.imagem)),
  ]);

  /* ------------------------------------------------------------- fundo --- */

  doc.setFillColor(FUNDO[0], FUNDO[1], FUNDO[2]);
  doc.rect(0, 0, LARGURA_PAGINA, ALTURA_PAGINA, "F");

  const centro = LARGURA_PAGINA / 2;

  /* ---------------------------------------------------------- cabeçalho --- */

  if (monograma) {
    const altura = Y.alturaMonograma;
    const largura = (altura * monograma.width) / monograma.height;
    doc.addImage(monograma, "JPEG", centro - largura / 2, Y.monograma, largura, altura);
  }

  centralizado(doc, "FLÁVIA THEREZA", centro, Y.clinica, {
    fonte: SERIF,
    tamanho: 18,
    cor: BRONZE,
    espacamento: 1.5,
  });
  centralizado(doc, "DERMATOLOGIA", centro, Y.especialidade, {
    tamanho: 6,
    cor: SUBTITULO,
    espacamento: 1.6,
  });

  centralizado(doc, "PROJETO DE", centro, Y.projetoDe, {
    tamanho: 7.5,
    cor: TITULO,
    espacamento: 2.6,
  });

  centralizado(doc, "DERMALIFT", centro, Y.dermalift, {
    fonte: SERIF,
    tamanho: 40,
    cor: BRONZE,
    espacamento: 3.4,
  });

  centralizado(doc, "PROJETO DE REJUVENESCIMENTO PERSONALIZADO", centro, Y.rejuvenescimento, {
    tamanho: 6.5,
    cor: TITULO,
    espacamento: 1.5,
  });

  ornamento(doc, centro, Y.ornamentoTopo, 1.5, BRONZE);

  desenharNome(doc, (dados.patientName || "").toUpperCase(), centro, Y.paciente);

  /* ------------------------------------------------------- fios da grade --- */

  doc.setDrawColor(FIO[0], FIO[1], FIO[2]);
  doc.setLineWidth(0.2);
  for (let i = 1; i < 4; i++) {
    const x = MARGEM + LARGURA_COLUNA * i;
    doc.line(x, FIO_TOPO, x, FIO_BASE);
  }

  /* ----------------------------------------------------------- colunas --- */

  COLUNAS.forEach((coluna, indice) => {
    const xInicio = MARGEM + LARGURA_COLUNA * indice;
    const xCentro = xInicio + LARGURA_COLUNA / 2;
    const larguraTexto = LARGURA_COLUNA - 9;

    /* número */
    centralizado(doc, coluna.numero, xCentro, Y.numero, {
      fonte: SERIF,
      tamanho: 26,
      cor: coluna.cor,
      espacamento: 0.8,
    });

    /* título e subtítulo */
    centralizado(doc, coluna.titulo, xCentro, Y.titulo, {
      tamanho: 10,
      cor: TITULO,
      espacamento: 1.5,
    });
    centralizado(doc, coluna.subtitulo, xCentro, Y.subtitulo, {
      tamanho: 5.6,
      cor: SUBTITULO,
      espacamento: 0.9,
    });

    /* rosto — encostado na base da banda, para os quatro se alinharem */
    const rosto = rostos[indice];
    if (rosto) {
      const proporcao = rosto.width / rosto.height;
      const altura = Y.rostoAltura;
      const largura = altura * proporcao;
      // Os arquivos já vêm achatados sobre a cor de fundo da página, sem canal
      // alfa: em JPEG o documento fica ~10x mais leve para enviar à paciente.
      doc.addImage(
        rosto,
        "JPEG",
        xCentro - largura / 2,
        Y.rostoTopo,
        largura,
        altura
      );
    }

    /* frase conceitual */
    aplicar(doc, { tamanho: 7, cor: CONCEITO });
    const linhas = doc.splitTextToSize(coluna.conceito, larguraTexto) as string[];
    linhas.forEach((linha, i) => {
      centralizado(doc, linha, xCentro, Y.conceito + i * 3.7, {
        tamanho: 7,
        cor: CONCEITO,
      });
    });

    /* ornamento + rótulo */
    ornamento(doc, xCentro, Y.ornamentoPilar, 1.2, coluna.cor);

    centralizado(doc, "SEU PLANO", xCentro, Y.seuPlano, {
      tamanho: 5.8,
      cor: ROTULO,
      espacamento: 1.3,
    });

    /* procedimentos — a altura da banda é fixa; o texto é que se ajusta */
    const itens = dados.plano[coluna.key] ?? [];
    if (itens.length) {
      desenharPlano(doc, itens, xInicio + 4.5, Y.planoTopo, LARGURA_COLUNA - 9, Y.alturaPlano);
    }

    /* miniatura da pele */
    const larguraPele = LARGURA_COLUNA * 0.56;
    desenharPele(
      doc,
      xCentro - larguraPele / 2,
      Y.peleTopo,
      larguraPele,
      Y.peleAltura,
      coluna.profundidade,
      coluna.cor
    );
  });

  /* ------------------------------------------------------------ rodapé --- */

  // Fio de largura total interrompido pelo losango, como no modelo.
  const yFio = Y.rodape - 8;
  const vao = 5;
  doc.setDrawColor(FIO[0], FIO[1], FIO[2]);
  doc.setLineWidth(0.2);
  doc.line(MARGEM, yFio, centro - vao, yFio);
  doc.line(centro + vao, yFio, LARGURA_PAGINA - MARGEM, yFio);

  ornamento(doc, centro, yFio, 1.4, BRONZE);
  centralizado(
    doc,
    "UM PROJETO. DIFERENTES CAMADAS. UM RESULTADO CONSTRUÍDO POR INTEIRO.",
    centro,
    Y.rodape,
    { tamanho: 6.4, cor: RODAPE, espacamento: 1.15 }
  );
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
  x: number,
  y: number,
  largura: number,
  alturaMaxima: number
): void {
  const escalas = [
    { tamanho: 7.2, entrelinha: 3.9 },
    { tamanho: 6.6, entrelinha: 3.5 },
    { tamanho: 6.1, entrelinha: 3.15 },
    { tamanho: 5.6, entrelinha: 2.85 },
  ];

  for (let i = 0; i < escalas.length; i++) {
    const { tamanho, entrelinha } = escalas[i];
    aplicar(doc, { tamanho, cor: ITEM });

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
      doc.text(linha, x, y + indice * entrelinha);
    });
    return;
  }
}
