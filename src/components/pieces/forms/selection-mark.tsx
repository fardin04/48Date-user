import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";

type SelectionMarkProps = {
  type: "radio" | "checkbox";
  checked: boolean;
};

/**
 * Align UI Radio / Checkbox [1.1] drawn at 20px (atom). Decorative: the native input
 * beside it carries the semantics and focus.
 */
export function SelectionMark({ type, checked }: SelectionMarkProps) {
  if (type === "radio") {
    return (
      <span aria-hidden="true" className="relative size-5 shrink-0">
        <span className={cn("absolute inset-[10%] rounded-full", checked ? "bg-rose" : "bg-soft-line")} />
        <span className={cn("absolute rounded-full bg-white", checked ? "inset-[30%]" : "inset-[17.5%] shadow-knob")} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
      {checked ? (
        <span className="flex size-4 items-center justify-center rounded-[4px] bg-rose text-white">
          <Icon name="tick-02" size={12} />
        </span>
      ) : (
        <span className="flex size-4 items-center justify-center rounded-[4px] bg-soft-line">
          <span className="size-3.25 rounded-[2.6px] bg-white shadow-box" />
        </span>
      )}
    </span>
  );
}
