
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BillProvider } from "./contexts/BillContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import UploadBill from "./pages/UploadBill";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Profile from "./pages/Profile";
import PaymentPage from "./pages/Payment";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
    });
    
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>; // Optional loading screen

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BillProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Index />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadBill />} />
                <Route path="/profile" element={<Profile/>}/>
                <Route path="/payment" element={<PaymentPage/>}/>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </BillProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;