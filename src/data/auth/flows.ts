import { notFunctional, to, type ScreenCode } from "@/lib/routes";
import type { Action, Intro } from "../types";

export type AuthFlowName = "signup" | "signin";
export type AuthStep = "entry" | "verify" | "verified" | "google" | "googleError" | "session";

type Title = Pick<Intro, "title" | "description">;

export type AuthFlow = {
  /** Screen code that opens each step's URL (see lib/routes). */
  routes: Partial<Record<AuthStep, ScreenCode>> & Record<"entry" | "verify" | "verified" | "google" | "googleError", ScreenCode>;
  entry: { intro: Intro; switchAction: Action };
  verify: {
    eyebrow: string;
    /** `{phone}` is replaced with the masked number. */
    states: { code: Title; resent: Title; expired: Title; processing: Title };
    limit: { intro: Intro; primary: Action; secondary: Action };
  };
  verified: { intro: Intro; cta: Action };
  google: { intro: Intro; primary: Action; secondary: Action };
  googleError: { intro: Intro; primary: Action; secondary: Action };
  session?: { intro: Intro; primary: Action; secondary: Action };
  /** Steps whose frame puts "Back to website" under the form (SIGNIN-GOOGLE). */
  backAtBottom?: AuthStep[];
};

const google: Intro = {
  eyebrow: "SECURE ACCOUNT ACCESS",
  title: "Continue with Google.",
  description: "Complete sign-in in Google’s secure window, then return here to continue.",
};

const googleError: Intro = {
  eyebrow: "LET’S TRY ANOTHER WAY",
  title: "Google sign-in didn’t finish.",
  description: "You can try again or use your phone number. Your existing account is unchanged.",
};

const limit: Intro = {
  eyebrow: "LET’S TAKE A MOMENT",
  title: "Please wait a little.",
  description: "You’ve requested several codes. Try again shortly, or use a different number.",
};

const resent: Title = { title: "Check your messages.", description: "We sent a fresh code to {phone}." };
const expired: Title = { title: "Your code has expired.", description: "Request a new code for {phone}." };
const processing: Title = {
  title: "Confirming it’s you.",
  description: "We’re checking your code securely. This should only take a moment.",
};
const codeDescription = "Enter the six-digit code sent to {phone}.";
const changePhone = "Change phone number";

export const authFlows: Record<AuthFlowName, AuthFlow> = {
  signup: {
    routes: { entry: "WELCOME", verify: "OTP", verified: "PHONE-VERIFIED", google: "GOOGLE-REDIRECT", googleError: "GOOGLE-ERROR" },
    entry: {
      intro: {
        eyebrow: "WELCOME TO 48DATE",
        title: "Your next chapter starts here.",
        description: "Meet someone who’s ready for something real. Start with your phone number.",
      },
      switchAction: { label: "Already have an account? Sign in", to: to("SIGNIN") },
    },
    verify: {
      eyebrow: "ONE QUICK CHECK",
      states: { code: { title: "Verify your number.", description: codeDescription }, resent, expired, processing },
      limit: {
        intro: limit,
        primary: { label: changePhone, to: to("WELCOME") },
        secondary: { label: "Back to sign up", to: to("WELCOME") },
      },
    },
    verified: {
      intro: {
        eyebrow: "YOU’RE IN",
        title: "Your number is verified.",
        description: "Your phone stays private. Now let’s create a profile that feels like you.",
      },
      cta: { label: "Set up my profile", to: notFunctional("Profile onboarding (Location) is not built yet") },
    },
    google: {
      intro: google,
      primary: { label: "Use my phone instead", to: to("WELCOME") },
      secondary: { label: "Google didn’t open", to: to("GOOGLE-ERROR") },
    },
    googleError: {
      intro: googleError,
      primary: { label: "Try Google again", to: to("GOOGLE-REDIRECT") },
      secondary: { label: "Continue with phone", to: to("WELCOME") },
    },
  },
  signin: {
    routes: {
      entry: "SIGNIN",
      verify: "OTP-SIGNIN",
      verified: "SIGNIN-VERIFIED",
      google: "SIGNIN-GOOGLE",
      googleError: "SIGNIN-GOOGLE-ERROR",
      session: "SESSION",
    },
    entry: {
      intro: {
        eyebrow: "GOOD TO SEE YOU AGAIN",
        title: "Welcome back.",
        description: "Sign in to pick up where your last conversation left off.",
      },
      switchAction: { label: "New here? Create an account", to: to("WELCOME") },
    },
    verify: {
      eyebrow: "WELCOME BACK",
      states: { code: { title: "Verify it’s you.", description: codeDescription }, resent, expired, processing },
      // Figma only draws OTP-LIMIT for sign-up; sign-in returns to its own entry.
      limit: {
        intro: limit,
        primary: { label: changePhone, to: to("SIGNIN") },
        secondary: { label: "Back to sign in", to: to("SIGNIN") },
      },
    },
    verified: {
      intro: {
        eyebrow: "GOOD TO HAVE YOU BACK",
        title: "You’re signed in.",
        description: "Your matches, conversations and plans are ready when you are.",
      },
      cta: { label: "Open my portal", to: notFunctional("User portal (Discover) is not built yet") },
    },
    google: {
      intro: google,
      primary: { label: "Use my phone instead", to: to("SIGNIN") },
      secondary: { label: "Google didn’t open", to: to("SIGNIN-GOOGLE-ERROR") },
    },
    googleError: {
      intro: googleError,
      primary: { label: "Try Google again", to: to("SIGNIN-GOOGLE") },
      secondary: { label: "Continue with phone", to: to("SIGNIN") },
    },
    backAtBottom: ["google"],
    session: {
      intro: {
        eyebrow: "YOUR ACCOUNT IS SAFE",
        title: "Your session has ended.",
        description: "Your profile and conversations are still here. Sign in again to continue.",
      },
      primary: { label: "Sign in again", to: to("SIGNIN") },
      secondary: { label: "Back to website", to: to("L02") },
    },
  },
};
