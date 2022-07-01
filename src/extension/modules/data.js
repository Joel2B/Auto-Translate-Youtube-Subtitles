import { getAllLocalStorage } from 'utils/chrome/storage';

let options = {};

export function getOption(id) {
    return options[id];
}

export function setOption(id, value) {
    options[id] = value;
}

export async function getAllOptions() {
    options = await getAllLocalStorage();
}
