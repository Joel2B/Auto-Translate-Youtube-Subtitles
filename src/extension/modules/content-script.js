import { onMessage } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import {
    setupSubtitles,
    deactivateSubtitles,
    removeTranslation,
    translateSubtitles,
} from 'extension/modules/subtitles';
import { wordToSpan, escape } from 'extension/modules/word';

let observer;

const tasks = {
    captions: async (value) => {
        if (value) {
            startObserver();
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

function connectObserver() {
    let line1 = '';
    let line2 = '';

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

    const player = document.querySelector('#movie_player');
    if (!player) {
        return;
    }
    setupSubtitles(player);
    const config = {
        attributes: true,
        childList: true,
        subtree: true,
    };

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

function startObserver() {
    connectObserver();
    if (!observer) {
        console.log('[Extension] Observer error');
        const timer = setInterval(() => {
            console.log('[Extension] Trying to connect the observer');
            if (!observer) {
                connectObserver();
                clearInterval(timer);
            }
        }, 50);
        setTimeout(() => {
            if (!observer) {
                clearInterval(timer);
                console.log('[Extension] Observer error');
            }
        }, 10 * 1000);
    }
}

async function app() {
    await getAllOptions();

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

    startObserver();
}

app();
