import { db, collection, addDoc, doc, updateDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc } from '../firebase';

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_approval'
  | 'revision_requested'
  | 'approved'
  | 'completed';

export interface Milestone {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  order: number;
  status: MilestoneStatus;
  revisionNote?: string;
  completedAt?: any;
  approvedAt?: any;
  createdAt: any;
}

export async function createMilestone(data: {
  projectId: string;
  userId: string;
  title: string;
  description: string;
  order: number;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'project_milestones'), {
    ...data,
    status: 'pending' as MilestoneStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  try {
    const q = query(
      collection(db, 'project_milestones'),
      where('projectId', '==', projectId),
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Milestone[];
  } catch {
    return [];
  }
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  extra?: { revisionNote?: string; completedAt?: any; approvedAt?: any }
): Promise<void> {
  await updateDoc(doc(db, 'project_milestones', milestoneId), {
    status,
    ...(extra || {}),
    updatedAt: serverTimestamp(),
  });
}

export async function approveMilestone(milestoneId: string): Promise<void> {
  await updateMilestoneStatus(milestoneId, 'approved', { approvedAt: serverTimestamp() });
}

export async function requestRevision(milestoneId: string, note: string): Promise<void> {
  await updateMilestoneStatus(milestoneId, 'revision_requested', { revisionNote: note });
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  await deleteDoc(doc(db, 'project_milestones', milestoneId));
}

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  awaiting_approval: 'Awaiting Approval',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  completed: 'Completed',
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  in_progress: 'bg-brand-accent/10 text-brand-accent',
  awaiting_approval: 'bg-amber-500/10 text-amber-500',
  revision_requested: 'bg-red-500/10 text-red-500',
  approved: 'bg-brand-success/10 text-brand-success',
  completed: 'bg-brand-success/10 text-brand-success',
};
