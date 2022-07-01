import { onMessage, sendMessageBackground } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import {
    setupSubtitles,
    deactivateSubtitles,
    removeSubtitles,
    removeTranslation,
    translateSubtitles,
} from 'extension/modules/subtitles';
import { wordToSpan, escape } from 'extension/modules/word';

let observer;

const tasks = {
    captions: (value) => {
        (value ? connectObserver : disconnectObserver)();
    },
    translateTo: () => translateSubtitles(),
    'created-translations': () => translateSubtitles(),
    'auto-translate': () => {
        if (!getOption('created-translations')) translateSubtitles();
    },
    'time-close-translation': () => removeTranslation(),
};

function performTask(id, value) {
    if (tasks[id]) tasks[id](value);
}

async function connectObserver() {
    const callback = (mutationsList) => {
        for (const mutation of mutationsList) {
            if (!getOption('subtitlesActivated')) {
                continue;
            }

            const classCss = mutation.target.className;
            const text = mutation.target.innerText;

            if (typeof classCss !== 'string') {
                continue;
            }

            if (mutation.type === 'childList' && classCss.includes('ytp-caption-segment')) {
                const captions = document.querySelector('.ytp-caption-window-bottom');

                if (captions) {
                    captions.style.display = 'none';
                }

                if (line2 === '') {
                    line2 = text;
                } else {
                    if (RegExp(escape(line2)).test(text)) {
                        line2 = text;
                    } else {
                        if (!RegExp('^' + escape(line2)).test(text)) {
                            line1 = line2;
                            line2 = text;
                        }
                    }
                }

                document.querySelector('#line1').innerHTML = wordToSpan(line1);
                document.querySelector('#line2').innerHTML = wordToSpan(line2);
            }
        }
    };

    const playerAvailable = async () => {
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                console.log('[Extension] Trying to connect the observer');

                const player = document.querySelector('#movie_player');

                if (player) {
                    clearInterval(timer);
                    resolve(player);
                }
            }, 50);
            setTimeout(() => {
                const player = document.querySelector('#movie_player');

                if (!player) {
                    console.log('[Extension] Observer error (time limit exceeded)');

                    clearInterval(timer);
                    resolve();
                }
            }, 10 * 1000);
        });
    };

    const player = await playerAvailable();

    if (!player) {
        return;
    }

    await setupSubtitles(player);

    const config = {
        attributes: true,
        childList: true,
        subtree: true,
    };

    let line1 = '';
    let line2 = '';

    observer = new MutationObserver(callback);
    observer.observe(player, config);

    console.log('[Extension] Observer connected');
}

function disconnectObserver() {
    if (!observer) return;

    observer.disconnect();
    deactivateSubtitles();

    console.log('[Extension] Observer disconnected');
}

function restartExecution() {
    const timer = setInterval(() => {
        if (!getId()) {
            clearInterval(timer);
            return;
        }

        const url = window.location.href;

        if (getOption('curent-path') !== url && url.includes('watch')) {
            if (observer) {
                disconnectObserver();
                setOption('subtitlesActivated', false);
            }

            removeSubtitles();
            connectObserver();
        }

        if (getOption('curent-path') !== url) {
            setOption('curent-path', url);
        }
    }, 100);
}

function getId() {
    // eslint-disable-next-line no-undef
    return chrome.runtime.id;
}

function getDate() {
    return Number(Date.now().toString().slice(0, 10));
}

async function app() {
    if (!getId()) return;

    if (process.env.NODE_ENV === 'development') {
        console.log('Extension id:', getId());
    }

    await getAllOptions();

    // TODO: provisional
    const timeKeepAlive = getOption('timeKeepAlive');
    let keepAlive = (getDate() + timeKeepAlive) * 1000;

    const timer = setInterval(() => {
        if (keepAlive < Date.now()) {
            sendMessageBackground('');

            keepAlive = (getDate() + timeKeepAlive) * 1000;

            if (process.env.NODE_ENV === 'development') {
                console.log('keep alive', keepAlive, Date.now());
            }
        }

        if (getId()) return;

        disconnectObserver();
        removeSubtitles();

        if (process.env.NODE_ENV === 'development') {
            console.log('lost extension connection');
        }

        clearInterval(timer);
    }, 1000);

    if (!getOption('curent-path')) {
        setOption('curent-path', window.location.href);
        restartExecution();
    }

    onMessage((request) => {
        if (!getId()) return;

        const id = request.id;

        if (id === 'analytics') {
            return;
        }

        const value = request.value;

        setOption(id, value);
        performTask(id, value);
    });

    if (!getOption('captions')) {
        return;
    }

    // load only in videos
    if (!window.location.href.includes('watch')) {
        return;
    }

    connectObserver();
}

app();
