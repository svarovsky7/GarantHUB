/**
 * Универсальный хук уведомлений
 * Использует notistack (SnackbarProvider в _App.js_).
 */

import { useSnackbar } from 'notistack';

export interface NotifyAPI {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  warn: (msg: string) => void;
}

/**
 * @returns {{
 *   success: (msg:string)=>void,
 *   error  : (msg:string)=>void,
 *   info   : (msg:string)=>void,
 *   warn   : (msg:string)=>void
 * }}
 */
export const useNotify = (): NotifyAPI => {
  const { enqueueSnackbar } = useSnackbar();

  const notify = (
    msg: string,
    variant: 'success' | 'error' | 'info' | 'warning',
  ) => enqueueSnackbar(msg, { variant, autoHideDuration: 4000 });

  return {
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error'),
    info: (m) => notify(m, 'info'), // NEW
    warn: (m) => notify(m, 'warning'), // NEW
  };
};
