'use client';

import dynamic from 'next/dynamic';

/**
 * The RSVP form behind a dynamic import: still rendered on the server, but its code (React Hook
 * Form and the validation) is only downloaded by pages that show the form. Next.js only splits
 * code when the dynamic import lives in a Client Component, hence this wrapper.
 */
export const LazyRsvpForm = dynamic(() => import('./rsvp-form').then((module) => module.RsvpForm));
