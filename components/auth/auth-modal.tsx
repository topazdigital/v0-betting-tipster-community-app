'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useAuthModal } from '@/contexts/auth-modal-context';

const countries = [
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', dialCode: '+256' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'US', name: 'United States', dialCode: '+1' },
];

export function AuthModal() {
  const { isOpen, view, setView, close } = useAuthModal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-mono text-sm font-bold text-primary-foreground">B</span>
              </div>
              {view === 'login' ? 'Welcome back' : 'Create your account'}
            </DialogTitle>
            <DialogDescription>
              {view === 'login'
                ? 'Sign in to access your tips, picks and dashboard.'
                : 'Join the Betcheza community in under a minute.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-3">
          {view === 'login' ? <LoginPanel /> : <RegisterPanel />}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {view === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoginPanel() {
  const { login } = useAuth();
  const { close } = useAuthModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      // Stay on the current page after a successful login.
      close();
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="modal-email">Email</Label>
        <Input
          id="modal-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modal-password">Password</Label>
        <div className="relative">
          <Input
            id="modal-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Demo: <code className="rounded bg-muted px-1">admin@betcheza.co.ke</code> / <code className="rounded bg-muted px-1">admin123</code>
      </p>
    </form>
  );
}

function RegisterPanel() {
  const { register } = useAuth();
  const { close } = useAuthModal();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: 'KE',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry = countries.find((c) => c.code === formData.countryCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    const result = await register({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      displayName: formData.displayName,
      phone: formData.phone ? `${selectedCountry?.dialCode}${formData.phone}` : undefined,
      countryCode: formData.countryCode,
    });
    setIsLoading(false);

    if (result.success) {
      // Stay on the current page after sign-up — the user keeps their context
      // (the match/page they were viewing) and the header now shows their
      // avatar and dashboard menu.
      close();
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="modal-reg-email">Email</Label>
        <Input
          id="modal-reg-email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="modal-reg-username">Username</Label>
          <Input
            id="modal-reg-username"
            placeholder="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modal-reg-display">Display name</Label>
          <Input
            id="modal-reg-display"
            placeholder="Your Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modal-reg-phone">Phone (optional)</Label>
        <div className="flex gap-2">
          <Select
            value={formData.countryCode}
            onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
          >
            <SelectTrigger className="w-28">
              <SelectValue>
                <span className="flex items-center gap-1">
                  <span>{selectedCountry?.code}</span>
                  <span className="text-muted-foreground text-xs">{selectedCountry?.dialCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.code}</span>
                    <span className="text-muted-foreground">{country.dialCode}</span>
                    <span className="text-muted-foreground">{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="modal-reg-phone"
            type="tel"
            placeholder="712345678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
            disabled={isLoading}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modal-reg-password">Password</Label>
        <div className="relative">
          <Input
            id="modal-reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modal-reg-confirm">Confirm password</Label>
        <Input
          id="modal-reg-confirm"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        By creating an account you agree to our Terms and Privacy Policy. You must be 18+.
      </p>
    </form>
  );
}
