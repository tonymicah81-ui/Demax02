import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2, Pin, PinOff, Loader2, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../AuthContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { subscribeToNotes, addNote, deleteNote, toggleNotePin, updateNote, UserNote } from "../../lib/noteService";
import { cn } from "../../utils/cn";

interface UserNotepadProps {
  userId: string;
}

export function UserNotepad({ userId }: UserNotepadProps) {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const unsub = subscribeToNotes(userId, (n) => {
      setNotes(n);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !user) return;
    setAdding(true);
    try {
      await addNote(userId, newText.trim(), user.uid, profile?.username || "Admin");
      setNewText("");
      setShowInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editText.trim()) return;
    try {
      await updateNote(userId, noteId, editText.trim());
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (note: UserNote) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const pinned = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight">Admin Notes</h3>
          {notes.length > 0 && (
            <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase">
              {notes.length}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className="gap-1.5 h-8 text-[10px] bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-3 h-3" /> Add Note
        </Button>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.form
            onSubmit={handleAdd}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              <textarea
                autoFocus
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Write a note about this client..."
                rows={3}
                className="w-full bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-amber-400 transition-all resize-none dark:text-white"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={!newText.trim() || adding} size="sm" className="gap-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                  {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowInput(false); setNewText(""); }} className="h-8 text-[10px]">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-8 text-center opacity-30">
          <StickyNote className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="text-[10px] font-black uppercase tracking-widest">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sorted.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "p-4 rounded-2xl border transition-all group",
                  note.pinned
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30"
                    : "bg-slate-50 dark:bg-slate-950 border-brand-border dark:border-white/5"
                )}
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      className="w-full bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all resize-none dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(note.id)} className="text-[9px] font-black uppercase bg-brand-accent text-white px-3 py-1.5 rounded-lg hover:bg-brand-accent/90 flex items-center gap-1"><Check className="w-3 h-3" /> Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-lg flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {note.pinned && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 mb-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <p className="text-sm text-brand-text-bold dark:text-white leading-relaxed">{note.text}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-2 uppercase">
                        {note.authorName} · {note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => toggleNotePin(userId, note.id, !note.pinned)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                        title={note.pinned ? "Unpin" : "Pin"}
                      >
                        {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => startEdit(note)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-accent hover:bg-brand-accent/10 transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNote(userId, note.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
