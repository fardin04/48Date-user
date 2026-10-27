import { authRoute } from "@/components/sections/auth/auth-route";

/** Sign in: /signin · /signin/verify · /signin/verified · /signin/google · /signin/google/error · /signin/session-ended */
const route = authRoute("signin");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
