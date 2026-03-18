import type { BreasePage } from "./types.js";

// --- Parent → Iframe (Brease App sends these) ---

export type BreasePreviewParentMessage = BreaseInitPageMessage;

export interface BreaseInitPageMessage {
  type: "brease:init-page";
  payload: {
    page: BreasePage;
  };
}

// --- Iframe → Parent (package sends these) ---

export type BreasePreviewChildMessage =
  | BreaseReadyMessage
  | BreaseEditSectionMessage;

export interface BreaseReadyMessage {
  type: "brease:ready";
}

export interface BreaseEditSectionMessage {
  type: "brease:edit-section";
  payload: {
    uuid: string;
    scrollY: number;
  };
}

export function isBreasePreviewMessage(
  data: unknown,
): data is BreasePreviewParentMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as { type: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("brease:")
  );
}
