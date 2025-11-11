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
  X,
  Check,
  Download
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { generateQuotePDF } from "@/lib/generateQuotePDF";

type DermaliftProtocol = "sustentacao" | "estruturacao" | "embelezamento" | "revitalizacao";

interface SavedQuote {
  id: string;
  patientId: string;
  total: string;
  discount?: string;
  discountPercentage?: string;
  installments?: number;
  downPayment?: string;
  bonusList?: string[];
  status: string;
  createdAt: string;
  notes?: string | null;
  patient: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    id: string;
    quoteId: string;
    procedureId: string;
    quantity: string;
    customPrice?: string;
    subtotal: string;
    note?: string;
    procedure: {
      id: string;
      name: string;
      price: string;
      protocol: DermaliftProtocol;
    };
  }>;
}

export default function Presentation() {
  const [, params] = useRoute("/apresentacao/:quoteId");
  const [, setLocation] = useLocation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const quoteId = params?.quoteId;

  // Query para buscar o quote específico
  const { data: quote, isLoading } = useQuery<SavedQuote>({
    queryKey: ["/api/quotes", quoteId],
    enabled: !!quoteId,
  });

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

  const { toast } = useToast();

  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/quotes/${quoteId}`, { status: "accepted" });
    },
    onSuccess: () => {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      toast({
        title: "Orçamento aceito! 🎉",
        description: "Obrigado por confiar em nossos serviços!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/quotes", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: () => {
      toast({
        title: "Erro ao aceitar orçamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const goToQuoteBuilder = () => {
    setLocation("/protocolo-dermalift");
  };

  const handleAcceptQuote = () => {
    acceptQuoteMutation.mutate();
  };

  const generatePDF = async () => {
    if (!quote) return;
    generateQuotePDF(quote);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando apresentação...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Orçamento não encontrado</p>
          <Button onClick={goToQuoteBuilder}>Voltar ao Protocolo</Button>
        </div>
      </div>
    );
  }

  const slides = [
    {
      id: 1,
      component: (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary/5 via-background to-chart-2/5 text-center px-8 py-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <Sparkles className="w-10 h-10 text-primary" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Dermalift da {quote.patient.name}
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
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-5xl space-y-8">
            <h2 className="text-4xl font-bold text-center mb-8">Os 4 Pilares do Dermalift</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Sustentação</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Resgata a estrutura facial, devolvendo firmeza e definição ao rosto.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-chart-2" />
                  </div>
                  <h3 className="text-xl font-bold text-chart-2">Estruturação</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Harmoniza as proporções faciais, criando equilíbrio e simetria.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-chart-3" />
                  </div>
                  <h3 className="text-xl font-bold text-chart-3">Embelezamento</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Realça os traços naturais, destacando a beleza única de cada rosto.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-chart-4/20 rounded-lg flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-chart-4" />
                  </div>
                  <h3 className="text-xl font-bold text-chart-4">Revitalização</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Renova a pele, trazendo viço, luminosidade e textura saudável.
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
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center mb-6">Por que funciona?</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Visão Integral</h3>
                    <p className="text-muted-foreground">
                      Não tratamos apenas rugas ou linhas isoladas. Avaliamos e harmonizamos toda a estrutura facial.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-chart-2">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Técnica Avançada</h3>
                    <p className="text-muted-foreground">
                      Combinamos os melhores recursos da medicina estética com conhecimento anatômico profundo.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-chart-3">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Resultados Naturais</h3>
                    <p className="text-muted-foreground">
                      O objetivo é realçar sua beleza, não criar um rosto artificial. Você, só que melhor.
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
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-6xl space-y-8">
            <h2 className="text-4xl font-bold text-center mb-8">Antes & Depois</h2>
            <p className="text-xl text-muted-foreground text-center mb-12">
              Veja a transformação real de nossos pacientes
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <p className="text-muted-foreground text-center px-4">
                    Espaço para foto Antes & Depois 1
                  </p>
                </div>
              </Card>
              
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <p className="text-muted-foreground text-center px-4">
                    Espaço para foto Antes & Depois 2
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t">
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-primary">98%</div>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-chart-2">5000+</div>
                <p className="text-sm text-muted-foreground">Pacientes</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-chart-3">15</div>
                <p className="text-sm text-muted-foreground">Anos de Expertise</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      component: (
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-6xl w-full space-y-8">
            <h2 className="text-4xl font-bold text-center mb-6">
              Seu plano, {quote.patient.name}
            </h2>
            <Card className="p-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Procedures List */}
                <div className="space-y-2">
                  {quote.items.map((item, index) => {
                    const protocolStyles = {
                      sustentacao: "bg-primary/10",
                      estruturacao: "bg-[hsl(var(--chart-2))]/10", 
                      embelezamento: "bg-[hsl(var(--chart-3))]/10",
                      revitalizacao: "bg-[hsl(var(--chart-4))]/10",
                    };
                    const badgeStyle = protocolStyles[item.procedure.protocol];
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-6 h-6 rounded-full ${badgeStyle} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.procedure.name}</p>
                            {parseFloat(item.quantity) > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {parseFloat(item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} ml
                              </p>
                            )}
                            {item.note && (
                              <p className="text-xs text-muted-foreground italic">
                                {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-3">
                          {(item.procedure as any).discountedPrice ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through">
                                R$ {(parseFloat(item.procedure.price) * parseFloat(item.quantity)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="font-semibold text-base text-green-600 dark:text-green-500">
                                R$ {parseFloat(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </>
                          ) : (
                            <p className="font-semibold text-sm">
                              R$ {parseFloat(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column - Financial Summary */}
                <div className="space-y-3 border-l pl-8">
                {/* Show subtotal if there's a discount */}
                {quote.discountPercentage && parseFloat(quote.discountPercentage) > 0 && (
                  <>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-muted-foreground">
                        R$ {(parseFloat(quote.total) + parseFloat(quote.discount || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-base">
                      <span className="text-muted-foreground">Desconto ({parseFloat(quote.discountPercentage).toFixed(0)}%)</span>
                      <span className="text-destructive">
                        - R$ {parseFloat(quote.discount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-center text-base">
                  <span className="text-muted-foreground font-semibold">Investimento Total</span>
                  <span className="font-bold text-foreground">
                    R$ {parseFloat(quote.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Down Payment */}
                {quote.downPayment && parseFloat(quote.downPayment) > 0 && (
                  <div className="flex justify-between items-center text-base">
                    <span className="text-muted-foreground">Entrada</span>
                    <span className="text-chart-3">
                      - R$ {parseFloat(quote.downPayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Remaining / Installments */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xl font-bold">
                    {quote.downPayment && parseFloat(quote.downPayment) > 0 ? 'Saldo a Pagar' : (quote.installments && quote.installments > 1 ? 'Investimento' : 'Investimento Total')}
                  </span>
                  <span className="text-3xl font-bold text-primary">
                    {(() => {
                      const totalValue = parseFloat(quote.total);
                      const downPaymentValue = quote.downPayment ? parseFloat(quote.downPayment) : 0;
                      const remaining = totalValue - downPaymentValue;
                      const installments = quote.installments || 1;
                      
                      return installments > 1 ? (
                        <>{installments}x R$ {(remaining / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                      ) : (
                        <>R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                      );
                    })()}
                  </span>
                </div>

                {/* Bonus List */}
                {quote.bonusList && quote.bonusList.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Bônus Inclusos:</p>
                    <ul className="space-y-1">
                      {quote.bonusList.map((bonus, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-chart-3 mt-0.5">✓</span>
                          <span>{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
        <div className="flex flex-col items-center justify-center h-full px-8 py-20">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-4xl font-bold text-center mb-6">Segurança e Experiência</h2>
            <div className="grid gap-6">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-10 h-10 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Produtos Premium</h3>
                    <p className="text-muted-foreground">
                      Utilizamos apenas produtos aprovados pela ANVISA, de marcas reconhecidas internacionalmente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Star className="w-10 h-10 text-chart-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Equipe Especializada</h3>
                    <p className="text-muted-foreground">
                      Profissionais altamente qualificados e em constante atualização nas técnicas mais modernas.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Users className="w-10 h-10 text-chart-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Acompanhamento Completo</h3>
                    <p className="text-muted-foreground">
                      Suporte antes, durante e após o procedimento. Você nunca estará sozinho(a) nessa jornada.
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
        <div className="flex flex-col items-center justify-center h-full px-8 py-20 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
          <div className="max-w-4xl text-center space-y-8">
            <h2 className="text-5xl font-bold mb-4">Vamos dar início?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Comece sua jornada com o Protocolo Dermalift hoje mesmo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleAcceptQuote}
                disabled={acceptQuoteMutation.isPending || quote.status === "accepted"}
                data-testid="button-accept-quote"
              >
                {quote.status === "accepted" ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Orçamento Aceito
                  </>
                ) : (
                  <>
                    Sim, eu quero! 
                    <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={generatePDF}
              className="mt-8"
              data-testid="button-download-pdf"
            >
              <Download className="mr-2 h-5 w-5" />
              Baixar Orçamento PDF
            </Button>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-background z-50 overflow-hidden m-0 p-0">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={goToQuoteBuilder}
        data-testid="button-close-presentation"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 h-full">
              {slide.component}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="bg-background/80 backdrop-blur-sm"
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex 
                  ? "bg-primary w-8" 
                  : "bg-muted-foreground/30"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              data-testid={`button-slide-${index}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="bg-background/80 backdrop-blur-sm"
          data-testid="button-next-slide"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
