
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