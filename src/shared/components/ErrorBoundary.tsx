import React from "react";
import * as Sentry from "@sentry/react";
import { Box, Typography, Button } from "@mui/material";
import { AlertTriangle } from "lucide-react";

const ErrorBoundaryFallback = ({
  error,
  resetError,
}: {
  error: unknown;
  resetError: () => void;
}) => {
  const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: 2,
        p: 3,
      }}
    >
      <AlertTriangle size={48} color="error" />
      <Typography variant="h5" color="error">
        Что-то пошло не так
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center">
        Произошла непредвиденная ошибка. Мы уже получили уведомление об этом.
      </Typography>
      <Button variant="contained" onClick={resetError} sx={{ mt: 2 }}>
        Попробовать снова
      </Button>
      {import.meta.env.DEV && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="body2" color="error">
            {errorMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ErrorBoundaryFallback,
    beforeCapture: (scope, error, hint) => {
      scope.setTag("component", "ErrorBoundary");
      scope.setLevel("error");
    },
  }
);