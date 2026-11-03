import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Settings: /settings · /settings/account · /settings/location · /settings/notifications · /settings/privacy · /settings/blocked · /settings/delete */
const route = portalRoute("settings");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
