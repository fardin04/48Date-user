import { api } from "../client";
import { apiDevice } from "../config";
import { endpoints } from "../endpoints";
import type { RequestOtpData, SessionData } from "../types/auth";

/** User / 01 - Auth (phone sign-in, refresh is handled by the client, logout). */
export const authApi = {
  requestOtp: (phone: string) => api.post<RequestOtpData>(endpoints.auth.requestOtp, { body: { phone }, auth: false }),
  verifyOtp: (phone: string, otp: string) =>
    api.post<SessionData>(endpoints.auth.verifyOtp, { body: { phone, otp, device: apiDevice }, auth: false }),
  logout: () => api.post<null>(endpoints.auth.logout),
};
