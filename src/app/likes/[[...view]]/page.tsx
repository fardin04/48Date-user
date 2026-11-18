import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Likes received: /likes */
const route = portalRoute("likes");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
