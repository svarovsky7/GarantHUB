import * as Sentry from "@sentry/react";

export const logError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.error("Error:", error, context);
  }
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

export const logMessage = (message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    console.log(`[${level}] ${message}`, context);
  }
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

export const testSentryIntegration = () => {
  if (import.meta.env.DEV) {
    console.log("Testing Sentry integration...");
    
    logMessage("Test message from Sentry integration", "info");
    
    try {
      throw new Error("Test error for Sentry integration");
    } catch (error) {
      logError(error as Error, { component: "SentryTest" });
    }
  }
};