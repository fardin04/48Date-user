"use client";

import { useEffect } from "react";
import { authService } from "@/lib/auth/auth-service";

/** SESSION ("Your session ended"): the member is signed out and their stored data is cleared. */
export function SignOut() {
  useEffect(() => {
    void authService.signOut();
  }, []);
  return null;
}
