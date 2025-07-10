import * as Sentry from "@sentry/react";
import { createBrowserRouter } from "react-router-dom";

export const initializeSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      if (import.meta.env.DEV) {
        console.log('Sentry Event:', event);
        console.log('Sentry Hint:', hint);
      }
      return event;
    },
  });
};

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const withScope = Sentry.withScope;
export const setUser = Sentry.setUser;
export const setTag = Sentry.setTag;
export const setContext = Sentry.setContext;