import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Upload, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClinicSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Configurações da Clínica</h1>
        <p className="text-muted-foreground">Gerencie informações e configurações da sua clínica</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinic-name">Nome da Clínica</Label>
                  <Input
                    id="clinic-name"
                    defaultValue="Clínica Dermalift"
                    data-testid="input-clinic-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    defaultValue="12.345.678/0001-90"
                    data-testid="input-cnpj"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  defaultValue="Av. Paulista, 1000 - São Paulo, SP"
                  data-testid="input-address"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    defaultValue="(11) 3000-0000"
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="contato@dermalift.com"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Metas e Objetivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="monthly-goal">Meta Mensal</Label>
                  <Input
                    id="monthly-goal"
                    defaultValue="R$ 150.000"
                    data-testid="input-monthly-goal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conversion-goal">Meta de Conversão</Label>
                  <Input
                    id="conversion-goal"
                    defaultValue="70%"
                    data-testid="input-conversion-goal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-patients-goal">Novos Pacientes/Mês</Label>
                  <Input
                    id="new-patients-goal"
                    defaultValue="30"
                    data-testid="input-new-patients-goal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {["Dra. Juliana Silva", "Dr. Carlos Santos", "Dra. Marina Costa"].map(
                  (member, index) => (
                    <div
                      key={member}
                      className="flex items-center justify-between rounded-md border p-3"
                      data-testid={`member-${index + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                          {member.split(" ")[1][0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member}</p>
                          <Badge variant="secondary" className="text-xs">
                            {index === 0 ? "Admin" : "Atendente"}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-member-${index + 1}`}>
                        Editar
                      </Button>
                    </div>
                  )
                )}
              </div>
              <Button variant="outline" className="w-full" data-testid="button-add-team-member">
                Adicionar Membro
              </Button>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Plano Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">Premium</Badge>
                  <p className="text-2xl font-bold text-foreground">R$ 299/mês</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários</span>
                    <span className="font-medium text-foreground">3 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orçamentos/mês</span>
                    <span className="font-medium text-foreground">67 / 200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Armazenamento</span>
                    <span className="font-medium text-foreground">2.4 GB / 50 GB</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-upgrade-plan">
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" data-testid="button-cancel">
          Cancelar
        </Button>
        <Button data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
