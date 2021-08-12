export function wordToSpan(text) {
    const words = text.split(' ');
    let span = '';
    for (const word of words) {
        span += `<span class="word">${word} </span>`;
    }
    return span;
}

export function escape(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
