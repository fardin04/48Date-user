import { legalRoute } from "@/components/sections/legal/legal-route";

/** L03 / Privacy Policy — `/privacy` or `/privacy/<section>` */
const route = legalRoute("privacy");

export const metadata = route.metadata;
export const generateStaticParams = route.generateStaticParams;
export default route.Page;
