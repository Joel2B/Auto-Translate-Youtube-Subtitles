/* global chrome */
export function onMessage(callback) {
    try {
        chrome.runtime.onMessage.addListener(async (request) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('onMessage', request);
            }

            callback(request);
        });
    } catch (error) {
        console.log(error);
    }
}

export function sendMessage(value) {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('sendMessage', value);
        }

        const manifest = chrome.runtime.getManifest();

        chrome.tabs.query(
            {
                url: manifest.content_scripts[0].matches,
            },
            (tabs) => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, value);
                }
            },
        );
    } catch (error) {
        console.log(error);
    }
}

export function sendMessageBackground(value) {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('sendMessageBackground', value);
        }

        chrome.runtime.sendMessage(value);
    } catch (error) {
        console.log(error);
    }
}

export function onInstalled(callback) {
    try {
        chrome.runtime.onInstalled.addListener((details) => {
            if (
                details.reason === chrome.runtime.OnInstalledReason.INSTALL ||
                details.reason === chrome.runtime.OnInstalledReason.UPDATE
            ) {
                callback();
            }
        });
    } catch (error) {
        console.log(error);
    }
}

export async function getAll() {
    return await chrome.windows.getAll({ populate: true });
}

export function getManifest() {
    return chrome.runtime.getManifest();
}

export function executeScript(...params) {
    chrome.scripting.executeScript(...params);
}

export function insertCSS(...params) {
    chrome.scripting.insertCSS(...params);
}
