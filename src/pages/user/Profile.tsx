import { useAuth } from "../../AuthContext";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default function Profile() {
  const { profile, user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Identity Management</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Portal Protocol v1.2 // User Statistics</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-brand-border dark:border-white/5">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-brand-border dark:border-white/5 overflow-hidden">
              <img src="https://picsum.photos/seed/user/200/200" referrerPolicy="no-referrer" alt="Profile" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                {profile?.username || "Authorized Entity"}
              </h2>
              <p className="text-brand-accent font-black text-[10px] uppercase tracking-[0.3em] mt-1 italic">
                Status::{profile?.status || "active"} // Role::{profile?.role || "standard"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Data Cluster 01</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Designation</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white">{profile?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Relay Address</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Data Cluster 02</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Security Clearance</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase">{profile?.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Initialized At</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white italic">
                      {profile?.createdAt ? new Date(typeof profile.createdAt === 'string' ? profile.createdAt : (profile.createdAt as any).seconds * 1000).toLocaleDateString() : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-brand-border dark:border-white/5 flex gap-4">
            <Button variant="primary" size="sm">Modify Identification</Button>
            <Button variant="outline" size="sm">System Settings</Button>
          </div>
        </Card>

        <div className="space-y-8">
           <Card className="bg-brand-primary text-white border-none shadow-xl shadow-brand-primary/20">
              <CardTitle className="text-white italic uppercase tracking-tighter">Account Status</CardTitle>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                   <div className="w-4 h-4 bg-brand-success rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="text-brand-success font-black uppercase text-xs">Verified Engine</p>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">All protocols green</p>
                </div>
              </div>
           </Card>

           <Card>
              <CardTitle className="tracking-tighter uppercase italic">Security Log</CardTitle>
              <div className="mt-6 space-y-4 font-mono text-[9px] text-slate-400 uppercase leading-relaxed">
                 <p>&gt; LAST LOGIN: {new Date().toLocaleString()}</p>
                 <p>&gt; IP_ADDR: 192.XXX.XX.XX</p>
                 <p>&gt; DEVICE: DESKTOP_PROTOCOL_OS</p>
                 <p className="text-brand-success">&gt; STATUS: IDENTITY_CONFIRMED</p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
