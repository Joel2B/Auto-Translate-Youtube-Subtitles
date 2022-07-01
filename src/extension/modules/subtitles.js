/* global TRANSLATION_API */

import { getOption, setOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';

const dom = {};
let timerRemoveTranslation;

function getSubtitleButton() {
    return document.querySelector('.ytp-subtitles-button');
}

function isSubtitlesEnabled() {
    return getSubtitleButton() && getSubtitleButton().style.display !== 'none' && getSubtitleButton().clientWidth !== 0;
}

function isSubtitlesActive() {
    const pressed = getSubtitleButton().getAttribute('aria-pressed');

    return pressed === 'true';
}

async function activateSubtitles() {
    return new Promise((resolve) => {
        const value = getOption('subtitlesActivated');

        if (value) {
            if (!isSubtitlesActive()) {
                getSubtitleButton().click();
            }

            resolve();
        }

        if (!value) {
            const timer = setInterval(() => {
                if (!isSubtitlesEnabled()) {
                    return;
                }

                if (!isSubtitlesActive()) {
                    getSubtitleButton().click();
                }

                setOption('subtitlesActivated', true);
                clearInterval(timer);
                resolve();
            }, 50);

            setTimeout(() => {
                if (getOption('subtitlesActivated')) {
                    return;
                }

                console.log('[Extension] Subtitles are disabled');

                clearInterval(timer);
                resolve();
            }, 10 * 1000);
        }
    });
}

function createDictionary(data) {
    const dictTable = document.createElement('div');
    dictTable.className = 'dict-table';

    for (const dict of data) {
        const container = document.createElement('div');
        const title = document.createElement('div');
        const translatedWords = document.createElement('div');

        title.className = 'title';
        title.textContent = dict.pos;

        translatedWords.className = 'translated-words';

        for (const entry of dict.entry) {
            const word = document.createElement('span');
            const reverseTranslation = document.createElement('span');

            word.className = 'translated-word';
            word.textContent = entry.word;

            reverseTranslation.className = 'origin-word';

            for (const alternateWords of entry.reverse_translation) {
                reverseTranslation.textContent += alternateWords + ' ';
            }

            translatedWords.appendChild(word);
            translatedWords.appendChild(reverseTranslation);
        }

        container.appendChild(title);
        container.appendChild(translatedWords);
        dictTable.appendChild(container);
    }

    dom.translation.parentNode.insertBefore(dictTable, dom.translation.nextSibling);
}

export function removeSubtitles() {
    if (dom.subtitles) {
        dom.subtitles.remove();
    }
}

export function removeTranslation() {
    Array.from(dom.translation.childNodes).map((span) => span.remove());

    if (document.querySelector('.dict-table')) {
        document.querySelector('.dict-table').remove();
    }

    if (document.querySelector('#subtitles .selected')) {
        document.querySelector('#subtitles .selected').classList.remove('selected');
    }
}

async function translateWord(e) {
    let sourceLanguage = getOption('translateTo');

    if (sourceLanguage.includes('#')) {
        sourceLanguage = sourceLanguage.split('#')[1];
    } else {
        sourceLanguage = '';
    }

    const targetLanguage = getOption('primary-language').split('#')[1];
    const server = getOption('server-translate').split('#')[1];
    const timeCloseTranslation = getOption('time-close-translation');

    removeTranslation();
    clearTimeout(timerRemoveTranslation);

    if (e.target.localName === 'span' && e.target.outerHTML.includes('word') && e.target.innerText !== '') {
        const word = e.target.innerText.trim().toLowerCase();

        if (process.env.NODE_ENV === 'development') {
            console.log(sourceLanguage, targetLanguage, server, word);
        }

        const params = {
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            server: server,
            word: word,
        };

        const data = new URLSearchParams();

        for (const key in params) {
            data.append(key, params[key]);
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('URL', TRANSLATION_API + '?' + data.toString());
        }

        const result = await fetch(TRANSLATION_API, {
            method: 'POST',
            body: data,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                console.warn(error);
            });

        if (process.env.NODE_ENV === 'development') {
            console.log('FETCH', result);
        }

        removeTranslation();

        if (!result) {
            return;
        }

        sendMessageBackground({
            id: 'analytics',
            value: 'translated-words',
        });

        e.target.classList.add('selected');

        const origin = document.createElement('span');
        const trans = document.createElement('span');

        origin.textContent = result.origin;
        trans.textContent = result.trans;

        dom.translation.appendChild(origin);
        dom.translation.appendChild(trans);

        if (result.dict) {
            createDictionary(result.dict);
        }

        if (timeCloseTranslation === 0) {
            return;
        }

        timerRemoveTranslation = setTimeout(() => {
            removeTranslation();
        }, timeCloseTranslation * 1000);
    }
}

export function deactivateSubtitles() {
    removeSubtitles();

    if (!isSubtitlesEnabled()) {
        return;
    }

    if (getSubtitleButton().getAttribute('aria-pressed') === 'true') {
        getSubtitleButton().click();
    }

    setOption('subtitlesActivated', false);
}

function createSubtitles() {
    removeSubtitles();

    dom.subtitles = document.createElement('div');
    dom.subtitles.id = 'subtitles';

    const line1 = document.createElement('div');
    const line2 = document.createElement('div');

    line1.id = 'line1';
    line2.id = 'line2';

    dom.translation = document.createElement('div');
    dom.translation.id = 'translation';

    dom.subtitles.appendChild(line1);
    dom.subtitles.appendChild(line2);

    dom.subtitles.appendChild(dom.translation);
    dom.player.appendChild(dom.subtitles);

    dom.subtitles.addEventListener('click', translateWord);
}

function dragSubtitles() {
    let initialX;
    let initialY;
    let currentX;
    let currentY;

    dom.subtitles.addEventListener(
        'mousedown',
        (e) => {
            // get the mouse cursor position at startup
            initialX = e.clientX;
            initialY = e.clientY;

            const drag = (e) => {
                e.preventDefault();
                // calculate the new cursor position
                currentX = initialX - e.clientX;
                currentY = initialY - e.clientY;
                initialX = e.clientX;
                initialY = e.clientY;
                // set the element's new position
                dom.subtitles.style.top = dom.subtitles.offsetTop - currentY + 'px';
                dom.subtitles.style.left = dom.subtitles.offsetLeft - currentX + 'px';
            };

            const dragEnd = () => {
                document.removeEventListener('mousemove', drag, false);
                document.removeEventListener('mouseup', dragEnd, false);
            };

            document.addEventListener('mousemove', drag, false);
            document.addEventListener('mouseup', dragEnd, false);
        },
        false,
    );
}

export async function translateSubtitles() {
    let translateTo = getOption('translateTo');

    if (translateTo && translateTo.includes('#')) {
        translateTo = translateTo.split('#')[0];
    }

    const createdTranslations = getOption('created-translations');
    const autoTranslate = getOption('auto-translate');
    const delay = (ms) =>
        new Promise((resolve) => {
            setTimeout(resolve, ms);
        });

    if (!createdTranslations && !autoTranslate) {
        return;
    }

    const settingsButton = document.querySelector('.ytp-settings-button');
    settingsButton.click();

    await delay(1000);

    let subtitlesExist = false;
    const subtitulesMenu = document.querySelectorAll('.ytp-menuitem');

    for (const item of subtitulesMenu) {
        if (/\([0-9]+\)/.test(item.textContent)) {
            item.click();
            subtitlesExist = true;
            break;
        }
    }

    if (!subtitlesExist) {
        settingsButton.click();
        return;
    }

    await delay(1000);

    let translationsExist = false;

    if (createdTranslations) {
        const subtituleItems = document.querySelectorAll('.ytp-menuitem');

        for (const item of subtituleItems) {
            if (item.textContent.includes(translateTo)) {
                item.click();
                translationsExist = true;
                break;
            }
        }

        settingsButton.click();

        if (translationsExist) {
            return;
        }
    }

    if (autoTranslate) {
        const subtituleItems = document.querySelectorAll('.ytp-menuitem');
        let sameLanguage = false;

        for (const item of subtituleItems) {
            if (item.ariaChecked === 'true' && item.textContent.includes(translateTo)) {
                item.click();
                sameLanguage = true;
                break;
            }
        }

        if (sameLanguage) {
            settingsButton.click();
            return;
        }

        // everything will work if the automatic translation button is at the end
        subtituleItems[subtituleItems.length - 1].click();
    }

    await delay(1000);

    let languageExist = false;
    const languages = document.querySelectorAll('.ytp-menuitem');

    for (const item of languages) {
        if (item.textContent === translateTo) {
            languageExist = true;

            if (item.ariaChecked === 'true') {
                settingsButton.click();
            } else {
                item.click();
            }
            break;
        }
    }

    if (!languageExist) {
        if (document.querySelector('.ytp-settings-menu').style.display !== 'none') {
            settingsButton.click();
        }
    }
}

async function closeAd() {
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            console.log('[Extension] Ad running');

            const ad = document.querySelectorAll(
                '.ytp-ad-player-overlay, .ytp-ad-player-overlay-instream-info, .ytp-ad-simple-ad-badge',
            );

            if (ad.length === 0) {
                console.log('[Extension] Ad closed');

                clearInterval(timer);
                resolve();
            }

            // enough time for ads to load
        }, 2 * 1000);
    });
}

export async function setupSubtitles(player) {
    dom.player = player;

    await closeAd();
    await activateSubtitles();

    if (!isSubtitlesEnabled()) {
        return;
    }

    getSubtitleButton().addEventListener('click', activateSubtitles);

    createSubtitles();
    dragSubtitles();
    translateSubtitles();
}
