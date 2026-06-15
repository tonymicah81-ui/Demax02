'use client';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadToCloudinary } from '@/lib/cloudinaryService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Camera } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const profile = user?.profile;
  const username = profile && 'username' in profile ? profile.username : '';
  const phone = profile && 'phoneNumber' in profile ? profile.phoneNumber : '';

  const [form, setForm] = useState({ username, phone });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
      toast('Avatar updated!', 'success');
    } catch {
      toast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { username: form.username, phoneNumber: form.phone });
      toast('Profile updated!', 'success');
    } catch {
      toast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = profile && 'avatarUrl' in profile ? profile.avatarUrl : undefined;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-black dark:text-white mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] overflow-hidden flex items-center justify-center text-white font-black text-xl">
            {avatarUrl ? <Image src={avatarUrl} alt="avatar" width={64} height={64} className="object-cover" /> : username.charAt(0).toUpperCase()}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center cursor-pointer">
            <Camera className="w-3 h-3 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="font-bold dark:text-white">{username}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          {uploading && <p className="text-xs text-[var(--color-primary)] mt-0.5">Uploading...</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-white/10 space-y-4">
        <Input label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
        <Input label="Phone number" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
        <Button type="submit" loading={saving} className="w-full">Save changes</Button>
      </form>
    </div>
  );
}
