import { portalRoute } from "@/components/sections/portal/portal-route";

/** Matches: /matches · /matches/cancelled · /matches/complete · /matches/match/<member> */
const route = portalRoute("matches");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
