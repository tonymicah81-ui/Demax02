import { useState, useRef } from "react";
import { useAuth } from "../../AuthContext";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { User, Mail, Shield, Calendar, Edit2, Save, Loader2, Camera, X, CheckCircle2, Phone, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, doc, updateDoc } from "../../firebase";
import { uploadToCloudinary, validateFile } from "../../lib/cloudinary";
import { cn } from "../../utils/cn";

export default function Profile() {
  const { profile, user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", phoneNumber: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const photoAbortRef = useRef<AbortController | null>(null);

  const openEdit = () => {
    setEditForm({ username: profile?.username || "", phoneNumber: profile?.phoneNumber || "" });
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoError("");
    setSaveError("");
    setSaveSuccess(false);
    setShowEdit(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, "image");
    if (err) { setPhotoError(err); return; }
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      let photoUrl = profile?.photoURL || "";
      if (photoFile) {
        setPhotoUploading(true);
        photoAbortRef.current = new AbortController();
        try {
          const result = await uploadToCloudinary(
            photoFile,
            (pct) => setPhotoProgress(pct),
            "image",
            photoAbortRef.current.signal
          );
          photoUrl = result.secure_url;
        } catch (err: any) {
          if (err?.name === "AbortError") { setSaving(false); setPhotoUploading(false); return; }
          setPhotoError("Photo upload failed. Profile details will still be saved.");
        } finally {
          setPhotoUploading(false);
        }
      }

      const updates: Record<string, any> = {
        username: editForm.username.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
      };
      if (photoUrl && photoUrl !== profile?.photoURL) {
        updates.photoURL = photoUrl;
      }

      await updateDoc(doc(db, "users", user.uid), updates);

      if (profile?.role !== "client") {
        await updateDoc(doc(db, "admins", user.uid), updates).catch(() => {});
      }

      setSaveSuccess(true);
      setTimeout(() => { setShowEdit(false); setSaveSuccess(false); }, 1500);
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = profile?.photoURL || "";
  const memberSince = profile?.createdAt
    ? new Date(typeof profile.createdAt === "string" ? profile.createdAt : (profile.createdAt as any).seconds * 1000).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Account details and settings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-6 pb-8 border-b border-brand-border dark:border-white/5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-brand-border dark:border-white/5 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile?.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button
                onClick={openEdit}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-lg hover:bg-brand-accent/90 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                {profile?.username || "User"}
              </h2>
              <p className="text-brand-accent font-black text-[10px] uppercase tracking-[0.3em] mt-1">
                {profile?.status || "Active"} · {profile?.role || "Standard"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Personal Info</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Username</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white">{profile?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Phone</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white">{profile?.phoneNumber || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Email</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Account Info</label>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Role</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white uppercase">{profile?.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Member Since</p>
                    <p className="text-sm font-bold text-brand-text-bold dark:text-white italic">{memberSince}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-brand-border dark:border-white/5 flex gap-4">
            <Button onClick={openEdit} variant="primary" size="sm" className="gap-2">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </Button>
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
                <p className="text-brand-success font-black uppercase text-xs">Verified</p>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Account in good standing</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="tracking-tighter uppercase italic">Last Login</CardTitle>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span className="text-slate-400">Date</span>
                <span className="text-brand-text-bold dark:text-white font-mono">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span className="text-slate-400">Time</span>
                <span className="text-brand-text-bold dark:text-white font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span className="text-slate-400">Status</span>
                <span className="text-brand-success">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-brand-border dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center"><Edit2 className="w-4 h-4 text-brand-accent" /></div>
                  <h2 className="text-lg font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Edit Profile</h2>
                </div>
                <button onClick={() => setShowEdit(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {saveSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8 flex flex-col items-center gap-4 text-center">
                    <CheckCircle2 className="w-12 h-12 text-brand-success" />
                    <p className="text-sm font-black uppercase tracking-tight text-brand-text-bold dark:text-white">Profile updated!</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-3 pb-4 border-b border-brand-border dark:border-white/5">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-brand-border dark:border-white/5">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : avatarUrl ? (
                            <img src={avatarUrl} alt={profile?.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-slate-400" /></div>
                          )}
                        </div>
                        <input type="file" id="photo-edit-upload" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                        <label
                          htmlFor="photo-edit-upload"
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-accent text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-brand-accent/90 transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Click camera to change photo</p>
                      {photoUploading && (
                        <div className="w-full">
                          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-brand-accent rounded-full" animate={{ width: `${photoProgress}%` }} />
                          </div>
                          <p className="text-[8px] text-slate-400 text-center mt-1">{photoProgress}%</p>
                        </div>
                      )}
                      {photoError && <p className="text-[10px] text-red-500 font-bold">{photoError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={editForm.username}
                          onChange={(e) => setEditForm(p => ({ ...p, username: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                          placeholder="Your name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                          placeholder="+0 000 000 0000"
                        />
                      </div>
                    </div>

                    {saveError && (
                      <p className="text-[10px] text-red-500 font-bold p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">{saveError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={saving || photoUploading}
                      className="w-full h-12 bg-brand-accent text-white gap-2"
                    >
                      {saving || photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </Button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
