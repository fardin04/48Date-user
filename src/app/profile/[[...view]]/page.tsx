import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Your profile: /profile · /profile/edit · /profile/photos · /profile/trust · /profile/trust/activity · /profile/trust/review */
const route = portalRoute("profile");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
