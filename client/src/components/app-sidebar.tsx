import {
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  Package,
  Calculator,
  Presentation as PresentationIcon,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ClinicSettings } from "@shared/schema";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Orçamentos",
    url: "/apresentacao",
    icon: PresentationIcon,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
  },
  {
    title: "Protocolo Dermalift",
    url: "/protocolo-dermalift",
    icon: Calculator,
  },
  {
    title: "Procedimentos",
    url: "/procedures",
    icon: Package,
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Receituário",
    url: "/receituario",
    icon: ClipboardList,
  },
];

const adminItems = [
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: clinicSettings } = useQuery<ClinicSettings>({
    queryKey: ["/api/clinic-settings"],
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <Building2 className="h-6 w-6 text-primary-foreground group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
          </div>
          {/* Some quando a barra está recolhida — sobra só o ícone */}
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="truncate font-serif text-lg font-bold text-foreground">
              {clinicSettings?.clinicName || "Dermaplástica"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">Dra. Flávia Colares</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
