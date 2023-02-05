
/**
 * RegExp mit extras:
 *   {STERN}     => alles was als stern gilt (keine klammern)
 *   {KLO}       => Klammer auf (open)
 *   {KLC}       => Klammer zu (close)
 *   {BINI}      => BinnenI (aktuell [ïÏI])
 *   {II}        => Irgend ein I (aktuell [iïÏI])
 *   {STERN-KLO} => Klammer auf oder stern
 *   {ALT}       => alternativ: /und|oder|&|bzw\.?/ ; bei doppelnennungen
 *
 * Kann leichter erweitert werden.
 * Vielleicht schlechtere performanz. TODO eventuell caching?
 *
 * Beispiel: "Schüler{STERN-KLO}{II}n{KLC}?"
 *
 * TODO: "&" oder "."
 */
let BinnenIMap: { [k: string]: string } = {
    // auch mittelpunkt (· \u00b7)
    "{STERN}": String.raw`[\:\/\*\_-·’']{1,2}`,
    "{KLO}": String.raw`[(\[{]`,
    "{KLC}": String.raw`[)\]}]`,
    "{BINI}": String.raw`[ïÏI]`,
    "{II}": String.raw`[iïÏI]`,
    "{STERN-KLO}": '{STERN-KLO}', // später generiert
    "{ALT}": String.raw`(?:und|oder|&|bzw\.?|[\/\*_\-:])`,
    // syllable hyphen (soft hyphen)
    "{SHY}": `\u00AD`,
    "{NOURL}": String.raw`(?<!https?://[-a-zA-Z0-9@:%._\\+~#=()&?]{0,256})`, // negative lookbehind checking we are not in an url
};
let BinnenI_Repl: RegExp = RegExp(`(${Object.keys(BinnenIMap).join("|")})`, 'g');

export function binnenReMap(regex: string): string {
    return regex.replace(BinnenI_Repl, (m) => {
        // @ts-ignore
        return BinnenIMap[m];
    });
}

export function BinnenRegEx(regex: string, modifier?: string): RegExp {
    return RegExp(binnenReMap(regex), modifier);
}

BinnenRegEx.addMapping = (key: string, replacement: string) => {
    BinnenIMap[key] = replacement;
    BinnenI_Repl = RegExp(`(${Object.keys(BinnenIMap).join("|")})`, 'g');
}

BinnenRegEx.addMapping("{STERN-KLO}", `(?:${BinnenIMap['{STERN}']}|${BinnenIMap['{KLO}']})`);
