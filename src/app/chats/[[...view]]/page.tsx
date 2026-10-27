import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Messaging: /chats · /chats/<member> */
const route = portalRoute("chats");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
