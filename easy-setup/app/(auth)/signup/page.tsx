'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Phone, Tag } from 'lucide-react';
import { registerUser } from '@/lib/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { Logo } from '@/components/ui/Logo';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '', confirm: '', referral: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast('Passwords do not match', 'error'); return; }
    if (form.password.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    setLoading(true);
    try {
      await registerUser({ username: form.username, email: form.email, phoneNumber: form.phone, password: form.password, referralCode: form.referral || undefined });
      router.replace('/dashboard');
    } catch (err: any) {
      toast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="text-2xl font-black dark:text-white">Create account</h1>
          <p className="text-sm text-gray-400 mt-1">Join the platform</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Username" value={form.username} onChange={e => update('username', e.target.value)}
              placeholder="Your name" icon={<User className="w-4 h-4" />} required />
            <Input label="Phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+0 000 000 0000" icon={<Phone className="w-4 h-4" />} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)}
            placeholder="you@email.com" icon={<Mail className="w-4 h-4" />} required />
          <Input label="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
            placeholder="Min 8 characters" icon={<Lock className="w-4 h-4" />}
            rightElement={<button type="button" onClick={() => setShowPass(v => !v)} className="text-gray-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
            required />
          <Input label="Confirm password" type={showPass ? 'text' : 'password'} value={form.confirm} onChange={e => update('confirm', e.target.value)}
            placeholder="Repeat password" icon={<Lock className="w-4 h-4" />} required />
          <Input label="Referral code (optional)" value={form.referral} onChange={e => update('referral', e.target.value.toUpperCase())}
            placeholder="Enter a referral code" icon={<Tag className="w-4 h-4" />} />
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
