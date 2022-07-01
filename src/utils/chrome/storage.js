/* global chrome */
export function setLocalStorage(key, value) {
    chrome.storage.local.set({
        [key]: value,
    });
}

export async function getLocalStorage(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(key, (value) => {
                if (typeof key === 'string') {
                    value = value[key];
                }

                resolve(value);
            });
        } catch (ex) {
            reject(ex);
        }
    });
}

export async function getAllLocalStorage() {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(null, (options) => {
                resolve(options);
            });
        } catch (ex) {
            reject(ex);
        }
    });
}
