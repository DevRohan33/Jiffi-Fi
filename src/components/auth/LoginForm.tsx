import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
      toast({ title: "Success", description: "Login successful!" });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email first",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Check your email for a password reset link",
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/Logo1.png" 
            alt="Jiffi Fi Logo"
            className="mx-auto h-24 w-24"
          />
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail size={18} />
              </div>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            onClick={handleForgotPassword}
            className="w-full"
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsForgotPassword(false)}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <img
          src="/Logo1.png" 
          alt="Jiffi Fi Logo"
          className="mx-auto h-24 w-24"
        />
        <h1 className="text-2xl font-bold">Login to Jiffi Fi</h1>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>
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
          {loading ? 'Logging in...' : 'Login'}
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
            New user?{' '}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;