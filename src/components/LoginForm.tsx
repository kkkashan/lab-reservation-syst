import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, UserPlus } from '@phosphor-icons/react';
import { authApi } from '@/lib/api';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!name.trim()) { setError('Name is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authApi.register(name.trim(), email.trim(), password);
      setSuccess('Account created successfully! You can now sign in.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setMode('login');
    setError(''); setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground text-2xl font-bold">◉</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">LabOps Sentinel</h1>
          <p className="text-sm text-muted-foreground mt-1">Lab Server Management Platform</p>
        </div>

        {/* Login / Register Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                {mode === 'login' ? <UserCircle size={22} /> : <UserPlus size={22} />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); resetForm(); }}
              >
                {mode === 'login' ? 'Create Account →' : '← Back to Login'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}
              {success && <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md">{success}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                  : (mode === 'login' ? 'Sign In' : 'Create Account')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Fill (only on login) */}
        {mode === 'login' && (
          <Card className="border shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Quick Fill (Demo)</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                type="button"
                onClick={() => handleQuickLogin('admin@lab-booking.com', 'password')}
              >
                👩‍💼 Admin — admin@lab-booking.com
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 px-1">
                Default password: <code className="font-mono bg-muted px-1 rounded">password</code>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
