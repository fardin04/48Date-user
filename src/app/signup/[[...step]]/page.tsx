import { authRoute } from "@/components/sections/auth/auth-route";

/** Create account: /signup · /signup/verify · /signup/verified · /signup/google · /signup/google/error */
const route = authRoute("signup");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
