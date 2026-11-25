import React, { useState, useEffect } from 'react';
import { subscribeToAnnouncements } from '../../utils/announcer';

/**
 * Visually hidden screen-reader announcement live region
 */
export const AriaLiveAnnouncer: React.FC = () => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    return subscribeToAnnouncements((message, priority) => {
      if (priority === 'assertive') {
        setAssertiveMessage(message);
        // Clear after 1 second so repeated identical messages can be read again
        setTimeout(() => setAssertiveMessage(''), 1000);
      } else {
        setPoliteMessage(message);
        setTimeout(() => setPoliteMessage(''), 1000);
      }
    });
  }, []);

  return (
    <div className="sr-only pointer-events-none" aria-hidden="false">
      <div
        id="habitflow-aria-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMessage}
      </div>
      <div
        id="habitflow-aria-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </div>
  );
};
