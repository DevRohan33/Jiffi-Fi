import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';


const RegisterForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
      toast({ title: "Success", description: "Account created successfully!" });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <img
        src="/Logo1.png" 
        alt="Jiffi Fi Logo"
        className="mx-auto h-24 w-24"
      />
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">Start tracking your bills with ease</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Mail size={18} />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Lock size={18} />
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </Button>

        <div className="flex justify-between gap-4 pt-2">
          <Button variant="outline" className="w-full flex justify-center p-2">
            <img src="/GOOGLE.png" alt="Google" className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="w-full flex justify-center p-2">
            <img src="/CALL.png" alt="Phone" className="h-5 w-5" />
          </Button>
        </div>

                <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account ?{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </p>
        </div>

      </form>
    </div>
  );
};

export default RegisterForm;
