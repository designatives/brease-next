"use client";

import React from "react";
import type { BreaseSection } from "../types.js";
import type { BreasePreviewChildMessage } from "../preview-types.js";

function sendToParent(message: BreasePreviewChildMessage): void {
  if (typeof window === "undefined") return;
  const target = window.parent || window;
  target.postMessage(message, "*");
}

export function SectionToolbar({ data }: { data: BreaseSection }) {
  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(false);
    }
  }, []);

  if (!isInIframe) return null;

  return (
    <>
      <div className={"brease-section-toolbar"}>
        <div>
          <span className={"brease-section-title"}>{data.name}</span>
        </div>
        <div className={"brease-toolbar-actions"}>
          <BreaseEditButton id={data.page_section_uuid} />
        </div>
      </div>
      <div className="brease-preview-overlay" />
    </>
  );
}

const BreaseEditButton = ({ id }: { id: string }) => {
  const handleClick = React.useCallback(() => {
    sendToParent({
      type: "brease:edit-section",
      payload: {
        uuid: id,
        scrollY: window.scrollY,
      },
    });
  }, [id]);

  return (
    <button onClick={handleClick} className={"brease-edit-button"}>
      Edit
    </button>
  );
};

export default SectionToolbar;
