'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { sendPasswordReset } from '@/lib/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      toast(err.message || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-xl font-black dark:text-white mb-2">Check your inbox</h1>
            <p className="text-sm text-gray-400 mb-6">We sent a password reset link to <strong className="dark:text-white">{email}</strong></p>
            <Link href="/login" className="text-[var(--color-primary)] text-sm font-semibold hover:underline">Back to login</Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-8">
              <ArrowLeft className="w-4 h-4" />Back to login
            </Link>
            <h1 className="text-2xl font-black dark:text-white mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" icon={<Mail className="w-4 h-4" />} required />
              <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
