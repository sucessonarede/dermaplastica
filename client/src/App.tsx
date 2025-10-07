import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { RequireAuth } from "@/components/RequireAuth";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import QuoteBuilder from "@/pages/QuoteBuilder";
import Procedures from "@/pages/Procedures";
import Reports from "@/pages/Reports";
import ClinicSettings from "@/pages/ClinicSettings";
import Presentation from "@/pages/Presentation";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <RequireAuth>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-4 border-b bg-background px-4 py-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <UserMenu />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-chart-2/5 p-4">
      {children}
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isPublicRoute = location === "/login" || location === "/register";

  if (isPublicRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </Switch>
      </PublicLayout>
    );
  }

  return (
    <ProtectedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/patients" component={Patients} />
        <Route path="/protocolo-dermalift" component={QuoteBuilder} />
        <Route path="/quotes" component={QuoteBuilder} />
        <Route path="/procedures" component={Procedures} />
        <Route path="/reports" component={Reports} />
        <Route path="/clinic" component={ClinicSettings} />
        <Route path="/settings" component={ClinicSettings} />
        <Route path="/apresentacao/:quoteId" component={Presentation} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
