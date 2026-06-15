'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '@/lib/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black dark:text-white">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com" icon={<Mail className="w-4 h-4" />} required />
          <Input label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" icon={<Lock className="w-4 h-4" />}
            rightElement={<button type="button" onClick={() => setShowPass(v => !v)} className="text-gray-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
            required />
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[var(--color-primary)] font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
