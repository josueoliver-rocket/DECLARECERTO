import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, TrendingUp, FileText, Settings, HelpCircle, LogOut, User, Upload, PenLine, List, Calculator, ClipboardCheck, FileSpreadsheet, BarChart3, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Carteira",
  url: "/carteira",
  icon: Wallet
}, {
  title: "Investimentos",
  url: "/investimentos",
  icon: TrendingUp
}];

const settingsItems = [{
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}, {
  title: "Ajuda",
  url: "/ajuda",
  icon: HelpCircle
}];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isNotasActive = location.pathname.startsWith("/notas-corretagem") || location.pathname.startsWith("/notas-importadas") || location.pathname.startsWith("/nota/");

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta"
    });
    navigate("/");
  };

  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const userEmail = user?.email || "usuario@email.com";
  const userName = profileName || user?.user_metadata?.nome || userEmail.split("@")[0];

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("nome, avatar_url").eq("id", user.id).single();
      if (data?.nome) {
        setProfileName(data.nome);
      }
      if (data?.avatar_url) {
        // Extract relative path if a full URL was stored
        let filePath = data.avatar_url;
        const marker = "/object/public/avatars/";
        const idx = filePath.indexOf(marker);
        if (idx !== -1) {
          filePath = filePath.substring(idx + marker.length).split("?")[0];
        }
        const { data: signedData } = await supabase.storage
          .from("avatars")
          .createSignedUrl(filePath, 3600);
        const signedUrl = signedData?.signedUrl || null;
        setAvatarUrl(signedUrl);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary shrink-0" />
            {!isCollapsed && <span className="text-xl font-bold text-foreground">DECLARE CERTO</span>}
          </div>
        </div>

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Notas de Corretagem with sub-items */}
              <Collapsible defaultOpen={isNotasActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Notas de Corretagem"
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                        isNotasActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      onClick={() => navigate("/notas-corretagem")}
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <span>Notas de Corretagem</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="cursor-pointer"
                        >
                          <a
                            onClick={() => navigate("/notas-corretagem?tab=nota")}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Importar PDF</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="cursor-pointer"
                        >
                          <a
                            onClick={() => navigate("/notas-corretagem?tab=individual")}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <PenLine className="w-4 h-4" />
                            <span>Lançamento Individual</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className="cursor-pointer"
                        >
                          <a
                            onClick={() => navigate("/notas-importadas")}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <List className="w-4 h-4" />
                            <span>Notas Importadas</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>


              {/* IR de Investimentos */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="IR de Investimentos">
                  <NavLink to="/ir-investimentos" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all" activeClassName="bg-primary/10 text-primary font-medium">
                    <Calculator className="w-5 h-5 shrink-0" />
                    <span>IR de Investimentos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Declaração de IR */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Declaração de IR">
                  <NavLink to="/declaracao-ir" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all" activeClassName="bg-primary/10 text-primary font-medium">
                    <FileSpreadsheet className="w-5 h-5 shrink-0" />
                    <span>Declaração de IR</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Admin link - only for admin */}
              {user?.email === "josue.oliver@hotmail.com" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin">
                    <NavLink to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all" activeClassName="bg-primary/10 text-primary font-medium">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span>Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User */}
      <SidebarFooter className="border-t border-border/50 bg-card">
        <div className="p-3">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full">
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
