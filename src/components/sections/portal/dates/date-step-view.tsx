import type { MemberId } from "@/data/portal/types";
import type { DateStep } from "@/lib/portal/views";
import { CompleteView } from "@/components/sections/portal/dates/complete-view";
import { FeedbackView } from "@/components/sections/portal/dates/feedback-view";
import { ManageView } from "@/components/sections/portal/dates/manage-view";
import { PlaceView } from "@/components/sections/portal/dates/place-view";
import { PlanView } from "@/components/sections/portal/dates/plan-view";
import { ReviewView } from "@/components/sections/portal/dates/review-view";
import { TimeView } from "@/components/sections/portal/dates/time-view";
import { VenuesView } from "@/components/sections/portal/dates/venues-view";

/** W06 / Date Planning & Feedback — one step of a match's plan. */
export function DateStepView({ step, memberId }: { step: DateStep; memberId: MemberId }) {
  switch (step) {
    case "venues":
      return <VenuesView memberId={memberId} />;
    case "place":
      return <PlaceView memberId={memberId} />;
    case "time":
      return <TimeView memberId={memberId} />;
    case "review":
      return <ReviewView memberId={memberId} />;
    case "plan":
      return <PlanView memberId={memberId} />;
    case "manage":
      return <ManageView memberId={memberId} />;
    case "feedback":
      return <FeedbackView memberId={memberId} />;
    case "complete":
      return <CompleteView memberId={memberId} />;
  }
}
