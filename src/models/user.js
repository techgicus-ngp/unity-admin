import { ROLES } from '@/config/constants';

/** Firestore doc → user object. The stored password is intentionally dropped. */
export function normalizeUser(data, uid) {
  const created = data.createdDate ? new Date(data.createdDate) : new Date();
  return {
    uid,
    email: data.email ?? '',
    name: data.name ?? '',
    groupName: data.groupName ?? '',
    role: data.role ?? ROLES.employee,
    createdDate: isNaN(created) ? new Date() : created,
    isAccessGranted: data.isAccessGranted ?? false,
  };
}

export const isAdmin = (u) => u?.role === ROLES.admin;
export const isGuest = (u) => u?.role === ROLES.guest;
/** Admins and guests always pass; employees need an explicit grant. */
export const hasAccess = (u) => isAdmin(u) || isGuest(u) || u?.isAccessGranted === true;
