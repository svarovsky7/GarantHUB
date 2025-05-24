import React from 'react';
import { SnackbarProvider } from 'notistack';

/**
 * Кастомный “зелёный” снек для уведомлений.
 */
const GreenSnack = React.forwardRef<HTMLDivElement, { message: string; onClose: () => void }>(
    function GreenSnack({ message, onClose }, ref) {
        return (
            <div
                ref={ref}
                role="alert"
                onClick={onClose}
                style={{
                    background: '#4caf50',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 4,
                    boxShadow: '0 3px 6px rgba(0,0,0,.2)',
                    cursor: 'pointer',
                    maxWidth: 344,
                    wordBreak: 'break-word',
                }}
            >
                {message}
            </div>
        );
    }
);

/**
 * Провайдер уведомлений (Notistack) с кастомным стилем.
 */
const Notifier: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={4000}
        hideIconVariant
        Components={{ default: GreenSnack }}
    >
        {children}
    </SnackbarProvider>
);

export default Notifier;
