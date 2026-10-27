import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Icebreaker games: /games/<member> */
const route = portalRoute("games");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
