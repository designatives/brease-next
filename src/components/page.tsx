"use client";

import React from "react";
import type { BreasePage as BreasePageType } from "../types.js";
import { useBreaseContext } from "../client-provider.js";
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
  key: string;
  uuid: string;
  elements: Record<string, unknown>;
  data: Record<string, unknown>;
}

/**
 * Renders a Brease page by mapping its sections to components from sectionMap.
 * Uses page from context (updated by preview listener) when available,
 * falls back to the prop for backwards compatibility.
 */
export default function BreasePage({
  page: pageProp,
  sectionMap,
}: BreasePageProps) {
  const context = useBreaseContext();
  const page = context.page ?? pageProp;
  const sections = filterSections(page, sectionMap);

  return sections?.map((section, index) => {
    if (!section) return null;
    return (
      <section
        key={index}
        id={section.page_section_uuid}
        className="brease-section"
      >
        <SectionToolbar data={section} />
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
    if (componentMap[section.key]) {
      return {
        component: componentMap[section.key],
        page_section_uuid: section.page_section_uuid,
        section_uuid: section.uuid,
        name: section.name,
        key: section.key,
        uuid: section.uuid,
        elements: section.elements,
        data: section.elements,
      };
    }
    return null;
  });
}
