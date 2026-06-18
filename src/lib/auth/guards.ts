import { notFound, redirect } from "next/navigation";
import {
  getAccountRedirectPath,
  getCurrentProfile,
  isEmailConfirmed,
  type ApprovedProfile,
} from "@/lib/auth/profiles";

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
