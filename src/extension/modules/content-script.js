import { onMessage } from 'utils/chrome/runtime';
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
        if (value) {
            connectObserver();
        } else {
            disconnectObserver();
        }
    },
    translateTo: () => {
        translateSubtitles();
    },
    'created-translations': () => {
        translateSubtitles();
    },
    'auto-translate': () => {
        if (!getOption('created-translations')) {
            translateSubtitles();
        }
    },
    'time-close-translation': () => {
        removeTranslation();
    },
};

function performTask(id, value) {
    if (tasks[id]) {
        tasks[id](value);
    }
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

            if (mutation.type == 'childList' && classCss.includes('ytp-caption-segment')) {
                if (line2 == '') {
                    line2 = text;
                } else {
                    if (RegExp(escape(line2)).test(text)) {
                        line2 = text;
                    } else {
                        if (!RegExp('^' + escape(line2)).test(text)) {
                            const captions = document.querySelector('.ytp-caption-window-bottom');
                            if (captions) {
                                captions.style.display = 'none';
                            }
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
                    clearInterval(timer);
                    console.log('[Extension] Observer error (time limit exceeded)');
                    resolve();
                }
            }, 10 * 1000);
        });
    };

    const player = await playerAvailable();
    if (!player) {
        return;
    }
    setupSubtitles(player);
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
    if (!observer) {
        return;
    }
    observer.disconnect();
    deactivateSubtitles();
    console.log('[Extension] Observer disconnected');
}

function restartExecution() {
    setInterval(() => {
        const url = window.location.href;
        if (getOption('curent-path') != url && url.includes('watch')) {
            if (observer) {
                disconnectObserver();
                setOption('subtitlesActivated', false);
            }
            removeSubtitles();
            connectObserver();
        }
        if (getOption('curent-path') != url) {
            setOption('curent-path', url);
        }
    }, 100);
}

async function app() {
    await getAllOptions();

    if (!getOption('curent-path')) {
        setOption('curent-path', window.location.href);
        restartExecution();
    }

    onMessage((request) => {
        const id = request.id;
        if (id == 'analytics') {
            return;
        }
        const value = request.value;
        setOption(id, value);
        performTask(id, value);
    });

    const captions = getOption('captions');
    if (!captions) {
        return;
    }

    // load only in videos
    if (!window.location.href.includes('watch')) {
        return;
    }

    connectObserver();
}

app();
