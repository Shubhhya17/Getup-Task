'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import { Ticket, Loader2 } from 'lucide-react';

const DEMO_CREDS = {
  admin:    { email: 'admin@example.com',    password: 'Admin1234!' },
  agent:    { email: 'agent@example.com',    password: 'Agent1234!' },
  customer: { email: 'customer@example.com', password: 'Customer1234!' },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: 'Authentication failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: keyof typeof DEMO_CREDS) => {
    setEmail(DEMO_CREDS[role].email);
    setPassword(DEMO_CREDS[role].password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center auth-bg p-4"
      role="main"
    >
      <div className="w-full max-w-sm">
        {/* Product mark */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: 'hsl(var(--primary) / 0.12)',
                border: '1px solid hsl(var(--primary) / 0.25)',
              }}
              aria-hidden="true"
            >
              <Ticket className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Getup Support</p>
              <p className="text-2xs text-muted-foreground">Support Operations Platform</p>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to access the portal
          </p>
        </div>

        {/* Login form */}
        <div
          className="rounded-lg border border-border p-6 mb-5 shadow-card"
          style={{ background: 'hsl(var(--surface-1))' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Demo access — clearly a secondary section */}
        <div
          className="rounded-lg border border-border p-4 mb-5"
          style={{ background: 'hsl(var(--surface-2))' }}
          aria-label="Demo account access"
        >
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Demo access — fills credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'agent', 'customer'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(role)}
                className={[
                  'text-xs py-1.5 px-2 rounded-md border border-border',
                  'text-muted-foreground hover:text-foreground hover:border-border/80',
                  'transition-colors duration-100 capitalize font-medium',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                ].join(' ')}
                id={`demo-${role}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No account?{' '}
          <Link
            href="/register"
            className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
