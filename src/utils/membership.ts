import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AuthorizedMember {
  email: string;
  name?: string;
  note?: string;
  plan?: 'monthly' | 'annual' | 'lifetime';
  status: 'active' | 'suspended';
  addedAt: string;
  expiresAt?: string; // ISO date string, undefined = lifetime
}

export interface MembershipConfig {
  wechatId?: string;
  wechatQr?: string;
  alipayQr?: string;
  monthlyPriceRmb?: number;
  annualPriceRmb?: number;
  lifetimePriceRmb?: number;
  contactNotes?: string;
}

// Built-in Admin Superusers who ALWAYS have permanent unrestricted access
export const SUPER_ADMIN_EMAILS = [
  'andrewandrre88@gmail.com',
  'admin@waimaotools.online',
  'admin@waimaotools.com',
  'user@waimaotools.online',
  'user@waimaotools.com'
];

const LOCAL_MEMBERS_KEY = 'waimao_authorized_members_cache';
const LOCAL_CONFIG_KEY = 'waimao_membership_config_cache';

const DEFAULT_MEMBERSHIP_CONFIG: MembershipConfig = {
  wechatId: 'waimao_tools_vip',
  monthlyPriceRmb: 29,
  annualPriceRmb: 199,
  lifetimePriceRmb: 399,
  contactNotes: '请添加微信发送您的 Google 账号，客服为您开通专属会员权限。'
};

/**
 * Check whether an email is a super admin
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some(admin => admin.toLowerCase() === clean);
}

/**
 * Check whether a user email has active access authorization
 */
export async function checkUserAuthorization(email?: string | null): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  member?: AuthorizedMember;
  reason?: string;
}> {
  if (!email) {
    return { authorized: false, isSuperAdmin: false, reason: 'No email provided' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Super admins always bypass
  if (isSuperAdmin(cleanEmail)) {
    return { authorized: true, isSuperAdmin: true };
  }

  try {
    // Check Firestore members collection
    const docRef = doc(db, 'authorized_members', cleanEmail);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const member = snap.data() as AuthorizedMember;
      if (member.status === 'suspended') {
        return { authorized: false, isSuperAdmin: false, member, reason: 'Account suspended' };
      }
      if (member.expiresAt && new Date(member.expiresAt).getTime() < Date.now()) {
        return { authorized: false, isSuperAdmin: false, member, reason: 'Membership expired' };
      }
      return { authorized: true, isSuperAdmin: false, member };
    }
  } catch (err) {
    console.warn('Could not reach Firestore for membership check, checking local cache:', err);
  }

  // Check local fallback cache
  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as AuthorizedMember[];
      const found = list.find(m => m.email.toLowerCase() === cleanEmail);
      if (found) {
        if (found.status === 'suspended') {
          return { authorized: false, isSuperAdmin: false, member: found, reason: 'Account suspended' };
        }
        if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
          return { authorized: false, isSuperAdmin: false, member: found, reason: 'Membership expired' };
        }
        return { authorized: true, isSuperAdmin: false, member: found };
      }
    }
  } catch {
    // ignore
  }

  return { authorized: false, isSuperAdmin: false, reason: 'Not authorized yet' };
}

/**
 * Fetch all authorized members (Admin only)
 */
export async function fetchAuthorizedMembers(): Promise<AuthorizedMember[]> {
  try {
    const colRef = collection(db, 'authorized_members');
    const snap = await getDocs(colRef);
    const results: AuthorizedMember[] = [];
    snap.forEach((d) => {
      results.push(d.data() as AuthorizedMember);
    });

    if (results.length > 0) {
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(results));
      return results;
    }
  } catch (err) {
    console.warn('Failed to fetch authorized members from Firestore, using local cache:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthorizedMember[];
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Add or update an authorized member (Admin only)
 */
export async function addAuthorizedMember(member: AuthorizedMember): Promise<void> {
  const cleanEmail = member.email.trim().toLowerCase();
  const normalized: AuthorizedMember = {
    ...member,
    email: cleanEmail
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, 'authorized_members', cleanEmail);
    await setDoc(docRef, normalized, { merge: true });
  } catch (err) {
    console.warn('Failed to save member to Firestore, falling back to local storage:', err);
  }

  // 2. Update local cache
  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
    let list: AuthorizedMember[] = raw ? JSON.parse(raw) : [];
    list = list.filter(m => m.email.toLowerCase() !== cleanEmail);
    list.unshift(normalized);
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to update local member cache', err);
  }
}

/**
 * Remove an authorized member
 */
export async function removeAuthorizedMember(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const docRef = doc(db, 'authorized_members', cleanEmail);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to delete member from Firestore:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as AuthorizedMember[];
      const filtered = list.filter(m => m.email.toLowerCase() !== cleanEmail);
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
}

/**
 * Fetch membership configuration (pricing, QR codes, WeChat contact)
 */
export async function fetchMembershipConfig(): Promise<MembershipConfig> {
  try {
    const docRef = doc(db, 'system_config', 'membership');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as MembershipConfig;
      localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(data));
      return { ...DEFAULT_MEMBERSHIP_CONFIG, ...data };
    }
  } catch (err) {
    console.warn('Could not read membership config from Firestore:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_MEMBERSHIP_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }

  return DEFAULT_MEMBERSHIP_CONFIG;
}

/**
 * Save membership configuration (Admin only)
 */
export async function saveMembershipConfig(config: MembershipConfig): Promise<void> {
  try {
    const docRef = doc(db, 'system_config', 'membership');
    await setDoc(docRef, config, { merge: true });
  } catch (err) {
    console.warn('Failed to save config to Firestore, saving locally:', err);
  }

  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}
