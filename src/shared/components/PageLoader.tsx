import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';

const PageLoader = React.memo(() => (
  <Backdrop open sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
    <CircularProgress size={48} color="inherit" />
  </Backdrop>
));

PageLoader.displayName = 'PageLoader';

export default PageLoader;