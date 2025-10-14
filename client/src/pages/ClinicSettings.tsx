import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertClinicSettingsSchema, type InsertClinicSettings, type ClinicSettings } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ClinicSettings() {
  const { toast } = useToast();

  // Query to fetch clinic settings
  const { data: settings, isLoading } = useQuery<ClinicSettings | null>({
    queryKey: ["/api/clinic-settings"],
  });

  // Form setup with validation
  const form = useForm<InsertClinicSettings>({
    resolver: zodResolver(insertClinicSettingsSchema),
    defaultValues: {
      clinicName: "",
      cnpj: "",
      address: "",
      phone: "",
      email: "",
      monthlyGoal: undefined,
      conversionGoal: undefined,
      newPatientsGoal: undefined,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        clinicName: settings.clinicName || "",
        cnpj: settings.cnpj || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        monthlyGoal: settings.monthlyGoal ? parseFloat(settings.monthlyGoal as string) : undefined,
        conversionGoal: settings.conversionGoal ? parseFloat(settings.conversionGoal as string) : undefined,
        newPatientsGoal: settings.newPatientsGoal || undefined,
      });
    }
  }, [settings, form]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async (data: InsertClinicSettings) => {
      const res = await apiRequest("PUT", "/api/clinic-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas!",
        description: "As configurações da clínica foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClinicSettings) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Configurações da Clínica</h1>
        <p className="text-muted-foreground">Gerencie informações e configurações da sua clínica</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clinicName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Clínica</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-clinic-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-cnpj" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço Completo</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" value={field.value || ""} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Metas e Objetivos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="monthlyGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Mensal (R$)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-monthly-goal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="conversionGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta de Conversão (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-conversion-goal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPatientsGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Novos Pacientes/Mês</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-new-patients-goal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Logo da Clínica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center h-32 rounded-md border-2 border-dashed bg-muted hover-elevate">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Logo atual</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-upload-logo">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    O logo será usado em orçamentos e documentos PDF
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
