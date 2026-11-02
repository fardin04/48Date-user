"use client";

import { liveData } from "@/lib/portal/live";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PhotoTile } from "@/components/pieces/media/photo-tile";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { UploadSlot } from "@/components/pieces/media/upload-slot";
import { Button } from "@/components/ui/button";
import type { ProfilePhoto } from "@/data/portal/account";
import { fill } from "@/lib/format";
import { accountService } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { ProfileSaved } from "@/components/sections/portal/profile/profile-saved";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/**
 * W09 / PHOTO-MANAGE, then PROFILE-SAVED on the same URL. The stored photos load first; chosen
 * files stay in memory as object URLs, each revoked when it is replaced or the screen is left, and
 * nothing is uploaded until "Save photos".
 */
export function PhotoManageView() {
  const page = getAccountPage().photos;
  const { value: stored, error, reload } = useLoaded(screenKeys.photos, accountService.getPhotos);
  if (stored) return <PhotoForm initial={stored} />;
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      {error !== undefined && <LoadFailed onRetry={reload} />}
    </Workspace>
  );
}

function PhotoForm({ initial }: { initial: ProfilePhoto[] }) {
  const copy = getAccountPage();
  const page = copy.photos;
  const nickname = useLoaded(screenKeys.profile, accountService.getProfile).value?.nickname ?? (liveData ? "" : copy.defaults.profile.nickname);
  const slots = Math.max(page.slots, initial.length);
  const [photos, setPhotos] = useState<(ProfilePhoto | null)[]>(() => [...initial, ...Array<null>(slots - initial.length).fill(null)]);
  const [target, setTarget] = useState(0);
  const [rejected, setRejected] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const owned = urls.current;
    return () => owned.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const release = (photo: ProfilePhoto | null) => {
    if (photo?.file) {
      URL.revokeObjectURL(photo.url);
      urls.current.delete(photo.url);
    }
  };

  const choose = (slot: number) => {
    setTarget(slot);
    input.current?.click();
  };

  const picked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const ok = page.accept.includes(file.type) && file.size <= page.maxBytes;
    setRejected(!ok);
    if (!ok) return;
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    release(photos[target]);
    setPhotos(photos.map((photo, index) => (index === target ? { url, file } : photo)));
  };

  const makeMain = (slot: number) =>
    setPhotos((current) => current.map((photo, index) => (index === 0 ? current[slot] : index === slot ? current[0] : photo)));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(null);
    try {
      await accountService.savePhotos(photos.filter((photo): photo is ProfilePhoto => photo !== null));
      setSaved(true);
    } catch (reason) {
      setFailed(reason instanceof Error ? reason.message : copy.account.failed);
    }
    setBusy(false);
  };

  if (saved) return <ProfileSaved back={page.back} name={nickname} />;

  const firstEmpty = photos.indexOf(null);
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <input ref={input} type="file" accept={page.accept.join(",")} onChange={picked} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <ul className="grid w-full gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={index} className="flex min-w-0 flex-col gap-2">
            {photo ? (
              <>
                <PhotoTile src={photo.url} alt={fill(page.alt, { number: index + 1 })} frame="manage" />
                <div className="flex flex-wrap items-center gap-2">
                  {index === 0 ? (
                    <Text as="span" variant="text14Medium" tone="rose">
                      {page.main}
                    </Text>
                  ) : (
                    <Button type="button" variant="neutral" size="compact" disabled={busy} onClick={() => makeMain(index)}>
                      {page.makeMain}
                    </Button>
                  )}
                  <Button type="button" variant="neutral" size="compact" disabled={busy} onClick={() => choose(index)}>
                    {page.replace}
                  </Button>
                </div>
              </>
            ) : (
              <UploadSlot title={page.add.title} description={page.add.description} upload={page.add.upload} disabled={busy} onUpload={() => choose(index)} className="h-40" />
            )}
          </li>
        ))}
      </ul>
      {rejected && <StatusNote variant="alert" message={page.rejected} />}
      {failed && <StatusNote variant="alert" message={failed} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void save()}>
          {busy ? page.saving : page.save}
        </Button>
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy || firstEmpty < 0} onClick={() => choose(firstEmpty)}>
          {page.addPhoto}
        </Button>
      </ActionRow>
    </Workspace>
  );
}
