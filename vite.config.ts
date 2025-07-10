import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
    plugins: [react(), sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourceMaps: {
            assets: ['./build/static/js/*.js', './build/static/js/*.js.map'],
        },
        bundleSizeOptimizations: {
            excludeDebugStatements: true,
            excludeReplayIframe: true,
            excludeReplayWorker: true,
        },
        disable: process.env.NODE_ENV === 'development',
    })],
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
});
