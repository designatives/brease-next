import React from 'react';
import type { BreasePage, BreasePage as BreasePageType } from '../types.js';
import SectionToolbar from './section-toolbar.js';

interface BreasePageProps {
  page: BreasePageType;
  sectionMap: Record<string, React.ComponentType<Record<string, unknown>>>;
  optionalData?: any;
}

/**
 * Renders a Brease page by mapping its sections to components from sectionMap.
 * Also handles Brease App preview display.
 *
 * @param page - Brease page data
 * @param sectionMap - Map of section type strings to React components
 * @param optionalData - Optional data passed to each section component
 */
export default function BreasePage({ page, sectionMap, optionalData }: BreasePageProps) {
  const sections = filterSections(page, sectionMap);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  return sections?.map((section: any, index: number) => {
    if (section) {
      if (isInIframe) {
        return React.createElement(
          'section',
          {
            key: index,
            id: section.page_section_uuid,
            className: 'brease-section',
          },
          React.createElement(SectionToolbar, { data: section }),
          React.createElement('div', {
            className: 'brease-preview-overlay',
          }),
          React.createElement(section.component, {
            data: section.data,
            extra: optionalData || null,
          })
        );
      } else {
        return React.createElement(
          'section',
          {
            key: index,
            id: section.page_section_uuid,
            className: 'brease-section',
          },
          React.createElement(section.component, {
            data: section.data,
            extra: optionalData || null,
          })
        );
      }
    }
  });
}

function filterSections(page: BreasePage, componentMap: Record<string, React.ComponentType<any>>) {
  return page.sections.map((section) => {
    if (componentMap[section.type]) {
      return {
        component: componentMap[section.type],
        page_section_uuid: section.page_section_uuid,
        section_uuid: section.uuid,
        name: section.name,
        data: section.elements,
      };
    }
    return null;
  });
}
