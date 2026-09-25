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
import { Loader2 } from 'lucide-react';

const DEMO_CREDS = {
  admin:    { email: 'admin@example.com',    password: 'Admin1234!' },
  agent:    { email: 'agent@example.com',    password: 'Agent1234!' },
  customer: { email: 'customer@example.com', password: 'Customer1234!' },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
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
    <div className="min-h-screen auth-bg flex items-center justify-center p-4" role="main">
      <div className="w-full max-w-[360px]">

        {/* Product wordmark — typographic only */}
        <div className="mb-10">
          <p className="text-xl font-semibold text-[#1A1A1A] tracking-tight">Getup Support</p>
          <p className="text-sm text-[#6B6B6B] mt-1">Sign in to your account</p>
        </div>

        {/* Login form — white card with hairline border */}
        <div
          className="rounded-lg border border-[#E8E8E5] bg-white px-6 py-6 mb-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
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
              className="w-full mt-1"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Demo access — secondary panel, clearly separated */}
        <div className="rounded border border-[#E8E8E5] bg-[#FAFAF9] px-4 py-3 mb-4">
          <p className="text-xs text-[#6B6B6B] mb-2.5 font-medium">Demo accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'agent', 'customer'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => fillDemo(role)}
                id={`demo-${role}`}
                className={[
                  'text-xs py-1.5 px-2 rounded border border-[#E8E8E5] bg-white',
                  'text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#D1D1CE]',
                  'transition-colors duration-100 capitalize font-medium',
                  'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]',
                ].join(' ')}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#6B6B6B]">
          No account?{' '}
          <Link
            href="/register"
            className="text-[#2563EB] hover:underline focus-visible:outline-none"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
