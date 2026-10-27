import { portalRoute } from "@/components/sections/portal/portal-route";

/** Settings: /settings · /settings/account · /settings/notifications · /settings/privacy · /settings/blocked · /settings/delete */
const route = portalRoute("settings");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
