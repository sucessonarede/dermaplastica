import type jsPDF from "jspdf";
import {
  aplicar,
  ajustarNaLargura,
  barra,
  carregarImagem,
  centralizado,
  larguraDe,
  registrarFontes,
  CINZA,
  ITEM,
  OURO,
  OURO_CLARO,
  SERIF,
  SERIF_MEDIO,
  TINTA,
  type ColunaKey,
  type OpcoesTexto,
  type RGB,
} from "./dermaliftBoard";

/**
 * Página 2 do Projeto Dermalift — o investimento.
 *
 * Uma tabela de uma linha por procedimento, agrupada visualmente por pilar
 * através da tarja colorida à esquerda, e o fechamento comparando o valor dos
 * tratamentos avulsos com o valor do projeto.
 */

/* -------------------------------------------------------------------------- */
/* Grade — medidas tiradas da arte de referência, em mm                        */
/* -------------------------------------------------------------------------- */

const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const CENTRO = LARGURA_PAGINA / 2;

const ESCUDO = "/dermalift/escudo.jpg";
const ICONE_ROSTO = "/dermalift/rosto-icone.jpg";
const LOGO = "/dermalift/logo-flavia.jpg";
const MONOGRAMA = "/dermalift/monograma-ft.jpg";

/** Colunas da tabela: limites e centros. */
const COL = {
  tarja: 12.3,
  tarjaLargura: 2,
  esquerda: 14.3,
  pilarFim: 40.8,
  procedimentoFim: 89.9,
  entregaFim: 161.6,
  direita: 201.7,
};

const CENTRO_COL = {
  pilar: (COL.esquerda + COL.pilarFim) / 2,
  procedimento: (COL.pilarFim + COL.procedimentoFim) / 2,
  entrega: (COL.procedimentoFim + COL.entregaFim) / 2,
  valor: (COL.entregaFim + COL.direita) / 2,
};

const Y = {
  escudo: 0,
  alturaEscudo: 21.8,

  titulo: 36.4,
  barra: 41.5,
  alturaBarra: 1,
  larguraBarra: 26.2,
  nome: 51.9,

  cabecalho: 64.6,
  tabelaTopo: 68.2,
  tabelaBase: 217.1,
  /** Altura máxima da linha: com poucos itens a tabela preenche a folha. */
  alturaLinha: 16.5,

  rotulos: 232.1,
  valorIndividual: 245,
  valorProjeto: 242,
  selo: 246.2,
  alturaSelo: 5.8,
  parcelas: 257.5,

  divisorTopo: 228,
  divisorBase: 259.5,

  caixaTopo: 265.3,
  caixaBase: 290,
  caixaEsquerda: 11,
  caixaDireita: 83.2,
};

/** Altura mínima de linha antes de partir a tabela para outra página. */
const ALTURA_LINHA_MINIMA = 9;

/** Cores alternadas das tarjas, para separar um pilar do seguinte. */
const TARJAS: RGB[] = [OURO, TINTA];

const NOME_DO_PILAR: Record<string, string> = {
  lift: "LIFT",
  sculpt: "SCULPT",
  beauty: "BEAUTY",
  skin: "SKIN",
  alem_da_face: "ALÉM DA FACE",
  bonus: "BÔNUS",
};

/* -------------------------------------------------------------------------- */
/* Dados                                                                        */
/* -------------------------------------------------------------------------- */

export interface LinhaOrcamento {
  /** Pilar do procedimento, ou "bonus" para uma cortesia. */
  pilar: ColunaKey | "alem_da_face" | "bonus";
  nome: string;
  descricao?: string | null;
  /** `null` num bônus: a coluna de valor mostra a palavra "Bônus". */
  valor: number | null;
}

export interface DadosOrcamento {
  patientName: string;
  linhas: LinhaOrcamento[];
  /** Soma dos tratamentos avulsos, antes do desconto do projeto. */
  valorIndividual: number;
  /** O que a paciente paga pelo projeto. */
  valorProjeto: number;
  /** Quanto o projeto economiza. Sem desconto, o bloco não aparece. */
  economia: number;
  parcelas?: number | null;
}

const moeda = (v: number): string =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* -------------------------------------------------------------------------- */
/* Desenho                                                                      */
/* -------------------------------------------------------------------------- */

export async function desenharOrcamentoDermalift(
  doc: jsPDF,
  dados: DadosOrcamento
): Promise<void> {
  registrarFontes(doc);

  const [escudo, iconeRosto, logo, monograma] = await Promise.all([
    carregarImagem(ESCUDO),
    carregarImagem(ICONE_ROSTO),
    carregarImagem(LOGO),
    carregarImagem(MONOGRAMA),
  ]);

  const alturaUtil = Y.tabelaBase - Y.tabelaTopo;
  const total = dados.linhas.length;

  // A linha cresce para preencher a altura útil e encolhe quando há
  // procedimentos demais; abaixo do mínimo, a tabela continua numa página
  // nova em vez de virar um amontoado ilegível.
  let alturaLinha = Math.min(Y.alturaLinha, alturaUtil / total);
  if (alturaLinha < ALTURA_LINHA_MINIMA) alturaLinha = ALTURA_LINHA_MINIMA;
  const porPagina = Math.max(1, Math.floor(alturaUtil / alturaLinha));
  const paginas = Math.max(1, Math.ceil(total / porPagina));

  for (let pagina = 0; pagina < paginas; pagina++) {
    if (pagina > 0) doc.addPage();

    barra(doc, 0, 0, LARGURA_PAGINA, ALTURA_PAGINA, [255, 255, 255]);

    /* ------------------------------------------------------- cabeçalho --- */

    if (escudo) {
      const largura = (Y.alturaEscudo * escudo.width) / escudo.height;
      doc.addImage(escudo, "JPEG", CENTRO - largura / 2, Y.escudo, largura, Y.alturaEscudo);
    }

    ajustarNaLargura(
      doc,
      "INVESTIMENTO DO SEU PLANO PERSONALIZADO",
      CENTRO,
      Y.titulo,
      LARGURA_PAGINA - 30,
      { estilo: "bold", tamanho: 14.5, cor: TINTA, espacamento: 0.1 }
    );

    barra(doc, CENTRO - Y.larguraBarra / 2, Y.barra, Y.larguraBarra, Y.alturaBarra, OURO);

    ajustarNaLargura(
      doc,
      (dados.patientName || "").toUpperCase(),
      CENTRO,
      Y.nome,
      LARGURA_PAGINA - 40,
      { fonte: SERIF, estilo: SERIF_MEDIO, tamanho: 18.5, cor: TINTA, espacamento: 1.1 }
    );

    /* ---------------------------------------------------------- tabela --- */

    const fatia = dados.linhas.slice(pagina * porPagina, (pagina + 1) * porPagina);
    desenharCabecalhoTabela(doc);
    desenharLinhas(doc, fatia, alturaLinha, iconeRosto, pagina * porPagina, dados.linhas);

    /* ------------------------------------------- fechamento financeiro --- */

    if (pagina === paginas - 1) {
      desenharFechamento(doc, dados, monograma);
      desenharRodape(doc, logo);
    }
  }
}

function desenharCabecalhoTabela(doc: jsPDF): void {
  const rotulo: OpcoesTexto = { estilo: "bold", tamanho: 9, cor: TINTA, espacamento: 0.18 };
  centralizado(doc, "PILAR", CENTRO_COL.pilar, Y.cabecalho, rotulo);
  centralizado(doc, "PROCEDIMENTO", CENTRO_COL.procedimento, Y.cabecalho, rotulo);
  centralizado(doc, "O QUE ELE ENTREGA", CENTRO_COL.entrega, Y.cabecalho, rotulo);
  centralizado(doc, "VALOR INDIVIDUAL", CENTRO_COL.valor, Y.cabecalho, rotulo);
}

function desenharLinhas(
  doc: jsPDF,
  fatia: LinhaOrcamento[],
  alturaLinha: number,
  iconeRosto: HTMLImageElement | null,
  deslocamento: number,
  todas: LinhaOrcamento[]
): void {
  const alturaTabela = fatia.length * alturaLinha;

  /* fios da grade */
  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= fatia.length; i++) {
    const y = Y.tabelaTopo + i * alturaLinha;
    doc.line(COL.esquerda, y, COL.direita, y);
  }
  for (const x of [COL.esquerda, COL.pilarFim, COL.procedimentoFim, COL.entregaFim, COL.direita]) {
    doc.line(x, Y.tabelaTopo, x, Y.tabelaTopo + alturaTabela);
  }

  /* tarjas: uma faixa contínua por bloco de pilar, alternando a cor */
  let inicioBloco = 0;
  let indiceTarja = contarTrocas(todas, deslocamento);
  for (let i = 0; i <= fatia.length; i++) {
    const fim = i === fatia.length || fatia[i].pilar !== fatia[inicioBloco].pilar;
    if (!fim) continue;
    const y0 = Y.tabelaTopo + inicioBloco * alturaLinha;
    const y1 = Y.tabelaTopo + i * alturaLinha;
    barra(doc, COL.tarja, y0, COL.tarjaLargura, y1 - y0, TARJAS[indiceTarja % TARJAS.length]);

    // Nome do pilar, na vertical, ao lado da tarja. Rótulos longos encolhem
    // em vez de sumir — "ALÉM DA FACE" não cabe a 7pt num bloco de uma linha.
    const nome = NOME_DO_PILAR[fatia[inicioBloco].pilar] ?? "";
    if (nome) {
      const alturaBloco = y1 - y0;
      for (const tamanho of [7, 6.2, 5.4, 4.6]) {
        aplicar(doc, { estilo: "bold", tamanho, cor: TINTA });
        const larguraTexto = doc.getTextWidth(nome);
        if (larguraTexto <= alturaBloco - 1.5 || tamanho === 4.6) {
          if (larguraTexto <= alturaBloco) {
            doc.text(nome, COL.tarja - 1.4, (y0 + y1) / 2 + larguraTexto / 2, { angle: 90 });
          }
          break;
        }
      }
    }

    indiceTarja++;
    inicioBloco = i;
  }

  /* conteúdo */
  fatia.forEach((linha, i) => {
    const y0 = Y.tabelaTopo + i * alturaLinha;
    const meio = y0 + alturaLinha / 2;

    if (iconeRosto) {
      const altura = Math.min(alturaLinha - 2.6, 12.3);
      const largura = (altura * iconeRosto.width) / iconeRosto.height;
      doc.addImage(
        iconeRosto,
        "JPEG",
        CENTRO_COL.pilar - largura / 2,
        meio - altura / 2,
        largura,
        altura
      );
    }

    desenharBlocoCentrado(
      doc,
      linha.nome,
      CENTRO_COL.procedimento,
      meio,
      COL.procedimentoFim - COL.pilarFim - 6,
      alturaLinha - 3,
      { estilo: "bold", tamanho: 11.5, cor: TINTA },
      4.4
    );

    const descricao = (linha.descricao ?? "").trim();
    if (descricao) {
      desenharBlocoCentrado(
        doc,
        descricao,
        CENTRO_COL.entrega,
        meio,
        COL.entregaFim - COL.procedimentoFim - 8,
        alturaLinha - 2.5,
        { tamanho: 8, cor: CINZA },
        2.9
      );
    }

    if (linha.valor === null) {
      centralizado(doc, "Bônus", CENTRO_COL.valor, meio + 1.4, {
        fonte: SERIF,
        estilo: "bold",
        tamanho: 15,
        cor: OURO,
        espacamento: 0.4,
      });
    } else {
      centralizado(doc, moeda(linha.valor), CENTRO_COL.valor, meio + 1.4, {
        estilo: "bold",
        tamanho: 12,
        cor: TINTA,
      });
    }
  });
}

/** Quantos blocos de pilar já passaram, para a tarja continuar alternando. */
function contarTrocas(todas: LinhaOrcamento[], ate: number): number {
  let trocas = 0;
  for (let i = 1; i < ate && i < todas.length; i++) {
    if (todas[i].pilar !== todas[i - 1].pilar) trocas++;
  }
  return trocas;
}

/**
 * Escreve um texto quebrado em linhas, centralizado vertical e
 * horizontalmente numa célula, cortando o excedente com reticências.
 */
function desenharBlocoCentrado(
  doc: jsPDF,
  texto: string,
  xCentro: number,
  yMeio: number,
  largura: number,
  alturaMaxima: number,
  opcoes: OpcoesTexto,
  entrelinha: number
): void {
  aplicar(doc, opcoes);
  let linhas = doc.splitTextToSize(texto, largura) as string[];

  const maximo = Math.max(1, Math.floor(alturaMaxima / entrelinha));
  if (linhas.length > maximo) {
    linhas = linhas.slice(0, maximo);
    linhas[maximo - 1] = linhas[maximo - 1].replace(/[,\s]+$/, "") + "…";
  }

  const alturaBloco = (linhas.length - 1) * entrelinha;
  const primeira = yMeio - alturaBloco / 2 + entrelinha * 0.32;
  linhas.forEach((linha, i) => {
    centralizado(doc, linha, xCentro, primeira + i * entrelinha, opcoes);
  });
}

function desenharFechamento(
  doc: jsPDF,
  dados: DadosOrcamento,
  monograma: HTMLImageElement | null
): void {
  const temDesconto = dados.economia > 0.005;
  const xEsquerda = (COL.esquerda + CENTRO) / 2 + 14;
  const xDireita = (CENTRO + COL.direita) / 2 + 3;

  const rotulo: OpcoesTexto = { estilo: "bold", tamanho: 8, cor: TINTA, espacamento: 0.35 };

  if (temDesconto) {
    centralizado(doc, "VALOR DOS TRATAMENTOS INDIVIDUAIS", xEsquerda, Y.rotulos, rotulo);

    const opcoesRiscado: OpcoesTexto = {
      fonte: SERIF,
      estilo: SERIF_MEDIO,
      tamanho: 26,
      cor: CINZA,
      espacamento: 0.3,
    };
    const textoIndividual = moeda(dados.valorIndividual);
    aplicar(doc, opcoesRiscado);
    const larguraRiscado = larguraDe(doc, textoIndividual, 0.3);
    centralizado(doc, textoIndividual, xEsquerda, Y.valorIndividual, opcoesRiscado);

    // Risco sobre o valor avulso
    doc.setDrawColor(OURO[0], OURO[1], OURO[2]);
    doc.setLineWidth(0.5);
    const yRisco = Y.valorIndividual - 2.4;
    doc.line(
      xEsquerda - larguraRiscado / 2 - 2,
      yRisco,
      xEsquerda + larguraRiscado / 2 + 2,
      yRisco
    );

    /* divisor central com o monograma */
    doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
    doc.setLineWidth(0.25);
    doc.line(CENTRO, Y.divisorTopo, CENTRO, Y.divisorTopo + 13);
    doc.line(CENTRO, Y.divisorBase - 13, CENTRO, Y.divisorBase);
    if (monograma) {
      const altura = 5;
      const largura = (altura * monograma.width) / monograma.height;
      doc.addImage(
        monograma,
        "JPEG",
        CENTRO - largura / 2,
        (Y.divisorTopo + Y.divisorBase) / 2 - altura / 2,
        largura,
        altura
      );
    }
  }

  centralizado(doc, "SEU PROJETO DERMALIFT", temDesconto ? xDireita : CENTRO, Y.rotulos, rotulo);

  centralizado(doc, moeda(dados.valorProjeto), temDesconto ? xDireita : CENTRO, Y.valorProjeto, {
    fonte: SERIF,
    estilo: SERIF_MEDIO,
    tamanho: 32,
    cor: TINTA,
    espacamento: 0.4,
  });

  const xFecho = temDesconto ? xDireita : CENTRO;

  if (temDesconto) {
    const etiqueta = "Você economiza ";
    const valor = moeda(dados.economia);
    aplicar(doc, { tamanho: 8, cor: [255, 255, 255] });
    const larguraEtiqueta = doc.getTextWidth(etiqueta);
    aplicar(doc, { estilo: "bold", tamanho: 9.5, cor: [255, 255, 255] });
    const larguraValor = doc.getTextWidth(valor);
    const larguraSelo = larguraEtiqueta + larguraValor + 6;

    barra(doc, xFecho - larguraSelo / 2, Y.selo, larguraSelo, Y.alturaSelo, TINTA);

    const xTexto = xFecho - larguraSelo / 2 + 3;
    const yTexto = Y.selo + Y.alturaSelo - 1.8;
    aplicar(doc, { tamanho: 8, cor: [255, 255, 255] });
    doc.text(etiqueta, xTexto, yTexto);
    aplicar(doc, { estilo: "bold", tamanho: 9.5, cor: [255, 255, 255] });
    doc.text(valor, xTexto + larguraEtiqueta, yTexto);
  }

  const parcelas = dados.parcelas ?? 1;
  if (parcelas > 1) {
    centralizado(
      doc,
      `${parcelas}x ${moeda(dados.valorProjeto / parcelas)}`,
      xFecho,
      Y.parcelas,
      { tamanho: 12, cor: OURO }
    );
  }
}

function desenharRodape(doc: jsPDF, logo: HTMLImageElement | null): void {
  /* caixa do benefício */
  barra(doc, Y.caixaEsquerda, Y.caixaTopo, 1.2, Y.caixaBase - Y.caixaTopo, OURO);

  const x = Y.caixaEsquerda + 4.5;
  aplicar(doc, { estilo: "bold", tamanho: 10, cor: TINTA });
  doc.text("BENEFÍCIO EXCLUSIVO DO PROJETO", x, Y.caixaTopo + 3.8);

  // O texto tem que fechar em três linhas para a data caber embaixo.
  const texto =
    "Ao escolher o Projeto DermaLift completo, você garante sinergia entre os " +
    "tratamentos, resultados superiores e uma jornada personalizada do início ao fim.";
  const largura = Y.caixaDireita - x + 6;
  let tamanho = 8;
  let linhas: string[] = [];
  for (const candidato of [8, 7.6, 7.2, 6.8]) {
    tamanho = candidato;
    aplicar(doc, { tamanho, cor: CINZA });
    linhas = doc.splitTextToSize(texto, largura) as string[];
    if (linhas.length <= 3) break;
  }
  aplicar(doc, { tamanho, cor: CINZA });
  linhas.forEach((linha, i) => doc.text(linha, x, Y.caixaTopo + 9.5 + i * 3.6));

  aplicar(doc, { estilo: "bold", tamanho: 9, cor: OURO });
  doc.text("Data:", x, Y.caixaBase - 1.5);
  aplicar(doc, { estilo: "bold", tamanho: 9, cor: TINTA });
  doc.text("____/____/______", x + doc.getTextWidth("Data: "), Y.caixaBase - 1.5);

  if (logo) {
    const altura = 13.6;
    const largura = (altura * logo.width) / logo.height;
    doc.addImage(logo, "JPEG", 195.5 - largura, 271, largura, altura);
  }
}

/* Reexport para quem só precisa do tipo da linha. */
export type { ColunaKey };
