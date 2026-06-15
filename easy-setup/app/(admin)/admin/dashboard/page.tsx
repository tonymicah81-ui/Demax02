'use client';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, openChats: 0 });

  useEffect(() => {
    async function load() {
      const [userSnap, chatSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'chats'), where('status', '==', 'open'))),
      ]);
      setStats({ users: userSnap.data().count, openChats: chatSnap.data().count });
    }
    load();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black dark:text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: stats.users, color: 'bg-blue-500' },
          { label: 'Open Support Chats', value: stats.openChats, color: 'bg-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <div className={`w-2 h-8 rounded-full ${s.color} mb-3`} />
            <p className="text-3xl font-black dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {/* ── Add more admin widgets below ─────────────────────────── */}
    </div>
  );
}
