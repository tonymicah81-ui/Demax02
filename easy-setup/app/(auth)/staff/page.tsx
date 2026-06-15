'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginStaff } from '@/lib/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { Logo } from '@/components/ui/Logo';

export default function StaffLoginPage() {
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
      await loginStaff(email, password);
      router.replace('/admin/dashboard');
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Staff Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Authorized personnel only</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="staff@platform.com" icon={<Mail className="w-4 h-4" />} required />
          <Input label="Password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" icon={<Lock className="w-4 h-4" />}
            rightElement={<button type="button" onClick={() => setShowPass(v => !v)} className="text-gray-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
            required />
          <Button type="submit" loading={loading} className="w-full">Sign in to staff portal</Button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-4">Not a staff member? <a href="/login" className="text-gray-400 hover:text-white">User login →</a></p>
      </div>
    </div>
  );
}
