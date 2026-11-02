import { googleClientId } from "@/lib/api/config";

/** The parts of Google Identity Services (GIS) this app uses. */
type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: "popup"; use_fedcm_for_prompt?: boolean; itp_support?: boolean }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
  cancel: () => void;
};

type GoogleWindow = Window & { google?: { accounts?: { id?: GoogleId } } };

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let loading: Promise<GoogleId> | null = null;

/** Loads Google's sign-in script once, only on the screens that use it. */
function loadGoogle(): Promise<GoogleId> {
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const ready = () => {
      const id = (window as GoogleWindow).google?.accounts?.id;
      if (id) resolve(id);
      else reject(new Error("Google sign-in is unavailable."));
    };
    if ((window as GoogleWindow).google?.accounts?.id) return ready();
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = ready;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google sign-in couldn’t load."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Renders Google's own "Continue with Google" button into `parent` (popup mode). The ID token it
 * returns goes straight to `onToken` and is never stored. Resolves once the button is shown.
 */
export async function renderGoogleButton(parent: HTMLElement, onToken: (idToken: string) => void, onFailure: () => void) {
  if (!googleClientId) throw new Error("Google sign-in is not configured.");
  const google = await loadGoogle();
  google.initialize({
    client_id: googleClientId,
    ux_mode: "popup",
    use_fedcm_for_prompt: true,
    callback: ({ credential }) => (credential ? onToken(credential) : onFailure()),
  });
  google.renderButton(parent, { type: "standard", theme: "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(parent.clientWidth || 400, 400) });
}
