import { getAllLocalStorage } from 'utils/chrome/storage';

export let optionsPool = {};

export function getOption(id) {
    return optionsPool[id];
}

export function setOption(id, value) {
    optionsPool[id] = value;
}

export async function getAllOptions() {
    optionsPool = await getAllLocalStorage();
}
