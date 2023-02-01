
# Think of making this configurable
Maybeby using something like the affix compression in aspell:
http://aspell.net/man-html/Affix-Compression.html#Affix-Compression

``` // from artikelUndKontraktionen
            if (/der|die|dessen|ein|sie|ih[rmn]|zu[rm]|jede/i.test(s)) {
                s = new Replacement(String.raw`\b(d)(ie${Const.gstar}der|er${Const.gstar}die)\b`, "ig", "\$1as", "die*der|der*die").replace(s, counter);
                s = new Replacement(String.raw`\b(d)(en${Const.gstar}die|ie${Const.gstar}den)\b`, "ig", "\$1as", "").replace(s, counter);
                s = new Replacement(String.raw`\b(d)(es${Const.gstar}der|er${Const.gstar}des)\b`, "ig", "\$1es", "").replace(s, counter);
```
Convert into
```
// Configfile phettberg.mapping.dat
artikelUndKontraktionen derdie \$1as
artikelUndKontraktionen dendie \$1as
artikelUndKontraktionen desder \$1es


And in code:
                let factory = new ReplacementGroup('artikelUndKontraktionen');
                // Note, the last parameter (description = "") should be kept in code.
                // Consider actually mayking it mandatory, and use it as key from config-file?
                // (maybe put the key as first parameter, as it is more human-readyble than the regex)
                s = factory.replacement(String.raw`\b(d)(ie${Const.gstar}der|er${Const.gstar}die)\b`, "ig", "derdie", "die*der|der*die").replace(s, counter);
                s = factory.replacement(String.raw`\b(d)(en${Const.gstar}die|ie${Const.gstar}den)\b`, "ig", "dendie").replace(s, counter);
                s = factory.replacement(String.raw`\b(d)(es${Const.gstar}der|er${Const.gstar}des)\b`, "ig", "desder").replace(s, counter);
```

This would enable support of alternatives to Phettberg using config file, without changing code.
Example of alternative: https://geschlechtsneutral.net/kurzubersicht-uber-das-gesamtsystem/

## Schwierigkeiten

### Methoden
entfernePartizip nutzt methoden. Es ist aber plural erkennung, könnte so sein:
```typescript
type FOO = {
    entfernePartizip: {
        "Studierende": {
            "ROOT": "Student",
            "SINGULAR": "y",
            "PLURAL": "ys",
        },
        "Dozierende": {
            "bla": ReplacementConfig
        }
    }
}
s = factory.replacement(/(?<!^)(?<!\. )Studierende(r|n?)?/g, "Studierende", (match) => {
    if (match.endsWith("n") || match.endsWith("e")) {
        return "PLURAL";
    }
    return "SINGULAR";
}).replace(s, counter);
```

### Unterschiedliche regeln
Eventuell muss es teilweise mit plug-ins behandelt werden, weil die Unterschiede zu Groß sind.

Alternativ: "alles ist ein plugin" ansatz?

# Performance:
In Replacement, cache RegExp
In factories, cache Replacement instances