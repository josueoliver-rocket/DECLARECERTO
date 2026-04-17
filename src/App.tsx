import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy load all page components
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Carteira = lazy(() => import("./pages/Carteira"));
const NotasCorretagem = lazy(() => import("./pages/NotasCorretagem"));
const Investimentos = lazy(() => import("./pages/Investimentos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AtivoDetalhes = lazy(() => import("./pages/AtivoDetalhes"));
const Planos = lazy(() => import("./pages/Planos"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const NotaDetalhes = lazy(() => import("./pages/NotaDetalhes"));
const NotasImportadas = lazy(() => import("./pages/NotasImportadas"));
const IRInvestimentos = lazy(() => import("./pages/IRInvestimentos"));
const DeclaracaoIR = lazy(() => import("./pages/DeclaracaoIR"));
const Rentabilidade = lazy(() => import("./pages/Rentabilidade"));
const Termos = lazy(() => import("./pages/Termos"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/termos" element={<Termos />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/carteira" element={<ProtectedRoute><Carteira /></ProtectedRoute>} />
            <Route path="/investimentos" element={<ProtectedRoute><Investimentos /></ProtectedRoute>} />
            <Route path="/notas-corretagem" element={<ProtectedRoute><NotasCorretagem /></ProtectedRoute>} />
            <Route path="/nota/:notaId" element={<ProtectedRoute><NotaDetalhes /></ProtectedRoute>} />
            <Route path="/notas-importadas" element={<ProtectedRoute><NotasImportadas /></ProtectedRoute>} />
            <Route path="/ir-investimentos" element={<ProtectedRoute><IRInvestimentos /></ProtectedRoute>} />
            <Route path="/declaracao-ir" element={<ProtectedRoute><DeclaracaoIR /></ProtectedRoute>} />
            <Route path="/rentabilidade" element={<ProtectedRoute><Rentabilidade /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/ativo/:ativoName" element={<ProtectedRoute><AtivoDetalhes /></ProtectedRoute>} />
            <Route path="/ajuda" element={<ProtectedRoute><Ajuda /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
