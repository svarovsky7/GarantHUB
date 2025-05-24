/* .eslintrc.js
   CRA подхватывает этот конфиг автоматически.
   Плагин «import» использует резолвер alias, чтобы распознавать FSD-импорты
   @shared/… , @pages/…, и одновременно умеет резолвить node-модули.
*/
module.exports = {
    extends: [
        'react-app',                  // базовые правила CRA
        'plugin:import/recommended',  // правила плагина import/*
    ],
    plugins: ['import'],

    settings: {
        'import/resolver': {
            /* ---------- alias под FSD ---------- */
            alias: {
                map: [
                    ['@',        './src'],
                    ['@app',      './src/app'],
                    ['@pages',    './src/pages'],
                    ['@widgets',  './src/widgets'],
                    ['@features', './src/features'],
                    ['@entities', './src/entities'],
                    ['@shared',   './src/shared'],
                ],
                extensions: ['.js', '.jsx', '.tsx'],
            },
            /* ---------- fallback: node_modules ---------- */
            node: {
                extensions: ['.js', '.jsx', '.tsx'],
                paths: ['src'],
            },
        },
    },
};
