// /shared/utils/fixForeignKeys.ts

/**
 * Приводит значения внешних ключей к null, если они невалидны (0, '', undefined).
 * Использовать для приведения всех FK перед отправкой в insert/update.
 */
export function fixForeignKeys<T extends Record<string, any>>(obj: T, keys: string[]): T {
    const newObj = { ...obj };
    keys.forEach((key) => {
        if (newObj[key] === 0 || newObj[key] === '' || newObj[key] === undefined) {
            newObj[key] = null;
        }
    });
    return newObj;
}
