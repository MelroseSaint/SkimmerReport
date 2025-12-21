import { init } from '@instantdb/react';
import schema from '../instant.schema.js';


const appId = import.meta.env.VITE_INSTANT_APP_ID;

if (!appId || typeof appId !== 'string' || appId.trim().length === 0) {
  // Provide a clear, early failure with guidance
  // This throws during app bootstrap, preventing deeper library errors
  throw new Error(
    'InstantDB appId missing. Define VITE_INSTANT_APP_ID in your environment (Vercel Project Settings -> Environment Variables) and rebuild.'
  );
}

export const db = init({
  appId,
  schema,
});
