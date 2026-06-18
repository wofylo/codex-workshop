export type AuthErrorReason = "login" | "signup" | "profile";

export type AuthErrorCopy = {
  title: string;
  message: string;
};

const errorCopyByReason: Record<AuthErrorReason, AuthErrorCopy> = {
  login: {
    title: "Sign in failed",
    message:
      "Supabase did not accept that email and password. Create an account first, or check the credentials and try again.",
  },
  signup: {
    title: "Account request failed",
    message:
      "Supabase could not create that auth account. Check the email, password, and signup settings, then try again.",
  },
  profile: {
    title: "Profile setup failed",
    message:
      "The auth account was created, but the app profile could not be created. Check the server-only Supabase secret key and try again.",
  },
};

const fallbackCopy: AuthErrorCopy = {
  title: "Authentication problem",
  message: "The request could not be completed. Check your details and try again.",
};

export function getAuthErrorCopy(reason: string | null): AuthErrorCopy {
  if (reason === "login" || reason === "signup" || reason === "profile") {
    return errorCopyByReason[reason];
  }

  return fallbackCopy;
}
