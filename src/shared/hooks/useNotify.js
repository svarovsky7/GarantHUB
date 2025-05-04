import { useSnackbar } from 'notistack';

export const useNotify = () => {
    const { enqueueSnackbar } = useSnackbar();
    return {
        success: (msg) => enqueueSnackbar(msg),
        error  : (msg) => enqueueSnackbar(msg),
    };
};
