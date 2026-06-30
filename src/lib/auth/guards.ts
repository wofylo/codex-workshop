import { notFound, redirect } from "next/navigation";
import {
  getAccountRedirectPath,
  getCurrentProfile,
  isEmailConfirmed,
  type ApprovedProfile,
} from "@/lib/auth/profiles";
import { type GuestUser, isGuestUser } from "@/lib/auth/guest-user";

export type { GuestUser };
export { isGuestUser };

export async function requireGuestOrApprovedUser(): Promise<ApprovedProfile | GuestUser> {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.is_anonymous) {
    return { id: user.id, is_guest: true };
  }

  const redirectPath = getAccountRedirectPath(profile, isEmailConfirmed(user));
  if (redirectPath) {
    redirect(redirectPath);
  }

  return profile as ApprovedProfile;
}

export async function requireApprovedUser(): Promise<ApprovedProfile> {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/auth/login");
  }

  const redirectPath = getAccountRedirectPath(profile, isEmailConfirmed(user));
  if (redirectPath) {
    redirect(redirectPath);
  }

  return profile as ApprovedProfile;
}

export async function requireAdmin(): Promise<ApprovedProfile> {
  const profile = await requireApprovedUser();

  if (profile.role !== "admin") {
    notFound();
  }

  return profile;
}
