import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Discovery: /discover · /discover/filters · /discover/profile/<member> · /discover/compatibility/<member> */
const route = portalRoute("discover");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
