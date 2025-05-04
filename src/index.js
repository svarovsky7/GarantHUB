import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import Notifier from './shared/ui/Notifier';          // NEW

ReactDOM.createRoot(document.getElementById('root')).render(
    <Notifier>
        <App />
    </Notifier>,
);
