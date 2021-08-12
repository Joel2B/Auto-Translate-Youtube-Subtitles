/* global chrome */
export function onMessage(callback, async) {
    try {
        chrome.runtime.onMessage.addListener((request) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('onMessage', request, async);
            }
            callback(request);
            if (async) {
                return true;
            }
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
