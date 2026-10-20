import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Permite rolar um contêiner horizontalmente arrastando com o mouse, sem
 * precisar da barra de rolagem.
 *
 * O arrasto só começa depois de alguns pixels de movimento, para que cliques
 * continuem funcionando normalmente nos cartões lá dentro — e, quando um
 * arrasto acontece, o clique seguinte é engolido, senão soltar o mouse em
 * cima de um procedimento acabaria selecionando ele sem querer.
 */

/** Distância, em pixels, antes de o gesto virar arrasto em vez de clique. */
const LIMIAR = 5;

/** Elementos que precisam do mouse para si (texto, campos, rolagem própria). */
function alvoInterativo(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof Element)) return false;
  return Boolean(
    alvo.closest(
      'input, textarea, select, [contenteditable="true"], [data-sem-arrasto]'
    )
  );
}

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [temOverflow, setTemOverflow] = useState(false);

  // Guardados em ref: mudam durante o gesto e não devem re-renderizar.
  const inicio = useRef({ x: 0, scrollLeft: 0 });
  const ativo = useRef(false);
  const acabouDeArrastar = useRef(false);

  /** Mantém o cursor de "agarrar" só quando há o que rolar. */
  const medir = useCallback(() => {
    const el = ref.current;
    if (el) setTemOverflow(el.scrollWidth - el.clientWidth > 2);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    for (const filho of Array.from(el.children)) observer.observe(filho);

    /**
     * Engole o clique que fecha um arrasto. Fica sempre instalado e decide
     * pela bandeira — assim nada fica pendurado quando o gesto termina fora
     * do contêiner e o clique nunca chega.
     */
    const engolirClique = (e: MouseEvent) => {
      if (!acabouDeArrastar.current) return;
      acabouDeArrastar.current = false;
      e.stopPropagation();
      e.preventDefault();
    };
    el.addEventListener("click", engolirClique, true);

    const aoMover = (e: PointerEvent) => {
      const dx = e.clientX - inicio.current.x;
      if (!ativo.current) {
        if (Math.abs(dx) < LIMIAR) return;
        ativo.current = true;
        setArrastando(true);
        document.body.style.userSelect = "none";
      }
      el.scrollLeft = inicio.current.scrollLeft - dx;
      e.preventDefault();
    };

    const aoSoltar = () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
      window.removeEventListener("pointercancel", aoSoltar);

      if (ativo.current) {
        acabouDeArrastar.current = true;
        // O clique vem logo depois do pointerup; se não vier, a bandeira cai
        // sozinha e nenhum clique futuro é perdido.
        setTimeout(() => {
          acabouDeArrastar.current = false;
        }, 0);
        document.body.style.userSelect = "";
      }
      ativo.current = false;
      setArrastando(false);
    };

    const aoPressionar = (e: PointerEvent) => {
      if (e.button !== 0 || alvoInterativo(e.target)) return;
      if (el.scrollWidth - el.clientWidth <= 2) return;

      inicio.current = { x: e.clientX, scrollLeft: el.scrollLeft };
      ativo.current = false;
      window.addEventListener("pointermove", aoMover);
      window.addEventListener("pointerup", aoSoltar);
      window.addEventListener("pointercancel", aoSoltar);
    };

    el.addEventListener("pointerdown", aoPressionar);

    return () => {
      el.removeEventListener("pointerdown", aoPressionar);
      el.removeEventListener("click", engolirClique, true);
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
      window.removeEventListener("pointercancel", aoSoltar);
      observer.disconnect();
      document.body.style.userSelect = "";
    };
  }, [medir]);

  return {
    ref,
    /** Classe de cursor: agarrar quando dá para rolar, fechado durante o gesto. */
    className: temOverflow ? (arrastando ? "cursor-grabbing" : "cursor-grab") : "",
    arrastando,
  };
}
