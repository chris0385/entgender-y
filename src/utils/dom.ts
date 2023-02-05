export function createDomElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        properties: Partial<HTMLElementTagNameMap[K]>
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    for (let [k, v] of Object.entries(properties)) {
        element[k] = v;
    }
    return element;
}