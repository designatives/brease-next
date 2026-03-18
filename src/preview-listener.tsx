"use client";

import { useContext, useEffect, useRef } from "react";
import { PreviewSettersContext } from "./client-provider.js";
import { isBreasePreviewMessage } from "./preview-types.js";
import type {
  BreasePreviewChildMessage,
  BreasePreviewParentMessage,
} from "./preview-types.js";

function sendToParent(message: BreasePreviewChildMessage): void {
  if (typeof window === "undefined") return;
  const target = window.parent || window;
  target.postMessage(message, "*");
}

export function BreasePreviewListener(): null {
  const setters = useContext(PreviewSettersContext);
  const settersRef = useRef(setters);
  settersRef.current = setters;
  const readySentRef = useRef(false);

  useEffect(() => {
    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = false;
    }

    if (!isInIframe) return;

    function handleMessage(event: MessageEvent) {
      const current = settersRef.current;
      if (!current) return;

      const { data } = event;
      if (!isBreasePreviewMessage(data)) return;

      const message = data as BreasePreviewParentMessage;
      if (message.type === "brease:init-page") {
        current.setPage(message.payload.page);
      }
    }

    window.addEventListener("message", handleMessage);

    if (!readySentRef.current) {
      readySentRef.current = true;
      sendToParent({ type: "brease:ready" });
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
