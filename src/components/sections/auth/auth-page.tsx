import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { AuthShell } from "@/components/pieces/shells/auth-shell";
import { ConsentNote } from "@/components/pieces/forms/consent-note";
import { OrDivider } from "@/components/pieces/forms/or-divider";
import type { AuthFlowName, AuthStep } from "@/data/auth/flows";
import { notFunctional, to } from "@/lib/routes";
import { googleMode } from "@/lib/auth/google-mode";
import { getAuthFlow, getAuthShared, getCountries } from "@/stores/auth-store";
import { SessionGate } from "@/components/pieces/shells/session-gate";
import { GoogleStep } from "./google-step";
import { MessageStep } from "./message-step";
import { PhoneStep } from "./phone-step";
import { SignOut } from "./sign-out";
import { VerifyStep } from "./verify-step";

/** Title of a step, for the route's metadata. */
export function authStepTitle(flowName: AuthFlowName, step: AuthStep) {
  const flow = getAuthFlow(flowName);
  const titles: Record<AuthStep, string | undefined> = {
    entry: flow.entry.intro.title,
    verify: flow.verify.states.code.title,
    verified: flow.verified.intro.title,
    google: flow.google.intro.title,
    googleError: flow.googleError.intro.title,
    session: flow.session?.intro.title,
  };
  return titles[step];
}

/** W01 / Entry & Authentication — one step of the sign-up or sign-in flow. */
export function AuthPage({ flowName, step }: { flowName: AuthFlowName; step: AuthStep }) {
  const flow = getAuthFlow(flowName);
  const shared = getAuthShared();
  const { countries, defaultCountryIso } = getCountries();

  const body = (() => {
    switch (step) {
      case "entry":
        return (
          <SessionGate allow="guest" redirect="DISCOVER">
          <div className="flex flex-col gap-6">
            <PhoneStep
              intro={flow.entry.intro}
              field={shared.phoneField}
              submitLabel={shared.continuePhone}
              countries={countries}
              defaultCountryIso={defaultCountryIso}
              next={flow.routes.verify}
            />
            <OrDivider label={shared.or} revealDelay={120} />
            <ActionButton
              action={{
                label: shared.continueGoogle,
                to: googleMode === "unavailable" ? notFunctional(shared.googleUnavailable) : to(flow.routes.google),
              }}
              variant="google"
              size="pill"
              width="full"
              leadingImage={shared.googleMark}
              revealDelay={160}
            />
            <ConsentNote revealDelay={200} />
            <ActionLink action={flow.entry.switchAction} variant="authInline" revealDelay={240} />
          </div>
          </SessionGate>
        );
      case "verify":
        return <VerifyStep copy={flow.verify} code={shared.code} entry={flow.routes.entry} verified={flow.routes.verified} />;
      case "verified":
        return <MessageStep intro={flow.verified.intro} visual={{ kind: "success", image: shared.successMark }} primary={flow.verified.cta} />;
      case "google":
        if (googleMode === "live")
          return <GoogleStep intro={flow.google.intro} waitingLabel={shared.waitingLabel} primary={flow.google.primary} failed={flow.routes.googleError} />;
        return (
          <MessageStep
            intro={flow.google.intro}
            visual={{ kind: "activity", label: shared.waitingLabel }}
            primary={flow.google.primary}
            secondary={flow.google.secondary}
          />
        );
      case "googleError":
        return <MessageStep intro={flow.googleError.intro} primary={flow.googleError.primary} secondary={flow.googleError.secondary} />;
      case "session":
        return flow.session ? (
          <>
            <SignOut />
            <MessageStep intro={flow.session.intro} primary={flow.session.primary} secondary={flow.session.secondary} />
          </>
        ) : null;
    }
  })();

  return <AuthShell backPosition={flow.backAtBottom?.includes(step) ? "bottom" : "top"}>{body}</AuthShell>;
}
