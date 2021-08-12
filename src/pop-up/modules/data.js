import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { sendMessage } from 'utils/chrome/runtime';

export function setValue(id, value) {
    setLocalStorage(id, value);
    sendMessage({
        id: id,
        value: value,
    });
}

export async function getValue(id) {
    return await getLocalStorage(id);
}
