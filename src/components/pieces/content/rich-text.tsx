import { Fragment } from "react";
import type { RichCopy } from "@/data/types";
import { textTones } from "@/lib/tones";

/**
 * Renders RichCopy: `\n` breaks the line from md up (text reflows on phones)
 * and `*text*` gets the rose highlight.
 */
export function RichText({ copy }: { copy: RichCopy }) {
  return copy.split("\n").map((line, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          {" "}
          <br className="max-md:hidden" />
        </>
      )}
      {line.split(/(\*[^*]+\*)/).map((part, partIndex) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={partIndex} className={textTones.roseBright}>
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </Fragment>
  ));
}
