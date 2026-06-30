'use client';

import { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    const success = onLogin(email, password);
    if (!success) {
      setError('Invalid email or password');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-3 rounded-lg">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            HILIRISET LPDP · Platform Aerial ULV-Fogging dengan Kontrol Droplet Adaptif​
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Weekly Progress Management System
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abdul"
                className="w-full px-4 py-2 rounded-lg border border-border bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-muted-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-border bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium text-foreground">Student Accounts:</p>
                <p className="text-muted-foreground">abdul / abdul123</p>
                <p className="text-muted-foreground">divo / divo123</p>
                <p className="text-muted-foreground">rendy / rendy123</p>
                <p className="text-muted-foreground">asri / asri123</p>
                <p className="text-muted-foreground">boby / boby123</p>
                <p className="text-muted-foreground">tegar / tegar123</p>
              </div>
              <div className="pt-2">
                <p className="font-medium text-foreground">Supervisor Account:</p>
                <p className="text-muted-foreground">supervisor / supervisor123</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
