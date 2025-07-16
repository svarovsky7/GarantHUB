import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@app': path.resolve(__dirname, 'src/app'),
            '@pages': path.resolve(__dirname, 'src/pages'),
            '@widgets': path.resolve(__dirname, 'src/widgets'),
            '@features': path.resolve(__dirname, 'src/features'),
            '@entities': path.resolve(__dirname, 'src/entities'),
            '@shared': path.resolve(__dirname, 'src/shared'),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor libraries
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        if (id.includes('antd')) {
                            return 'vendor-antd';
                        }
                        if (id.includes('@mui')) {
                            return 'vendor-mui';
                        }
                        if (id.includes('@tanstack/react-query')) {
                            return 'vendor-query';
                        }
                        if (id.includes('exceljs')) {
                            return 'vendor-excel';
                        }
                        if (id.includes('dayjs') || id.includes('lodash') || id.includes('zod')) {
                            return 'vendor-utils';
                        }
                        if (id.includes('@supabase')) {
                            return 'vendor-supabase';
                        }
                        // All other vendor libraries
                        return 'vendor-other';
                    }
                    
                    // App chunks
                    if (id.includes('src/shared/utils')) {
                        return 'shared-utils';
                    }
                    if (id.includes('src/shared/hooks')) {
                        return 'shared-hooks';
                    }
                    if (id.includes('src/shared/components')) {
                        return 'shared-components';
                    }
                    if (id.includes('src/entities')) {
                        return 'entities';
                    }
                    
                    // Default chunk
                    return undefined;
                }
            }
        }
    }
});
