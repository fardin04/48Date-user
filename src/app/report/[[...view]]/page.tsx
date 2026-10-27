import { portalRoute } from "@/components/sections/portal/portal-route";

/** Reports: /report · /report/<member> · /report/<story> */
const route = portalRoute("report");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
