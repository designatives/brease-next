"use client";

import React from "react";
import { BreaseSection } from "../types";

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

interface BreaseEditButtonProps {
  id: string;
}

function BreaseAction(action: string, data: any) {
  if (typeof window === "undefined") return;
  const target = window.parent || window;
  target.postMessage(
    {
      action,
      data: {
        ...data,
        scrollY: window.scrollY,
      },
    },
    "*",
  );
}

const BreaseEditButton = ({ id }: BreaseEditButtonProps) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClick = () => {
      BreaseAction("BreaseEditSection", { uuid: id });
    };

    const button = buttonRef.current;
    if (button) {
      button.addEventListener("click", handleClick);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleClick);
      }
    };
  }, [id]);
  return (
    <button ref={buttonRef} className={"brease-edit-button"}>
      Edit
    </button>
  );
};

export default SectionToolbar;
