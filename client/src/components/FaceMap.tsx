import { useMemo, useState } from "react";

/* -------------------------------------------------------------------------
   Mapa facial — esquema de áreas clicáveis para a proposta do Dermalift.
   Coordenadas em espaço 0–1000 × 0–1000 com preserveAspectRatio="none",
   casadas com a imagem base (1047 × 1148). Trocar a imagem por outra de
   proporção diferente distorce os contornos.
   ------------------------------------------------------------------------- */

export type FaceZone = {
  id: string;
  /** Nome da área, sem lado. Ex.: "Malar" */
  name: string;
  /** Lado do paciente. Ausente em áreas centrais. */
  side?: "D" | "E";
  /** id da área espelhada, quando existe par bilateral. */
  pair?: string;
  d: string;
};

export const FACE_ZONES: FaceZone[] = [
  {"id":"1","name":"Testa","d":"M 372 140 C 398.8 132.5, 457.3 131, 500 131 C 542.7 131, 601.2 132.5, 628 140 C 654.8 147.5, 654.3 160.8, 661 176 C 667.7 191.2, 669.2 215.2, 668 231 C 666.8 246.8, 665.3 261.3, 654 271 C 642.7 280.7, 625.7 285.3, 600 289 C 574.3 292.7, 533.3 293, 500 293 C 466.7 293, 425.7 292.7, 400 289 C 374.3 285.3, 357.3 280.7, 346 271 C 334.7 261.3, 333.2 246.8, 332 231 C 330.8 215.2, 332.3 191.2, 339 176 C 345.7 160.8, 345.2 147.5, 372 140 Z"},
  {"id":"2","name":"Glabela e dorso nasal","d":"M 452 266 C 460.7 258.7, 482.7 257, 500 257 C 517.3 257, 547.3 258.7, 556 266 C 564.7 273.3, 557.3 292.2, 552 301 C 546.7 309.8, 529 303.8, 524 319 C 519 334.2, 518.3 376.7, 522 392 C 525.7 407.3, 541 401.7, 546 411 C 551 420.3, 555.7 440.5, 552 448 C 548.3 455.5, 532.7 456, 524 456 C 515.3 456, 508 448, 500 448 C 492 448, 484.7 456, 476 456 C 467.3 456, 451.7 455.5, 448 448 C 444.3 440.5, 449 420.3, 454 411 C 459 401.7, 474.3 407.3, 478 392 C 481.7 376.7, 481 334.2, 476 319 C 471 303.8, 452 309.8, 448 301 C 444 292.2, 443.3 273.3, 452 266 Z"},
  {"id":"3","name":"Têmpora superior","side":"D","pair":"3A","d":"M 300 231 C 307.3 223.7, 331.5 216.5, 340 220 C 348.5 223.5, 349.8 241.5, 351 252 C 352.2 262.5, 353.2 276.8, 347 283 C 340.8 289.2, 322.5 292.2, 314 289 C 305.5 285.8, 298.3 273.7, 296 264 C 293.7 254.3, 292.7 238.3, 300 231 Z"},
  {"id":"3A","name":"Têmpora superior","side":"E","pair":"3","d":"M 704 264 C 701.7 273.7, 694.5 285.8, 686 289 C 677.5 292.2, 659.2 289.2, 653 283 C 646.8 276.8, 647.8 262.5, 649 252 C 650.2 241.5, 651.5 223.5, 660 220 C 668.5 216.5, 692.7 223.7, 700 231 C 707.3 238.3, 706.3 254.3, 704 264 Z"},
  {"id":"4","name":"Têmpora","side":"D","pair":"6","d":"M 290 292 C 301.3 283.8, 339.8 283.2, 352 288 C 364.2 292.8, 363.3 308.8, 363 321 C 362.7 333.2, 356.8 349, 350 361 C 343.2 373, 331 390, 322 393 C 313 396, 302.3 388.3, 296 379 C 289.7 369.7, 285 351.5, 284 337 C 283 322.5, 278.7 300.2, 290 292 Z"},
  {"id":"6","name":"Têmpora","side":"E","pair":"4","d":"M 716 337 C 715 351.5, 710.3 369.7, 704 379 C 697.7 388.3, 687 396, 678 393 C 669 390, 656.8 373, 650 361 C 643.2 349, 637.3 333.2, 637 321 C 636.7 308.8, 635.8 292.8, 648 288 C 660.2 283.2, 698.7 283.8, 710 292 C 721.3 300.2, 717 322.5, 716 337 Z"},
  {"id":"5","name":"Pálpebra superior","side":"D","pair":"7","d":"M 342 331 C 347 324.8, 364.3 316.2, 378 314 C 391.7 311.8, 414 314.8, 424 318 C 434 321.2, 438.7 327.2, 438 333 C 437.3 338.8, 430 348.7, 420 353 C 410 357.3, 390 359.3, 378 359 C 366 358.7, 354 355.7, 348 351 C 342 346.3, 337 337.2, 342 331 Z"},
  {"id":"7","name":"Pálpebra superior","side":"E","pair":"5","d":"M 652 351 C 646 355.7, 634 358.7, 622 359 C 610 359.3, 590 357.3, 580 353 C 570 348.7, 562.7 338.8, 562 333 C 561.3 327.2, 566 321.2, 576 318 C 586 314.8, 608.3 311.8, 622 314 C 635.7 316.2, 653 324.8, 658 331 C 663 337.2, 658 346.3, 652 351 Z"},
  {"id":"8","name":"Olheira","side":"D","pair":"8A","d":"M 368 401 C 376 395.5, 405 392.3, 420 392 C 435 391.7, 452.7 393.5, 458 399 C 463.3 404.5, 460 419.3, 452 425 C 444 430.7, 423.3 433, 410 433 C 396.7 433, 379 430.3, 372 425 C 365 419.7, 360 406.5, 368 401 Z"},
  {"id":"8A","name":"Olheira","side":"E","pair":"8","d":"M 628 425 C 621 430.3, 603.3 433, 590 433 C 576.7 433, 556 430.7, 548 425 C 540 419.3, 536.7 404.5, 542 399 C 547.3 393.5, 565 391.7, 580 392 C 595 392.3, 624 395.5, 632 401 C 640 406.5, 635 419.7, 628 425 Z"},
  {"id":"9","name":"Zigomático","side":"D","pair":"9A","d":"M 272 421 C 281.7 408.8, 311 407.3, 330 406 C 349 404.7, 376 402.2, 386 413 C 396 423.8, 392.3 456.3, 390 471 C 387.7 485.7, 387 495.7, 372 501 C 357 506.3, 316.7 506.7, 300 503 C 283.3 499.3, 276.7 492.7, 272 479 C 267.3 465.3, 262.3 433.2, 272 421 Z"},
  {"id":"9A","name":"Zigomático","side":"E","pair":"9","d":"M 728 479 C 723.3 492.7, 716.7 499.3, 700 503 C 683.3 506.7, 643 506.3, 628 501 C 613 495.7, 612.3 485.7, 610 471 C 607.7 456.3, 604 423.8, 614 413 C 624 402.2, 651 404.7, 670 406 C 689 407.3, 718.3 408.8, 728 421 C 737.7 433.2, 732.7 465.3, 728 479 Z"},
  {"id":"10","name":"Malar","side":"D","pair":"10E","d":"M 394 415 C 405 399.7, 448.8 400.7, 462 405 C 475.2 409.3, 472 427.3, 473 441 C 474 454.7, 475.2 476.7, 468 487 C 460.8 497.3, 442 501.3, 430 503 C 418 504.7, 402 511.7, 396 497 C 390 482.3, 383 430.3, 394 415 Z"},
  {"id":"10E","name":"Malar","side":"E","pair":"10","d":"M 604 497 C 598 511.7, 582 504.7, 570 503 C 558 501.3, 539.2 497.3, 532 487 C 524.8 476.7, 526 454.7, 527 441 C 528 427.3, 524.8 409.3, 538 405 C 551.2 400.7, 595 399.7, 606 415 C 617 430.3, 610 482.3, 604 497 Z"},
  {"id":"11","name":"Ponta nasal","d":"M 474 479 C 476.3 473.2, 485.7 466.5, 492 464 C 498.3 461.5, 506 461.5, 512 464 C 518 466.5, 526.3 473.2, 528 479 C 529.7 484.8, 526.7 494.3, 522 499 C 517.3 503.7, 507.3 507, 500 507 C 492.7 507, 482.3 503.7, 478 499 C 473.7 494.3, 471.7 484.8, 474 479 Z"},
  {"id":"NG","name":"Bigode chinês","side":"D","pair":"NGE","d":"M 396 527 C 402 522.5, 422 518.3, 428 522 C 434 525.7, 431.8 540.5, 432 549 C 432.2 557.5, 434.7 568.7, 429 573 C 423.3 577.3, 404.2 579, 398 575 C 391.8 571, 392.3 557, 392 549 C 391.7 541, 390 531.5, 396 527 Z"},
  {"id":"NGE","name":"Bigode chinês","side":"E","pair":"NG","d":"M 608 549 C 607.7 557, 608.2 571, 602 575 C 595.8 579, 576.7 577.3, 571 573 C 565.3 568.7, 567.8 557.5, 568 549 C 568.2 540.5, 566 525.7, 572 522 C 578 518.3, 598 522.5, 604 527 C 610 531.5, 608.3 541, 608 549 Z"},
  {"id":"MR","name":"Marionete","side":"D","pair":"MRE","d":"M 398 575 C 403.8 570.7, 423.3 569.3, 429 573 C 434.7 576.7, 432.3 589, 432 597 C 431.7 605, 432.3 616.7, 427 621 C 421.7 625.3, 405.5 626.7, 400 623 C 394.5 619.3, 394.3 607, 394 599 C 393.7 591, 392.2 579.3, 398 575 Z"},
  {"id":"MRE","name":"Marionete","side":"E","pair":"MR","d":"M 606 599 C 605.7 607, 605.5 619.3, 600 623 C 594.5 626.7, 578.3 625.3, 573 621 C 567.7 616.7, 568.3 605, 568 597 C 567.7 589, 565.3 576.7, 571 573 C 576.7 569.3, 596.2 570.7, 602 575 C 607.8 579.3, 606.3 591, 606 599 Z"},
  {"id":"LS","name":"Lábio superior","d":"M 444 525 C 452.7 518.8, 481.3 512, 500 512 C 518.7 512, 547.3 518.8, 556 525 C 564.7 531.2, 561.3 543.8, 552 549 C 542.7 554.2, 517.3 556, 500 556 C 482.7 556, 457.3 554.2, 448 549 C 438.7 543.8, 435.3 531.2, 444 525 Z"},
  {"id":"LI","name":"Lábio inferior","d":"M 436 581 C 445.7 574.8, 478 570, 500 570 C 522 570, 557.7 574.8, 568 581 C 578.3 587.2, 573.3 601, 562 607 C 550.7 613, 520 617, 500 617 C 480 617, 452.7 613, 442 607 C 431.3 601, 426.3 587.2, 436 581 Z"},
  {"id":"12a","name":"Bochecha","side":"D","pair":"12aE","d":"M 272 501 C 283.3 493.2, 319.7 492, 340 492 C 360.3 492, 385.7 492.8, 394 501 C 402.3 509.2, 395.7 530, 390 541 C 384.3 552, 375 562.7, 360 567 C 345 571.3, 314.7 571.7, 300 567 C 285.3 562.3, 276.7 550, 272 539 C 267.3 528, 260.7 508.8, 272 501 Z"},
  {"id":"12aE","name":"Bochecha","side":"E","pair":"12a","d":"M 728 539 C 723.3 550, 714.7 562.3, 700 567 C 685.3 571.7, 655 571.3, 640 567 C 625 562.7, 615.7 552, 610 541 C 604.3 530, 597.7 509.2, 606 501 C 614.3 492.8, 639.7 492, 660 492 C 680.3 492, 716.7 493.2, 728 501 C 739.3 508.8, 732.7 528, 728 539 Z"},
  {"id":"12b","name":"Mandíbula","side":"D","pair":"12bE","d":"M 298 579 C 310 570.7, 347.7 570.3, 368 571 C 388.3 571.7, 412 574.7, 420 583 C 428 591.3, 421 608.7, 416 621 C 411 633.3, 404.3 650.3, 390 657 C 375.7 663.7, 345.7 667, 330 661 C 314.3 655, 301.3 634.7, 296 621 C 290.7 607.3, 286 587.3, 298 579 Z"},
  {"id":"12bE","name":"Mandíbula","side":"E","pair":"12b","d":"M 704 621 C 698.7 634.7, 685.7 655, 670 661 C 654.3 667, 624.3 663.7, 610 657 C 595.7 650.3, 589 633.3, 584 621 C 579 608.7, 572 591.3, 580 583 C 588 574.7, 611.7 571.7, 632 571 C 652.3 570.3, 690 570.7, 702 579 C 714 587.3, 709.3 607.3, 704 621 Z"},
  {"id":"13","name":"Mento","d":"M 428 625 C 440.7 618.2, 475 616, 500 616 C 525 616, 564.3 618.2, 578 625 C 591.7 631.8, 585.7 647, 582 657 C 578.3 667, 569.7 679, 556 685 C 542.3 691, 518.7 693, 500 693 C 481.3 693, 456.7 691, 444 685 C 431.3 679, 426.7 667, 424 657 C 421.3 647, 415.3 631.8, 428 625 Z"},
  {"id":"15","name":"Ângulo mandibular","side":"D","pair":"15A","d":"M 354 665 C 367 657.8, 411.7 652, 424 658 C 436.3 664, 428.7 685.2, 428 701 C 427.3 716.8, 427.7 742.3, 420 753 C 412.3 763.7, 393.3 767, 382 765 C 370.7 763, 358 751.7, 352 741 C 346 730.3, 345.7 713.7, 346 701 C 346.3 688.3, 341 672.2, 354 665 Z"},
  {"id":"15A","name":"Ângulo mandibular","side":"E","pair":"15","d":"M 654 701 C 654.3 713.7, 654 730.3, 648 741 C 642 751.7, 629.3 763, 618 765 C 606.7 767, 587.7 763.7, 580 753 C 572.3 742.3, 572.7 716.8, 572 701 C 571.3 685.2, 563.7 664, 576 658 C 588.3 652, 633 657.8, 646 665 C 659 672.2, 653.7 688.3, 654 701 Z"},
  {"id":"16","name":"Papada","d":"M 430 701 C 442.3 693, 475.3 693, 500 693 C 524.7 693, 564.7 693, 578 701 C 591.3 709, 583 729.3, 580 741 C 577 752.7, 573.3 765, 560 771 C 546.7 777, 519.3 777, 500 777 C 480.7 777, 456.3 777, 444 771 C 431.7 765, 428.3 752.7, 426 741 C 423.7 729.3, 417.7 709, 430 701 Z"},
];

const ZONE_BY_ID = new Map(FACE_ZONES.map((z) => [z.id, z]));

const SIDE_LABEL: Record<string, string> = { D: "direito", E: "esquerdo" };

/** Nome legível de uma zona, para leitores de tela e listas. */
export function zoneLabel(id: string): string {
  const z = ZONE_BY_ID.get(id);
  if (!z) return id;
  return z.side ? `${z.name} ${SIDE_LABEL[z.side]}` : z.name;
}

/**
 * Agrupa as áreas selecionadas em rótulos para o cliente.
 * Pares bilaterais completos viram um rótulo só: ["Malar", "Mandíbula (D)"].
 */
export function zoneChips(ids: string[]): string[] {
  const sel = new Set(ids);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const z = ZONE_BY_ID.get(id);
    if (!z || seen.has(id)) continue;
    if (z.pair && sel.has(z.pair)) {
      seen.add(id);
      seen.add(z.pair);
      out.push(z.name);
    } else {
      seen.add(id);
      out.push(z.side ? `${z.name} (${z.side})` : z.name);
    }
  }
  return out;
}

/** Total de áreas do mapa. */
export const TOTAL_ZONES = FACE_ZONES.length;

/**
 * Versão compacta dos chips: com tudo marcado vira um chip só, e acima de
 * `max` corta a lista com um "+N". Evita que a legenda domine o card.
 */
export function zoneChipsCompact(
  ids: string[],
  max = 6
): { chips: string[]; extra: number } {
  if (ids.length >= TOTAL_ZONES) return { chips: ["Todas as áreas"], extra: 0 };
  const all = zoneChips(ids);
  return { chips: all.slice(0, max), extra: Math.max(0, all.length - max) };
}

type FaceMapProps = {
  /** ids das áreas marcadas. Componente controlado. */
  value: string[];
  /** Omitir deixa o mapa apenas como leitura. */
  onChange?: (ids: string[]) => void;
  /** Cor de destaque — normalmente a cor da coluna. */
  accent?: string;
  imageSrc?: string;
  /** Some com os contornos das áreas não marcadas. Use na proposta final. */
  readOnly?: boolean;
  /** Clicar num lado marca o par bilateral. Alt+clique marca só um lado. */
  linkSides?: boolean;
  showChips?: boolean;
  /** Máximo de chips exibidos antes de resumir com "+N". */
  maxChips?: number;
  className?: string;
};

export default function FaceMap({
  value,
  onChange,
  accent = "hsl(var(--primary))",
  imageSrc = "/rosto-base.jpg",
  readOnly = false,
  linkSides = true,
  showChips = true,
  maxChips = 6,
  className = "",
}: FaceMapProps) {
  const sel = useMemo(() => new Set(value), [value]);
  const [hover, setHover] = useState<string | null>(null);
  const locked = readOnly || !onChange;

  function toggle(zone: FaceZone, alt: boolean) {
    if (locked) return;
    const next = new Set(sel);
    const targets =
      linkSides && zone.pair && !alt ? [zone.id, zone.pair] : [zone.id];
    const turningOn = !sel.has(zone.id);
    for (const id of targets) {
      if (turningOn) next.add(id);
      else next.delete(id);
    }
    onChange!(FACE_ZONES.filter((z) => next.has(z.id)).map((z) => z.id));
  }

  const allSelected = value.length === FACE_ZONES.length;

  function selectAll() {
    if (locked) return;
    onChange!(FACE_ZONES.map((z) => z.id));
  }

  function clearAll() {
    if (locked) return;
    onChange!([]);
  }

  const { chips, extra } = showChips
    ? zoneChipsCompact(value, maxChips)
    : { chips: [] as string[], extra: 0 };

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-xl bg-muted/40"
        style={{ aspectRatio: "1047 / 1148" }}
      >
        <img
          src={imageSrc}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-fill"
        />
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {FACE_ZONES.map((z) => {
            const on = sel.has(z.id);
            const hot = !locked && hover === z.id;
            return (
              <path
                key={z.id}
                d={z.d}
                role={locked ? "img" : "checkbox"}
                aria-checked={locked ? undefined : on}
                aria-label={zoneLabel(z.id)}
                tabIndex={locked ? -1 : 0}
                onClick={(e) => toggle(z, e.altKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(z, e.altKey);
                  }
                }}
                onPointerEnter={() => setHover(z.id)}
                onPointerLeave={() => setHover(null)}
                fill={accent}
                fillOpacity={on ? 0.5 : hot ? 0.16 : 0.001}
                stroke={accent}
                // Marcada: só o preenchimento, sem contorno. O tracejado fica
                // para as áreas ainda disponíveis.
                strokeOpacity={on ? 0 : locked ? 0 : hot ? 0.8 : 0.22}
                strokeWidth={on ? 0 : 1.2}
                strokeDasharray={on ? undefined : "4 4"}
                vectorEffect="non-scaling-stroke"
                className={
                  locked
                    ? "pointer-events-none"
                    : "cursor-pointer outline-none transition-all focus-visible:stroke-[3]"
                }
              />
            );
          })}
        </svg>
      </div>

      {(showChips || !locked) && (
        <div className="mt-2 flex items-start justify-between gap-3">
          {showChips ? (
            <div className="flex flex-wrap gap-1">
              {chips.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Nenhuma área marcada
                </span>
              ) : (
                chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: accent,
                      backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                    }}
                  >
                    {c}
                  </span>
                ))
              )}
              {extra > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  title="Mais áreas marcadas"
                >
                  +{extra}
                </span>
              )}
            </div>
          ) : (
            <span />
          )}

          {/* Atalhos discretos — só no modo de edição */}
          {!locked && (
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {!allSelected && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                >
                  Marcar todas
                </button>
              )}
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
