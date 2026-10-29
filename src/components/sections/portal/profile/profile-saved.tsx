"use client";

import { PortalBack } from "@/components/pieces/actions/portal-back";
import type { Action } from "@/data/types";
import { fill } from "@/lib/format";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

/** W09 / PROFILE-SAVED, shown on the screen that saved (PROFILE-EDIT, ACCOUNT, PHOTO-MANAGE). */
export function ProfileSaved({ back, name }: { back: Action; name: string }) {
  const { saved } = getAccountPage();
  return (
    <StatusScreen
      back={<PortalBack action={back} />}
      title={saved.title}
      description={saved.description}
      summary={{ ...saved.summary, title: fill(saved.summary.title, { name }) }}
      primary={saved.primary}
      aside={<ProfileContext />}
      actionWidth="actionSlot"
    />
  );
}
