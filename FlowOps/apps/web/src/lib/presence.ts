import { create } from 'zustand';

export interface PresenceMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  profileUrl: string;
  status: 'VIEWING' | 'EDITING';
  activeNodeId?: string | null;
  lastHeartbeatAt: number; // Unix epoch ms
  ttlSeconds: number;      // DynamoDB TTL expiration timestamp
  color: string;
}

export interface DynamoDBPresenceRecord {
  PK: string; // e.g. PRESENCE#wf-order-fulfillment-prod
  SK: string; // e.g. USER#usr_sarah_chen
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  avatarUrl: string;
  status: 'VIEWING' | 'EDITING';
  activeNodeId: string | null;
  lastHeartbeatAt: string; // ISO 8601
  ttl: number; // Unix epoch seconds (TTL attribute for DynamoDB automatic expiration)
}

const INITIAL_MEMBERS: PresenceMember[] = [
  {
    userId: 'usr_sarah_chen',
    name: 'Sarah Chen',
    email: 'sarah.c@flowops.cloud',
    role: 'Principal Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    profileUrl: '#',
    status: 'EDITING',
    activeNodeId: 'node-cond-1',
    lastHeartbeatAt: Date.now(),
    ttlSeconds: Math.floor(Date.now() / 1000) + 60,
    color: '#3b82f6', // blue
  },
  {
    userId: 'usr_alex_rivera',
    name: 'Alex Rivera',
    email: 'alex.r@flowops.cloud',
    role: 'Cloud Ops Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    profileUrl: '#',
    status: 'VIEWING',
    activeNodeId: 'node-http-1',
    lastHeartbeatAt: Date.now() - 5000,
    ttlSeconds: Math.floor(Date.now() / 1000) + 55,
    color: '#10b981', // emerald
  },
  {
    userId: 'usr_maya_patel',
    name: 'Maya Patel',
    email: 'maya.p@flowops.cloud',
    role: 'Security Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    profileUrl: '#',
    status: 'VIEWING',
    activeNodeId: null,
    lastHeartbeatAt: Date.now() - 12000,
    ttlSeconds: Math.floor(Date.now() / 1000) + 48,
    color: '#f59e0b', // amber
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PresenceStore {
  workflowId: string | null;
  currentUser: PresenceMember;
  collaborators: PresenceMember[];
  setWorkflowId: (id: string) => void;
  setCurrentNode: (nodeId: string | null) => void;
  setUserStatus: (status: 'VIEWING' | 'EDITING') => void;
  heartbeat: () => void;
  syncRemotePresence: () => Promise<void>;
  getDynamoDBPayload: () => DynamoDBPresenceRecord;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  workflowId: null,
  currentUser: {
    userId: 'usr_current_operator',
    name: 'You (DevOps Lead)',
    email: 'operator@flowops.cloud',
    role: 'DevOps Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    profileUrl: '#',
    status: 'EDITING',
    activeNodeId: null,
    lastHeartbeatAt: Date.now(),
    ttlSeconds: Math.floor(Date.now() / 1000) + 60,
    color: '#8b5cf6',
  },
  collaborators: INITIAL_MEMBERS,

  setWorkflowId: (id: string) => {
    set({ workflowId: id });
    get().syncRemotePresence();
  },

  setCurrentNode: (nodeId: string | null) => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        activeNodeId: nodeId,
        status: nodeId ? 'EDITING' : 'VIEWING',
        lastHeartbeatAt: Date.now(),
        ttlSeconds: Math.floor(Date.now() / 1000) + 60,
      },
    }));
    get().heartbeat();
  },

  setUserStatus: (status: 'VIEWING' | 'EDITING') => {
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        status,
        lastHeartbeatAt: Date.now(),
        ttlSeconds: Math.floor(Date.now() / 1000) + 60,
      },
    }));
  },

  heartbeat: async () => {
    const { workflowId, currentUser } = get();
    set((state) => ({
      currentUser: {
        ...state.currentUser,
        lastHeartbeatAt: Date.now(),
        ttlSeconds: Math.floor(Date.now() / 1000) + 60,
      },
    }));

    if (workflowId) {
      try {
        await fetch(`${API_BASE}/api/v1/presence/${workflowId}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUser),
        });
      } catch {}
    }
  },

  syncRemotePresence: async () => {
    const { workflowId, currentUser } = get();
    if (!workflowId) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/presence/${workflowId}`);
      if (res.ok) {
        const remoteMembers: PresenceMember[] = await res.json();
        // Exclude current user from collaborators list
        const others = remoteMembers.filter((m) => m.userId !== currentUser.userId);
        if (others.length > 0) {
          set({ collaborators: others });
        }
      }
    } catch {}
  },

  getDynamoDBPayload: () => {
    const { workflowId, currentUser } = get();
    return {
      PK: `PRESENCE#${workflowId || 'global'}`,
      SK: `USER#${currentUser.userId}`,
      userId: currentUser.userId,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      avatarUrl: currentUser.avatarUrl,
      status: currentUser.status,
      activeNodeId: currentUser.activeNodeId ?? null,
      lastHeartbeatAt: new Date(currentUser.lastHeartbeatAt).toISOString(),
      ttl: currentUser.ttlSeconds,
    };
  },
}));
