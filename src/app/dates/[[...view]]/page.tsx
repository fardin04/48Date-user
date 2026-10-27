import { portalRoute } from "@/components/sections/portal/portal-route";

/** Date planning: /dates/<venues|place|time|review|plan|manage|feedback|complete>/<member> */
const route = portalRoute("dates");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
