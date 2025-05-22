import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    let token = searchParams.get('access_token');
    // fallback: parse access_token from the hash
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1)); // remove '#'
      token = hashParams.get('access_token');
    }
    if (!accessToken) {
      navigate('/login');
      toast({
        title: "Invalid link",
        description: "The password reset link is invalid",
        variant: "destructive",
      });
    }
  }, [searchParams, navigate]);

  const handleResetPassword = async (): Promise<void> => {
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully!",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      <div className="text-center space-y-2">
        <img
          src="/Logo1.png"
          alt="Jiffi Fi Logo"
          className="mx-auto h-24 w-24"
        />
        <h1 className="text-2xl font-bold">Set New Password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Key size={18} />
            </div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Button
          onClick={handleResetPassword}
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
};

export default ResetPassword;