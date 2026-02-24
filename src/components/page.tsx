"use client";

import React from "react";
import type { BreasePage as BreasePageType } from "../types.js";
import SectionToolbar from "./section-toolbar.js";

interface BreasePageProps {
  page: BreasePageType;
  sectionMap: Record<string, React.ComponentType<Record<string, unknown>>>;
}

interface FilteredSection {
  component: React.ComponentType<Record<string, unknown>>;
  page_section_uuid: string;
  section_uuid: string;
  name: string;
  type: string;
  uuid: string;
  elements: Record<string, unknown>;
  data: Record<string, unknown>;
}

/**
 * Renders a Brease page by mapping its sections to components from sectionMap.
 * Detects iframe context client-side for Brease App preview toolbar.
 */
export default function BreasePage({ page, sectionMap }: BreasePageProps) {
  const sections = filterSections(page, sectionMap);
  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  return sections?.map((section, index) => {
    if (!section) return null;
    return (
      <section
        key={index}
        id={section.page_section_uuid}
        className="brease-section"
      >
        {isInIframe && <SectionToolbar data={section} />}
        {isInIframe && <div className="brease-preview-overlay" />}
        {React.createElement(section.component, section.data)}
      </section>
    );
  });
}

function filterSections(
  page: BreasePageType,
  componentMap: Record<string, React.ComponentType<Record<string, unknown>>>,
): (FilteredSection | null)[] {
  return page.sections.map((section) => {
    if (componentMap[section.type]) {
      return {
        component: componentMap[section.type],
        page_section_uuid: section.page_section_uuid,
        section_uuid: section.uuid,
        name: section.name,
        type: section.type,
        uuid: section.uuid,
        elements: section.elements,
        data: section.elements,
      };
    }
    return null;
  });
}
