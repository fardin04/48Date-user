import { onboardingRoute } from "@/components/sections/onboarding/onboarding-route";

/** Profile setup: /onboarding/location · /onboarding/nickname · … · /onboarding/ready */
export const generateStaticParams = onboardingRoute.generateStaticParams;
export const generateMetadata = onboardingRoute.generateMetadata;
export default onboardingRoute.Page;
