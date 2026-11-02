import { cached, invalidate } from "../cache";
import { api } from "../client";
import { apiDevice } from "../config";
import { endpoints } from "../endpoints";
import type { RequestOtpData, SessionData, SignInMethods } from "../types/auth";
import { cacheKeys } from "./cache-keys";

/** User / 01 - Auth (phone and Google sign-in, linked methods; refresh is handled by the client). */
export const authApi = {
  requestOtp: (phone: string) => api.post<RequestOtpData>(endpoints.auth.requestOtp, { body: { phone }, auth: false }),
  verifyOtp: (phone: string, otp: string) =>
    api.post<SessionData>(endpoints.auth.verifyOtp, { body: { phone, otp, device: apiDevice }, auth: false }),
  /** The ID token from Google Identity Services; verified by the API against its client IDs. */
  google: (idToken: string) => api.post<SessionData>(endpoints.auth.google, { body: { idToken, device: apiDevice }, auth: false }),
  logout: () => api.post<null>(endpoints.auth.logout),
  methods: () => cached(cacheKeys.authMethods, 60_000, () => api.get<SignInMethods>(endpoints.auth.methods)),
  async linkGoogle(idToken: string) {
    const result = await api.post<null>(endpoints.auth.linkGoogle, { body: { idToken } });
    invalidate(cacheKeys.authMethods, cacheKeys.me);
    return result;
  },
  async unlinkGoogle() {
    const result = await api.delete<null>(endpoints.auth.linkGoogle);
    invalidate(cacheKeys.authMethods, cacheKeys.me);
    return result;
  },
  requestLinkPhone: (phone: string) => api.post<RequestOtpData>(endpoints.auth.linkPhoneRequestOtp, { body: { phone } }),
  async verifyLinkPhone(phone: string, otp: string) {
    const result = await api.post<null>(endpoints.auth.linkPhoneVerify, { body: { phone, otp } });
    invalidate(cacheKeys.authMethods, cacheKeys.me);
    return result;
  },
  async unlinkPhone() {
    const result = await api.delete<null>(endpoints.auth.linkPhone);
    invalidate(cacheKeys.authMethods, cacheKeys.me);
    return result;
  },
};
