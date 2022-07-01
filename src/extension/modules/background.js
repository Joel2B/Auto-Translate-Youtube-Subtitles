import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { onMessage, onInstalled, getAll, getManifest, executeScript, insertCSS } from 'utils/chrome/runtime';
import defaults from './defaults';

onMessage(async (request) => {
    const id = request.id;
    const value = request.value;

    if (id === 'analytics') {
        const data = await getLocalStorage(id);
        data[value] += 1;

        setLocalStorage(id, data);
    }
});

async function setDefaultSettings() {
    const config = defaults;

    for (const option in defaults) {
        if ((await getLocalStorage(option)) !== undefined) {
            continue;
        }

        setLocalStorage(option, config[option]);
    }
}

async function init() {
    await setDefaultSettings();

    const navigatorWindows = await getAll();
    const contentScripts = getManifest().content_scripts[0];
    const match = contentScripts.matches[0].replaceAll('*', '.*').replaceAll('/', '\\/');
    const regex = new RegExp(match);
    const js = contentScripts.js[0];
    const css = contentScripts.css[0];

    navigatorWindows.forEach((window) => {
        for (const tab of window.tabs) {
            if (!regex.test(tab.url)) {
                continue;
            }

            executeScript({
                target: {
                    tabId: tab.id,
                },
                files: [js],
            });

            insertCSS({
                target: {
                    tabId: tab.id,
                },
                files: [css],
            });
        }
    });
}

onInstalled(init);
