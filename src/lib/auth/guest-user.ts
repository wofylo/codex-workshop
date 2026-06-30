import type { ApprovedProfile } from "@/lib/auth/profiles";

export type GuestUser = { id: string; is_guest: true };

export function isGuestUser(user: ApprovedProfile | GuestUser): user is GuestUser {
  return (user as GuestUser).is_guest === true;
}
