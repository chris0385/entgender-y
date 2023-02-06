export function startsWithCapitalLetter(s: string): boolean {
    return s != null && s.length > 0 && /[A-Z]/.test(s[0]);
}

export function capitalize(s: string): string {
    if (s == null || s.length < 1) {
        return "";
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function removeAccents(s: string): string {
    if (s == null || s.length < 1) {
        return "";
    }
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}