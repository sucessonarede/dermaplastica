import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Layers, 
  Sparkles, 
  Droplets,
  Shield,
  Star,
  Users,
  ArrowRight,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import useEmblaCarousel from "embla-carousel-react";

export default function Presentation() {
  const [, setLocation] = useLocation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") scrollPrev();
    if (e.key === "ArrowRight") scrollNext();
    if (e.key === "Escape") setLocation("/protocolo-dermalift");
  }, [scrollPrev, scrollNext, setLocation]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const goToQuoteBuilder = () => {
    setLocation("/protocolo-dermalift");
  };

  const slides = [
    {
      id: 1,
      component: (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 via-background to-chart-2/5 text-center px-8 py-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <Sparkles className="w-10 h-10 text-primary" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Dermalift
              </h1>
            </div>
            <p className="text-2xl text-muted-foreground font-light">
              O Protocolo que transforma sua beleza de forma integral
            </p>
            <div className="flex gap-3 justify-center mt-8">
              <Badge variant="secondary" className="text-base px-4 py-1.5">Científico</Badge>
              <Badge variant="secondary" className="text-base px-4 py-1.5">Personalizado</Badge>
              <Badge variant="secondary" className="text-base px-4 py-1.5">Natural</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center mb-6">O que é o Dermalift?</h2>
            <Card className="p-8 space-y-4">
              <p className="text-lg text-foreground leading-relaxed">
                O <span className="font-semibold text-primary">Dermalift</span> é um protocolo exclusivo de harmonização facial que combina ciência, técnica e arte para realçar sua beleza natural de forma integral.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Diferente de tratamentos isolados, o Dermalift avalia e trata seu rosto como um todo, respeitando suas proporções únicas e características individuais.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">Seguro</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-chart-2/10 rounded-full flex items-center justify-center">
                    <Star className="w-7 h-7 text-chart-2" />
                  </div>
                  <p className="font-semibold text-sm">Eficaz</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto bg-chart-3/10 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-chart-3" />
                  </div>
                  <p className="font-semibold text-sm">Personalizado</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 3,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16">
          <div className="max-w-5xl w-full space-y-6">
            <h2 className="text-4xl font-bold text-center">As 4 Etapas do Protocolo</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 space-y-3 ring-2 ring-primary/30 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <Badge className="mb-1 text-xs bg-primary text-primary-foreground">Etapa 1</Badge>
                    <h3 className="text-xl font-bold text-primary">Sustentação</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Base estrutural do tratamento. Restaura o suporte facial perdido pelo envelhecimento.
                </p>
              </Card>

              <Card className="p-6 space-y-3 ring-2 ring-chart-2/30 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-2 to-chart-2/70 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Badge className="mb-1 text-xs bg-chart-2 text-white">Etapa 2</Badge>
                    <h3 className="text-xl font-bold text-chart-2">Estruturação</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Definição e proporções faciais. Harmoniza as características do rosto.
                </p>
              </Card>

              <Card className="p-6 space-y-3 ring-2 ring-chart-3/30 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-3 to-chart-3/70 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Badge className="mb-1 text-xs bg-chart-3 text-white">Etapa 3</Badge>
                    <h3 className="text-xl font-bold text-chart-3">Embelezamento</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Refinamento estético. Realça os detalhes que tornam seu rosto único.
                </p>
              </Card>

              <Card className="p-6 space-y-3 ring-2 ring-chart-4/30 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-chart-4 to-chart-4/70 rounded-lg flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Badge className="mb-1 text-xs bg-chart-4 text-white">Etapa 4</Badge>
                    <h3 className="text-xl font-bold text-chart-4">Revitalização da Pele</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Qualidade e textura da pele. Promove hidratação profunda e luminosidade.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center">Por que funciona?</h2>
            <div className="grid gap-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Abordagem Integral</h3>
                    <p className="text-sm text-muted-foreground">
                      Avaliamos e tratamos seu rosto como um sistema integrado, garantindo resultados harmoniosos e naturais.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-chart-2">2</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Baseado em Ciência</h3>
                    <p className="text-sm text-muted-foreground">
                      Cada etapa é fundamentada em estudos científicos e anatomia facial, garantindo segurança e eficácia.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-chart-3">3</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">100% Personalizado</h3>
                    <p className="text-sm text-muted-foreground">
                      Cada protocolo é desenhado exclusivamente para você, respeitando suas características únicas.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-5xl w-full space-y-6">
            <h2 className="text-4xl font-bold text-center">Antes & Depois</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5 space-y-3">
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Antes do Tratamento</p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">Caso 1</Badge>
                  <p className="text-xs text-muted-foreground">
                    Paciente de 45 anos com perda de volume e flacidez facial
                  </p>
                </div>
              </Card>

              <Card className="p-5 space-y-3 ring-2 ring-primary/30">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Após Protocolo Dermalift</p>
                </div>
                <div className="space-y-1">
                  <Badge className="bg-primary text-primary-foreground text-xs">Resultado</Badge>
                  <p className="text-xs text-muted-foreground">
                    Restauração da sustentação, harmonização facial e revitalização
                  </p>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Antes do Tratamento</p>
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">Caso 2</Badge>
                  <p className="text-xs text-muted-foreground">
                    Paciente de 38 anos buscando harmonização e definição facial
                  </p>
                </div>
              </Card>

              <Card className="p-5 space-y-3 ring-2 ring-chart-2/30">
                <div className="aspect-[4/3] bg-gradient-to-br from-chart-2/20 to-chart-3/20 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Após Protocolo Dermalift</p>
                </div>
                <div className="space-y-1">
                  <Badge className="bg-chart-2 text-white text-xs">Resultado</Badge>
                  <p className="text-xs text-muted-foreground">
                    Proporções equilibradas, contorno definido e pele luminosa
                  </p>
                </div>
              </Card>
            </div>
            <p className="text-center text-xs text-muted-foreground pt-2">
              *Resultados individuais podem variar. Fotos meramente ilustrativas.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center">Seu Plano Personalizado</h2>
            <Card className="p-8 space-y-6">
              <p className="text-lg text-center text-foreground">
                Cada paciente é único, e seu tratamento também deve ser.
              </p>
              <div className="grid gap-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Avaliação Completa</h3>
                    <p className="text-sm text-muted-foreground">
                      Análise detalhada das suas características faciais, histórico e objetivos estéticos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-chart-2 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Protocolo Customizado</h3>
                    <p className="text-sm text-muted-foreground">
                      Criação do seu protocolo exclusivo, combinando as 4 etapas de acordo com suas necessidades.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-chart-3 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Acompanhamento Contínuo</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitoramento dos resultados e ajustes quando necessário para garantir a excelência.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 7,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16 bg-gradient-to-br from-primary/5 via-background to-chart-3/5">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center">Segurança e Experiência</h2>
            <div className="grid gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Profissionais Certificados</h3>
                    <p className="text-sm text-muted-foreground">
                      Equipe com formação internacional e anos de experiência em harmonização facial.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chart-2 to-chart-2/70 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Produtos Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Produtos aprovados pela ANVISA e reconhecidos internacionalmente pela qualidade.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-chart-3 to-chart-3/70 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Ambiente Confortável</h3>
                    <p className="text-sm text-muted-foreground">
                      Clínica moderna e acolhedora para uma experiência única de cuidado e bem-estar.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-16 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10">
          <div className="max-w-4xl text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Vamos montar seu plano?
              </h2>
              <p className="text-xl text-muted-foreground">
                Chegou a hora de conhecer o protocolo exclusivo criado para você
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 h-auto bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                onClick={goToQuoteBuilder}
                data-testid="button-start-protocol"
              >
                Iniciar Meu Protocolo Dermalift
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-sm text-muted-foreground">
                Nosso especialista vai apresentar seu plano personalizado
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => setLocation("/protocolo-dermalift")}
        data-testid="button-close-presentation"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0">
              {slide.component}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          data-testid="button-prev-slide"
          className="bg-background/80 backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex 
                  ? "bg-primary w-8" 
                  : "bg-muted-foreground/30 hover-elevate"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              data-testid={`button-slide-${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={!canScrollNext}
          data-testid="button-next-slide"
          className="bg-background/80 backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
