import React from 'react';
import { SnackbarProvider } from 'notistack';

/* ---------- кастомный “зелёный” снек ---------- */
const GreenSnack = React.forwardRef<HTMLDivElement, { message: string; onClose: () => void }>(function GreenSnack(
    { message, onClose },   // забираем только то, что используем
    ref,
) {
    return (
        <div
            ref={ref}
            role="alert"
            onClick={onClose}
            style={{
                background   : '#4caf50',
                color        : '#fff',
                padding      : '8px 16px',
                borderRadius : 4,
                boxShadow    : '0 3px 6px rgba(0,0,0,.2)',
                cursor       : 'pointer',
                maxWidth     : 344,
                wordBreak    : 'break-word',
            }}
        >
            {message}
        </div>
    );
});

/* ---------- провайдер ---------- */
const Notifier = ({ children }) => (
    <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={4000}
        hideIconVariant            /* не показывать иконку */
        Components={{ default: GreenSnack }}
    >
        {children}
    </SnackbarProvider>
);

export default Notifier;
