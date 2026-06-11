import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { loadSetting, verifyPin } from '../../lib/platformSettings';
import { db, addDoc, collection, serverTimestamp } from '../../firebase';
import { Logo } from '../ui/Logo';

const VAULT_SESSION_KEY = 'dt_vault_session';
const VAULT_ATTEMPTS_KEY = 'dt_vault_attempts';
const VAULT_LOCK_KEY = 'dt_vault_locked_until';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

interface VaultGateProps {
  children: React.ReactNode;
}

function getAttempts(): number {
  return parseInt(localStorage.getItem(VAULT_ATTEMPTS_KEY) || '0', 10);
}

function setAttempts(n: number) {
  localStorage.setItem(VAULT_ATTEMPTS_KEY, String(n));
}

function getLockExpiry(): number {
  return parseInt(localStorage.getItem(VAULT_LOCK_KEY) || '0', 10);
}

function setLockExpiry(ts: number) {
  localStorage.setItem(VAULT_LOCK_KEY, String(ts));
}

function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(VAULT_SESSION_KEY) === 'true';
}

function unlockSession() {
  sessionStorage.setItem(VAULT_SESSION_KEY, 'true');
  localStorage.removeItem(VAULT_ATTEMPTS_KEY);
  localStorage.removeItem(VAULT_LOCK_KEY);
}

async function recordFailedAttempts(attempts: number) {
  try {
    await addDoc(collection(db, 'vault_alerts'), {
      type: 'failed_attempts',
      attempts,
      lockedUntil: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch {
    // Silent — Firestore rules may block unauthenticated writes
  }
}

export function VaultGate({ children }: VaultGateProps) {
  const [status, setStatus] = useState<'loading' | 'open' | 'locked' | 'pin_entry'>('loading');
  const [pinHash, setPinHash] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function initialize() {
      const lockExpiry = getLockExpiry();
      if (lockExpiry > Date.now()) {
        setLockRemaining(Math.ceil((lockExpiry - Date.now()) / 1000));
        setStatus('locked');
        startLockCountdown(lockExpiry);
        return;
      }

      try {
        const vaultConfig = await loadSetting('vault');

        if (!vaultConfig.active) {
          setStatus('open');
          return;
        }

        if (isSessionUnlocked()) {
          setStatus('open');
          return;
        }

        setPinHash(vaultConfig.pinHash);
        setStatus('pin_entry');
      } catch {
        setStatus('open');
      }
    }

    initialize();
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current); };
  }, []);

  function startLockCountdown(expiry: number) {
    lockTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(lockTimerRef.current!);
        setAttempts(0);
        localStorage.removeItem(VAULT_LOCK_KEY);
        setStatus('pin_entry');
      } else {
        setLockRemaining(remaining);
      }
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setChecking(true);
    setError('');

    try {
      const valid = await verifyPin(pin, pinHash);

      if (valid) {
        unlockSession();
        setStatus('open');
      } else {
        const attempts = getAttempts() + 1;
        setAttempts(attempts);
        const remaining = MAX_ATTEMPTS - attempts;

        if (attempts >= MAX_ATTEMPTS) {
          const lockExpiry = Date.now() + LOCK_DURATION_MS;
          setLockExpiry(lockExpiry);
          await recordFailedAttempts(attempts);
          setLockRemaining(Math.ceil(LOCK_DURATION_MS / 1000));
          setStatus('locked');
          startLockCountdown(lockExpiry);
        } else {
          setError(`ACCESS_DENIED — ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`);
          setPin('');
        }
      }
    } catch {
      setError('System error. Try again.');
    } finally {
      setChecking(false);
    }
  }

  function formatLock(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-success animate-spin" />
      </div>
    );
  }

  if (status === 'open') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-success/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col items-center gap-4 text-center">
            <Logo size="md" showText={false} className="bg-white/5 p-3 rounded-2xl" />
            <div>
              <p className="text-[10px] font-black text-brand-success uppercase tracking-[0.3em]">Restricted Access</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vault Security Protocol</p>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {status === 'locked' ? (
                <motion.div
                  key="locked"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-red-950/30 border border-red-900/30 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg uppercase tracking-tighter">VAULT LOCKED</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Too many failed attempts</p>
                  </div>
                  <div className="bg-red-950/20 border border-red-900/20 rounded-2xl p-6">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Lockout expires in</p>
                    <p className="text-3xl font-mono font-black text-red-400">{formatLock(lockRemaining)}</p>
                  </div>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">System administrator has been notified</p>
                </motion.div>
              ) : (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-brand-success/10 border border-brand-success/20 flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-7 h-7 text-brand-success" />
                    </div>
                    <h2 className="text-white font-black text-xl uppercase tracking-tighter">Vault Access</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Enter security PIN to continue</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-success" />
                      <input
                        type="password"
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        autoFocus
                        placeholder="••••••"
                        className="w-full bg-brand-success/5 border border-brand-success/20 rounded-xl pl-12 pr-4 py-4 text-sm font-black text-brand-success text-center tracking-[0.5em] focus:outline-none focus:border-brand-success transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={checking || !pin}
                      className="w-full h-12 bg-brand-success hover:bg-brand-success/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFY ACCESS'}
                    </button>
                  </form>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-xl"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    Authorized personnel only
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
