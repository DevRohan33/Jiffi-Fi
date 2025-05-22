import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabaseClient';

const Navbar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [credit, setCredit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndUpdateCredit = async () => {
    setLoading(true);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      setLoading(false);
      return;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('credit, last_credit_update')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      console.error("Error fetching user data:", error);
      setLoading(false);
      return;
    }

    let updatedCredit = userData.credit;
    const today = new Date();
    const lastUpdate = userData.last_credit_update
      ? new Date(userData.last_credit_update)
      : new Date(today);
    
    const daysPassed = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPassed > 0 && updatedCredit > 0) {
      updatedCredit = Math.max(0, updatedCredit - daysPassed);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          credit: updatedCredit,
          last_credit_update: today.toISOString().split("T")[0], // store as YYYY-MM-DD
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating credit:", updateError);
      }
    }

    setCredit(updatedCredit);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndUpdateCredit();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="w-full bg-white shadow-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Left Logo */}
          <div className="flex items-center space-x-2">
            <img src="/Logo1.png" alt="Logo" className="w-16 h-16" />
            <span className="text-xl font-bold text-primary hidden sm:block">
              Jiffi Fi
            </span>
          </div>

          {/* Middle Navigation */}
          <div className="flex items-center space-x-2">
            <NavLink to="/dashboard">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={`p-2 ${isActive ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <BarChart size={40} />
                  <span className="hidden sm:inline ml-1">Dashboard</span>
                </Button>
              )}
            </NavLink>

            <NavLink to="/upload">
              {({ isActive }) => (
                <Button
                  variant="ghost"
                  className={`p-2 ${isActive ? 'text-primary bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <FileText size={40} />
                  <span className="hidden sm:inline ml-1">Add Bill</span>
                </Button>
              )}
            </NavLink>
          </div>

          {/* Right Section: Credit + Profile */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Your Credit:</span>
              <span className="text-lg font-extrabold text-primary">
                {loading ? '...' : credit ?? 0}
              </span>
            </div>

            <span className="sm:hidden text-sm font-bold text-primary">
              {loading ? '...' : credit ?? 0}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <User size={22} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => navigate('/payment')}>Add Credit</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Navbar;
