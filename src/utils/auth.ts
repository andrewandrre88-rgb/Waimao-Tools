import { AuthUser } from '../types';

const CURRENT_USER_KEY = 'waimao_current_user';
const REGISTERED_USERS_KEY = 'waimao_registered_users';

export interface StoredAccount extends AuthUser {
  passwordHash: string;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_demo_001',
  name: 'Authorized Trade Specialist',
  email: 'user@waimaotools.com',
  companyName: 'Waimao International Trade Co., Ltd.',
  role: 'Operations Manager'
};

export function getRegisteredUsers(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY) || localStorage.getItem('mila_registered_users');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY) || localStorage.getItem('mila_current_user');
    if (!raw) return null;
    const user: AuthUser = JSON.parse(raw);
    if (user) {
      if (
        user.companyName?.includes('Mila') || 
        user.companyName?.includes('MILA') || 
        user.email?.includes('milaplastics') || 
        user.email?.includes('milagroup') ||
        user.name?.includes('Mila') ||
        user.name?.includes('MILA')
      ) {
        user.companyName = 'Waimao International Trade Co., Ltd.';
        if (user.name?.includes('Mila') || user.name?.includes('MILA')) {
          user.name = 'Authorized Trade Specialist';
        }
        if (user.email?.includes('milaplastics') || user.email?.includes('milagroup')) {
          user.email = 'user@waimaotools.com';
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        localStorage.removeItem('mila_current_user');
      }
    }
    return user;
  } catch (err) {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('mila_current_user');
  }
}

export function loginUser(email: string, password: string): { user?: AuthUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail || !password) {
    return { error: 'Please fill in both email and password.' };
  }

  // Check demo credentials shortcut or default fallback
  if ((cleanEmail === 'admin@waimaotools.com' || cleanEmail === 'demo@waimaotools.com' || cleanEmail === 'admin@milagroup.cn') && password === 'password123') {
    setCurrentUser(DEFAULT_DEMO_USER);
    return { user: DEFAULT_DEMO_USER };
  }

  const users = getRegisteredUsers();
  const found = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { error: 'No account found with this email address. Please sign up.' };
  }

  if (found.passwordHash !== password) {
    return { error: 'Incorrect password. Please try again.' };
  }

  const user: AuthUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    companyName: found.companyName,
    role: found.role || 'Export Manager'
  };

  setCurrentUser(user);
  return { user };
}

export function registerUser(
  name: string,
  email: string,
  password: string,
  companyName: string
): { user?: AuthUser; error?: string } {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCompany = companyName.trim();

  if (!cleanName) return { error: 'Full name is required.' };
  if (!cleanEmail || !cleanEmail.includes('@')) return { error: 'Valid email address is required.' };
  if (!password || password.length < 6) return { error: 'Password must be at least 6 characters long.' };

  const existingUsers = getRegisteredUsers();
  if (existingUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { error: 'An account with this email address already exists.' };
  }

  const newAccount: StoredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    companyName: cleanCompany || 'Export Enterprise',
    role: 'Trade Specialist',
    passwordHash: password
  };

  existingUsers.push(newAccount);
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(existingUsers));
  } catch (e) {
    console.error('Failed to save user account', e);
  }

  const user: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    companyName: newAccount.companyName,
    role: newAccount.role
  };

  setCurrentUser(user);
  return { user };
}

export function googleAuth(googleEmail?: string, googleName?: string): AuthUser {
  const email = (googleEmail || 'user@gmail.com').trim().toLowerCase();
  const name = googleName?.trim() || (email.includes('@') ? email.split('@')[0].replace('.', ' ') : 'Google User');
  
  // Deterministic user key derived from email for consistent multi-device synchronization
  const sanitizedUid = `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Check if account already exists in local registry
  const users = getRegisteredUsers();
  const existing = users.find(u => u.email.toLowerCase() === email);

  if (existing) {
    const user: AuthUser = {
      id: existing.id || sanitizedUid,
      name: existing.name || (name.charAt(0).toUpperCase() + name.slice(1)),
      email: existing.email,
      companyName: existing.companyName || 'Waimao International Trade Partner',
      role: existing.role || 'Verified Google Account'
    };
    setCurrentUser(user);
    return user;
  }

  // Create new account with Google
  const newAccount: StoredAccount = {
    id: sanitizedUid,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: email,
    companyName: 'Waimao International Trade Partner',
    role: 'Verified Google Account',
    passwordHash: 'google_oauth_token_verified'
  };

  users.push(newAccount);
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save Google account', e);
  }

  const user: AuthUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    companyName: newAccount.companyName,
    role: newAccount.role
  };

  setCurrentUser(user);
  return user;
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function demoLogin(): AuthUser {
  setCurrentUser(DEFAULT_DEMO_USER);
  return DEFAULT_DEMO_USER;
}

