import React from 'react';
import '../styles/index.css';
import { BreaseSection } from '../types';

export function SectionToolbar({ data }: { data: BreaseSection }) {
  return (
    <div className={'brease-section-toolbar'}>
      <div>
        <span className={'brease-section-title'}>{data.name}</span>
      </div>
      <div className={'brease-toolbar-actions'}>
        <BreaseEditButton id={data.page_section_uuid} />
      </div>
    </div>
  );
}

interface BreaseEditButtonProps {
  id: string;
}

function BreaseAction(action: string, data: any) {
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage(
      {
        action: action,
        data: {
          ...data,
          scrollY: window.scrollY,
        },
      },
      '*'
    );
  }
}

const BreaseEditButton = ({ id }: BreaseEditButtonProps) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClick = () => {
      BreaseAction('BreaseEditSection', { uuid: id });
    };

    const button = buttonRef.current;
    if (button) {
      button.addEventListener('click', handleClick);
    }

    return () => {
      if (button) {
        button.removeEventListener('click', handleClick);
      }
    };
  }, [id]);
  return (
    <button ref={buttonRef} className={'brease-edit-button'}>
      Edit
    </button>
  );
};

export default SectionToolbar;
