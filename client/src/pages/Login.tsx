import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Campo com fundo suave, cantos arredondados e ícone à esquerda. */
const fieldClasses =
  "h-12 rounded-2xl pl-11 text-base transition-colors " +
  // claro: leve tingimento roxo | escuro: superfície mais clara que o card, com borda visível
  "border-transparent bg-primary/[0.06] dark:border-border/60 dark:bg-muted/70 " +
  "placeholder:text-muted-foreground/60 " +
  "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-sm rounded-[32px] border-border/50 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 px-8 pt-9 pb-2 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <CardDescription className="text-balance text-sm">
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-9 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/50 dark:text-[hsl(var(--ring)/0.65)]" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        data-testid="input-email"
                        className={fieldClasses}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/50 dark:text-[hsl(var(--ring)/0.65)]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        data-testid="input-password"
                        className={`${fieldClasses} pr-12`}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/70 transition-colors hover:text-primary"
                        onClick={() => setShowPassword((v) => !v)}
                        data-testid="button-toggle-password"
                        tabIndex={-1}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="group h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-shadow hover:shadow-primary/30"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                "Entrando..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Entrar
                  <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
