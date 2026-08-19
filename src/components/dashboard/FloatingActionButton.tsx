import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FABProps {
  onClick?: () => void;
  ariaLabel?: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  onClick,
  ariaLabel = 'Add new habit',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/habit/new');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title="Add new habit"
      className="fixed bottom-[84px] md:bottom-8 right-container-padding lg:right-10 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0px_8px_24px_rgba(0,99,152,0.3)] flex items-center justify-center hover:bg-on-primary-fixed-variant hover:-translate-y-1 active:scale-95 transition-all duration-200 z-40 group"
    >
      <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform duration-300">
        add
      </span>
    </button>
  );
};
