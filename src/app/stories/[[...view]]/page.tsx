import { portalRoute } from "@/components/sections/portal/shared/portal-route";

/** Success stories: /stories · /stories/story/<id> · /stories/new · /stories/mine */
const route = portalRoute("stories");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
