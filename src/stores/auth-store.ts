import { countries, defaultCountryIso } from "@/data/auth/countries";
import { authFlows, type AuthFlowName } from "@/data/auth/flows";
import { authShared } from "@/data/auth/shared";

export const getAuthShared = () => authShared;
export const getAuthFlow = (flow: AuthFlowName) => authFlows[flow];
export const getCountries = () => ({ countries, defaultCountryIso });
