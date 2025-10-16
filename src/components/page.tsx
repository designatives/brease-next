import { createElement } from 'react';
import type { BreasePage as BreasePageType, BreaseSection } from '../types.js';

interface BreasePageProps {
  page: BreasePageType;
  sectionMap: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export default function BreasePage({ page, sectionMap }: BreasePageProps) {
  return (
    <>
      {page.sections.map((section: BreaseSection) => {
        const SectionComponent = sectionMap[section.type];
        if (!SectionComponent) {
          console.warn(`No component found for section type: ${section.type}`);
          return null;
        }
        return createElement(SectionComponent, {
          key: section.uuid,
          ...section.elements,
        });
      })}
    </>
  );
}
