import { portalRoute } from "@/components/sections/portal/portal-route";

/** Notifications centre: /notifications */
const route = portalRoute("notifications");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
