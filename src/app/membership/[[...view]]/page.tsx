import { portalRoute } from "@/components/sections/portal/portal-route";

/** Membership: /membership · /membership/plans · /membership/checkout/<plan> · /membership/restore · /membership/manage · /membership/limit */
const route = portalRoute("membership");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
