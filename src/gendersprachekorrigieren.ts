declare var chrome: any;
interface BeGoneSettings {
    aktiv?: boolean;
    doppelformen?: boolean;
    skip_topic?: boolean;
    partizip?: boolean;
    whitelist?: string;
    blacklist?: string;
    counter?: boolean;
    filterliste?: "Bei Bedarf"|"Whitelist"|"Blacklist"|undefined;
}

class BeGoneSettingsHelper {
    public static isWhitelist(settings: BeGoneSettings): boolean {
        return settings.filterliste === "Whitelist";
    }

    public static isBlacklist(settings: BeGoneSettings): boolean {
        return settings.filterliste === "Blacklist";
    }

    public static whiteliststring(settings: BeGoneSettings): string {
        return settings.whitelist ? settings.whitelist.replace(/(\r\n|\n|\r)/gm, "|") : "";
    } 

    public static blackliststring(settings: BeGoneSettings): string {
        return settings.blacklist ? settings.blacklist.replace(/(\r\n|\n|\r)/gm, "|") : "";
    } 
}

export class BeGone {
    public version = 2.7;
    private replacementsb = 0;
    private replacementsd = 0;
    private replacementsp = 0;
    private settings: BeGoneSettings = { aktiv: true, partizip: true, doppelformen: true, skip_topic: false };
    private nodes: Array<CharacterData> = new Array<CharacterData>();
    private mtype: string | undefined = undefined;

    private log(s: string) {
        //console.log(s);
    }

    private textNodesUnder(el: Node): Array<CharacterData> {
        var n, a = new Array<CharacterData>(),
            walk = document.createTreeWalker(
                el,
                NodeFilter.SHOW_TEXT, 
                { acceptNode: (node: Node) => {
                        //Nodes mit weniger als 5 Zeichen nicht filtern
                        if (!node.textContent || node.textContent.length < 5) {
                            return NodeFilter.FILTER_REJECT;
                        } else {
                            // note about filtering <pre> elements: those elements might contain linebreaks (/r/n etc.) that are removed during filtering to make filtering easier; the easy fix is to ignore those elements
                            var isUntreatedElement = node.parentNode ? (node.parentNode instanceof HTMLInputElement || node.parentNode instanceof HTMLTextAreaElement || node.parentNode instanceof HTMLScriptElement || node.parentNode instanceof HTMLStyleElement || node.parentNode instanceof HTMLPreElement || node.parentNode.nodeName == "CODE" || node.parentNode.nodeName == "NOSCRIPT") : false;
                            var isDivTextbox = document.activeElement && (document.activeElement.getAttribute("role") == "textbox" || document.activeElement.getAttribute("contenteditable") == "true") && document.activeElement.contains(node);
    
                            //Eingabeelemente, <script>, <style>, <code>-Tags nicht filtern
                            if (isUntreatedElement || isDivTextbox) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            //Nur Nodes erfassen, deren Inhalt ungefähr zur späteren Verarbeitung passt
                            else if (/\b(und|oder|bzw)|[a-zA-ZäöüßÄÖÜ][\/\*.&_\(]-?[a-zA-ZäöüßÄÖÜ]|[a-zäöüß\(_\*:\.][iI][nN]|nE\b|r[MS]\b|e[NR]\b|fahrende|ierende|Mitarbeitende|Forschende|flüch/.test(node.textContent)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                        return NodeFilter.FILTER_REJECT;
                    }
                  
                },
                false);
        while (n = walk.nextNode() as CharacterData) {
            let nodeParent = n.parentNode;
            if (!nodeParent) {
                a.push(n);
            } else
            if (!this.isHTMLFormattingNodeName(nodeParent.nodeName)){
                a.push(n);
            } else {
                // we've got a text node that will probably need context to be analyzed (like an word highlighted with a <mark> tag) - save the context nodes as well
                if (nodeParent.previousSibling && nodeParent.previousSibling.nodeType === 3) {
                    a.push(nodeParent.previousSibling as CharacterData);
                }
                a.push(n);
                if (nodeParent.nextSibling && nodeParent.nextSibling.nodeType === 3) {
                    a.push(nodeParent.nextSibling as CharacterData);
                }
            }
        }
        return a;
    }

    public handleResponse(message: { type?: string, response: string }) {
        this.settings = JSON.parse(message.response);
    
        if (!this.settings.aktiv && this.settings.filterliste !== "Bei Bedarf" || this.settings.filterliste == "Bei Bedarf" && message.type !== "ondemand") return;
    
        this.mtype = message.type;
        if (!BeGoneSettingsHelper.isWhitelist(this.settings) && !BeGoneSettingsHelper.isBlacklist(this.settings) || BeGoneSettingsHelper.isWhitelist(this.settings) && RegExp(BeGoneSettingsHelper.whiteliststring(this.settings)).test(document.URL) || BeGoneSettingsHelper.isBlacklist(this.settings) && !RegExp(BeGoneSettingsHelper.blackliststring(this.settings)).test(document.URL)){
            //Entfernen bei erstem Laden der Seite
            this.entferneInitial();
    
            //Entfernen bei Seitenänderungen
            try {
                var observer = new MutationObserver((mutations:any) => {
                    var insertedNodes = new Array<CharacterData>();
                    mutations.forEach((mutation:any) => {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            insertedNodes = insertedNodes.concat(this.textNodesUnder(mutation.addedNodes[i]));
                        }
                    });
                    this.entferneInserted(insertedNodes);
                });
                observer.observe(document, {
                    childList: true,
                    subtree: true,
                    attributes: false,
                    characterData: false
                });
            } catch (e) {
                console.error(e);
                chrome.runtime.sendMessage({
                    action: 'error',
                    page: document.location.hostname,
                    source: 'gendersprachekorrigieren.js',
                    error: e
                });
            }
        }
    }    

    private artikelUndKontraktionen(s: string): string {

        if (/[a-zA-ZäöüßÄÖÜ][\/\*.&_\(]-?[a-zA-ZäöüßÄÖÜ]/.test(s) && /der|die|dessen|ein|sie|ihr|sein|zu[rm]|jede|frau|man|eR\b|em?[\/\*.&_\(]-?e?r\b|em?\(e?r\)\b/.test(s)) {
            this.log("11000");
            s = s.replace(/[\/\*_\(-]/, "_");

            //Stuff
            if (/der|die|dessen|ein|sie|ih[rmn]|zu[rm]|jede/i.test(s)) {
                this.log("11100");
                s = s.replace(/\b(d)(ie_+der|er_+die)\b/ig, (match, p1) => {
                    this.log("11101");
                    this.replacementsb++;
                    return p1 + "as";
                });
                s = s.replace(/\b(d)(en_+die|ie_+den)\b/ig, (match, p1) => {
                    this.log("11102");
                    this.replacementsb++;
                    return p1 + "as";
                });
                s = s.replace(/\b(d)(es_+der|er_+des)\b/ig, (match, p1) => {
                    this.log("11103");
                    this.replacementsb++;
                    return p1 + "es";
                });
                s = s.replace(/\b(d)(er_+dem|em_+der)\b/ig, (match, p1) => {
                    this.log("11104");
                    this.replacementsb++;
                    return p1 + "em";
                });
                s = s.replace(/\b(d)(eren_dessen|essen_deren)\b/ig, (match, p1) => {
                    this.log("11105");
                    this.replacementsb++;
                    return p1 + "essen";
                });
                s = s.replace(/\bdiese[r]?_(diese[rnms])|(diese[rnms])_diese[r]?\b/ig, (match, p1, p2) => {
                    this.replacementsb++;
                    if (p1) {
                        this.log("11106");
                        return p1;
                    } else if (p2) {
                        this.log("11107");
                        return p2;
                    }
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])in(_+e |\(e\) |E )/g, (match, p1) => {
                    this.log("11108");
                    this.replacementsb++;
                    return p1 + "in ";
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])ine(_+r |\(r\) |R )/g, (match, p1) => {
                    this.log("11109");
                    this.replacementsb++;
                    return p1 + "iner ";
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])iner(_+s |\(S\) |S )/g, (match, p1) => {
                    this.log("11110");
                    this.replacementsb++;
                    return p1 + "ines ";
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])ines(_+r |\(R\) |R )/g, (match, p1) => {
                    this.log("11111");
                    this.replacementsb++;
                    return p1 + "ines ";
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])iner(_+m |\(m\) |M )/g, (match, p1) => {
                    this.log("11112");
                    this.replacementsb++;
                    return p1 + "inem ";
                });
                s = s.replace(/\b([KkDMSdms]?[Ee])inem(_+r |\(r\) |R )/g, (match, p1) => {
                    this.log("11113");
                    this.replacementsb++;
                    return p1 + "inem ";
                });

                //  einer_einem, keiner_keinem
                s = s.replace(/\b([KkDMSdms]?[Ee])ine(m|r)_([KkDMSdms]?[Ee])ine(m |r )/g, (match, p1) => {
                    this.log("11113");
                    this.replacementsb++;
                    return p1 + "inem ";
                });

                s = s.replace(/\b([KkDMSdms]?[Ee])ine(_+n |\(n\) |N )/g, (match, p1) => {
                    this.log("11114");
                    this.replacementsb++;
                    return p1 + "in ";
                });
                s = s.replace(/\bsie_er|er_sie\b/g, () => {
                    this.log("11115");
                    this.replacementsb++;
                    return "er";
                });
                s = s.replace(/\bSie_[Ee]r|Er_[Ss]ie\b/g, () => {
                    this.log("11116");
                    this.replacementsb++;
                    return "Er";
                });
                s = s.replace(/\b(i)(hr_ihm|hm_ihr)\b/ig, (match, p1) => {
                    this.log("11117");
                    this.replacementsb++;
                    return p1 + "hm";
                });
                s = s.replace(/\bsie_ihn|ihn_ie\b/g, () => {
                    this.log("11118");
                    this.replacementsb++;
                    return "ihn";
                });
                s = s.replace(/\bSie_[Ii]hn|Ihn_[Ss]ie\b/g, () => {
                    this.log("11119");
                    this.replacementsb++;
                    return "Ihn";
                });
                s = s.replace(/\bihr_e\b/ig, () => {
                    this.log("11120");
                    this.replacementsb++;
                    return "ihr";
                }); //ihr*e Partner*in
                s = s.replace(/\bihre?[rnms]?_(seine?[rnms]?)|(seine?[rnms]?)_ihre?[rnms]?\b/ig, (match, p1, p2) => {
                    this.replacementsb++;
                    if (p1) {
                        this.log("11121");
                        return p1;
                    } else if (p2) {
                        this.log("11122");
                        return p2;
                    }
                });
                s = s.replace(/\b(z)(um_zur|ur_zum)\b/ig, (match, p1) => {
                    this.log("11123");
                    this.replacementsb++;
                    return p1 + "um";
                });
                s = s.replace(/\b(j)ede[rnms]?_(jede[rnms]?)\b/ig, (match, p1) => {
                    this.log("11124");
                    this.replacementsb++;
                    return p1;
                });
            }

            //extra Stuff
            if (/eR\b|em?_{1,2}e?r\b|em?\(e?r\)\b/.test(s)) {
                this.log("11200");

                s = s.replace(/e_+r|e\(r\)|eR\b/g, () => {
                    this.replacementsb++;
                    return "es";
                }); //jede/r,jede(r),jedeR,
                s = s.replace(/em\(e?r\)|em_+r\b/g, () => {
                    this.replacementsb++;
                    return "em";
                }); //jedem/r
                s = s.replace(/er\(e?s\)|es_+r\b/g, () => {
                    this.replacementsb++;
                    return "es";
                }); //jedes/r
            }
            //man
            if (/\/(frau|man|mensch)/.test(s)) {
                this.log("11300");
                s = s.replace(/\b(frau|man+|mensch)+_(frau|man+|mensch|_)*/, () => {
                    this.replacementsb++;
                    return "man";
                });
            }
        }

        return s;
    }


    private entferneBinnenIs(s: string): string {
        this.log("10000");

        // entferne *x am Ende
        if (/\*x/.test(s)) {
            // behandle "einer/m*x progressive*n*x"
            s = s.replace(/([\w\/*]+)\*x\b\b/ig, (match, p1) => {
                return p1;
            });            
        }

        s = this.artikelUndKontraktionen(s);

        if (/[a-zäöüß\u00AD\u200B]{2}((\/-?|_|\*|:|\.|\u00b7| und -)?In|(\/-?|_|\*|:|\.|\u00b7| und -)in(n[\*|\.]en)?|INNen|\([Ii]n+(en\)|\)en)?|\/inne?)(?!(\w{1,2}\b)|[A-Z]|[cf]o|te[gr]|act|clu|dex|di|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)|[A-ZÄÖÜß\u00AD\u200B]{3}(\/-?|_|\*|:|\.)IN\b/.test(s)) {
            this.log("12000");
            s = s.replace(/[\u00AD\u200B]/g, ""); //entfernt soft hyphens

            //Prüfung auf Ersetzung
            if (/[a-zäöüß](\/-?|_|\*|:|\.|\u00b7| und -)in\b/i.test(s) || /[a-zäöüß](\/-?|_|\*|:|\.|\u00b7| und -)inn(\*|\.|\))?en/i.test(s) || /[a-zäöüß](\(|\/)in/i.test(s) || /[a-zäöüß]INNen/.test(s)) {
                this.log("12100");
                s = s.replace(/(\/-?|_|\*|:|\u00b7|\.)inn(\*|\.|\/)?e(\*|\.|\/)?n/ig, "Innen"); //Schüler/innen
                s = s.replace(/([a-zäöüß])\(inn(en\)|\)en)/ig, "$1Innen"); //Schüler(innen)
                s = s.replace(/([a-zäöüß])INNen/g, "$1Innen"); //SchülerINNen
                s = s.replace(/ und -innen\b/ig, () => {
                    this.log("12101");
                    this.replacementsb++;
                    return "";
                }); //und -innen
                s = s.replace(/(\/-?|_|\*|:|\.)in\b/ig, "In"); //Schüler/in
                s = s.replace(/([a-zäöüß])\(in\)/ig, "$1In"); //Schüler(in)
                this.log(s);
            }

            //Plural
            if (/[a-zäöüß]Innen/i.test(s)) {
                this.log("12200");
                //Prüfung auf Sonderfälle
                if (/(chef|fan|gött|verbesser|äur|äs)innen/i.test(s)) {
                    s = s.replace(/(C|c)hefInnen/g, (match, p1) => {
                        this.log("12201");
                        this.replacementsb++;
                        return p1 + "hefys";
                    });
                    s = s.replace(/(F|f)anInnen/g, (match, p1) => {
                        this.log("12202");
                        this.replacementsb++;
                        return p1 + "ans";
                    });
                    s = s.replace(/([Gg]ött|verbesser)(?=Innen)/g, (match, p1) => {
                        this.log("12203");
                        this.replacementsb++;
                        return p1 + "ys";
                    });
                    s = s.replace(/äue?rInnen/g, () => {
                        this.log("12204");
                        this.replacementsb++;
                        return "auern";
                    });
                    s = s.replace(/äsInnen/g, () => {
                        this.log("12205");
                        this.replacementsb++;
                        return "asys";
                    });
                }
                // statt Leerzeichen kommt [\s]{1,2} zum Einsatz -> Leerzeichen oder Leerzeichen + Markerzeichen für die Kontexterkennung (hacky, aber so what)
                s = s.replace(/\b(([Dd]en|[Aa]us|[Aa]ußer|[Bb]ei|[Dd]ank|[Gg]egenüber|[Ll]aut|[Mm]it(samt)?|[Nn]ach|[Ss]amt|[Vv]on|[Uu]nter|[Zz]u|[Ww]egen|[MmSsDd]?einen)(?: zwei| drei| [0-9]+)?[\s]{1,2}([ID]?[a-zäöüß]+en[\s]{1,2}|[0-9.,]+[\s]{1,2})?[A-ZÄÖÜ][a-zäöüß]+)erInnen\b/g, (match, p1) => {
                    this.log("12206");
                    this.replacementsb++;
                    return p1 + "ys";
                }); //unregelmäßiger Dativ bei Wörtern auf ...erInnen
                s = s.replace(/(er?|ER?)Innen/g, (match, p1) => {
                    this.log("12207");
                    this.replacementsb++;
                    return "ys";
                });

                // Notiz: (?:[A-Z][a-zöüä]+\b[,] |[A-Z][*I_ïa-zöüä]+\b und ) soll Aufzählungen erkennen, die mit Komma oder "und" verkettet sind; bspw. "AutorInnen und FreundInnen", was der Anlass für diese Regel war (als Kopie von Markierung 1)
                s = s.replace(/((?:von[\s]{1,2}|mit[\s]{1,2})(?:[A-Z][a-zöüä]+\b[,][\s]{1,2}|[A-Z][*I_ïa-zöüä]+\b und[\s]{1,2})[a-zA-Zöäüß]*?)([Aa]nwält|[Ää]rzt|e[iu]nd|rät|amt|äst|würf|äus|[ai(eu)]r|irt)Innen/g, (match, p1, p2) => {
                    this.replacementsb++;
                    return p1 + p2 + "ys";
                });

                // Markierung 1
                s = s.replace(/([Aa]nwält|[Ää]rzt|e[iu]nd|rät|amt|äst|würf|äus|[ai(eu)]r|irt)Innen/g, (match, p1) => {
                    this.log("12208");
                    this.replacementsb++;
                    return p1 + "ys";
                });
                s = s.replace(/([nrtsmdfghpbklvwNRTSMDFGHPBKLVW])Innen/g, (match, p1) => {
                    this.log("12209");
                    this.replacementsb++;
                    return p1 + "ys";
                });
            }

            //Singular			
            if (/[a-zäöüß]In/.test(s) && !/([Pp]lug|Log|[Aa]dd|Linked)In\b/.test(s)) {
                this.log("12300");
                //Prüfung auf Sonderfälle
                if (/amtIn|stIn\B|verbesser(?=In)/.test(s)) {
                    s = s.replace(/verbesserIn/g, () => {
                        this.log("12301");
                        this.replacementsb++;
                        return "verbessy";
                    });
                    s = s.replace(/amtIn/g, () => {
                        this.log("12302");
                        this.replacementsb++;
                        return "amty";
                    });
                    s = s.replace(/stIn\B(?!(\w{1,2}\b)|[A-Z]|[cf]o|te[gr]|act|clu|dex|di[ac]|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)/g, () => {
                        this.log("12303");
                        this.replacementsb++;
                        return "sty";
                    }); //JournalistInfrage
                }
                //Prüfung auf Umlaute
                if (/[äöüÄÖÜ][a-z]{0,3}In/.test(s)) {
                    s = s.replace(/ä(?=s(t)?In|tIn|ltIn|rztIn)/g, () => {
                        this.log("12304");
                        this.replacementsb++;
                        return "a";
                    });
                    s = s.replace(/ÄrztIn/g, () => {
                        this.log("12305");
                        this.replacementsb++;
                        return "Arzty";
                    });
                    s = s.replace(/ö(?=ttIn|chIn)/g, () => {
                        this.log("12306");
                        this.replacementsb++;
                        return "o";
                    });
                    s = s.replace(/ü(?=rfIn)/g, () => {
                        this.log("12307");
                        this.replacementsb++;
                        return "u";
                    });
                    s = s.replace(/ündIn/g, () => {
                        this.log("12308");
                        this.replacementsb++;
                        return "und";
                    });
                    s = s.replace(/äue?rIn/g, () => {
                        this.log("12309");
                        this.replacementsb++;
                        return "auer";
                    });
                }
                s = s.replace(/\b(([Dd]en|[Aa]us|[Aa]ußer|[Bb]ei|[Dd]ank|[Gg]egenüber|[Ll]aut|[Mm]it(samt)?|[Nn]ach|[Ss]amt|[Uu]nter|[Vv]on|[Zz]u|[Ww]egen|[MmSsDd]?eine[mnrs]) ([ID]?[a-zäöüß]+en)?[A-ZÄÖÜ][a-zäöüß]+)logIn\b/g, (match, p1) => {
                    this.log("12310");
                    this.replacementsb++;
                    return p1 + "logy";
                }); //unregelmäßiger Dativ bei eine/n Psycholog/in
                s = s.replace(/([skgvwzSKGVWZ]|ert|[Bb]rit|[Kk]und|ach)In(?!(\w{1,2}\b)|[A-Z]|[cf]o|te[gr]|act|clu|dex|di|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)/g, (match, p1) => {
                    this.log("12311");
                    this.replacementsb++;
                    return p1 + "y";
                }); //ExpertIn, BritIn, KundIn, WachIn

                s = s.replace(/(e[nrtmdbplhfcNRTMDBPLHFC])In(?!(\w{1,2}\b)|[A-Z]|[cf]o|te[gr]|act|clu|dex|di|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)/g, (match, p1) => {
                    this.log("12312");
                    this.replacementsb++;
                    return "y";
                });

                s = s.replace(/([nrtmdbplhfcNRTMDBPLHFC])In(?!(\w{1,2}\b)|[A-Z]|[cf]o|te[gr]|act|clu|dex|di|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)/g, (match, p1) => {
                    this.log("12312");
                    this.replacementsb++;
                    return p1;
                });
            }

        }

        return s;
    }

    private pluraly(s: string): string {
        if(s.trim().length == 0){
            return s;
        }
        s = s.replace(/(^[dD]+)(er|as)/, (match, p1) => {
            this.log("11101");
            this.replacementsb++;
            return p1 + "ie";
        });
        s = s.replace(/(ern|ers|er|en|e)$/,"");
        s = s + "ys";
        return s;
    }

    private singulary(s: string): string {
        if(s.trim().length == 0){
            return s;
        }
        s = s.replace(/(^[dD]+)(en|er|ie)/, (match, p1) => {
            this.log("11101");
            this.replacementsb++;
            return p1 + "as";
        });
        s = s.replace(/(en|ern|er)$/,"");
        s = s + "y";
        return s;
    }

    private startsWithCapitalLetter(s: string): boolean {
        return s != null && s.length > 0 && /[A-Z]/.test(s[0]);
    }
    private capitalize(s: string): string {
        if(s == null || s.length < 1) {
            return "";
        }
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    private entferneDoppelformen(s: string): string {
        this.log("20000");
        if (/\b(und|oder|bzw)|[a-zA-ZäöüßÄÖÜ][\/\*&_\(][a-zA-ZäöüßÄÖÜ]/.test(s)) {
            this.log("21000");
            // Hinweis: \b am Anfang ersetzt durch (?=\b|[ÄäÖöÜö]), weil \b die Umlaute nicht matcht, bspw. "Ärztinnen und Ärzte" _am Anfang eines Satzes_ würden nicht ersetzt (in der Mitte aber kein Problem)
            s = s.replace(/(?=\b|[ÄäÖöÜö])((von[\s]{1,2}|für[\s]{1,2}|mit[\s]{1,2})?((d|jed|ein|ihr|zum|sein)(e[rn]?|ie)[\s]{1,2})?([a-zäöüß]{4,20} )?)([a-zäöüß]{2,})innen( und | oder | & | bzw\.? |[\/\*_\(-])\2?((d|jed|ein|ihr|zum|sein)(e[rmns]?|ie)[\s]{1,2})?\6?(\7(e?n?))\b([\f]?)/ig, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14) => {
                    this.replacementsd++;
                // Hinweis: p14 ist das /f-Zeichen, das u.U. verwendet wird, die zu ersetzende Wortgruppe zu umschließen
                if (p1) {
                    this.log("21001");
                    return p1 + this.pluraly(p12) + (p14 ? this.pluraly(p14) : "");
                } else {
                    this.log("21002");
                    return this.pluraly(p12) + (p14 ? p14 : "");
                }
            }); //Bürgerinnen und Bürger
            s = s.replace(/\b(von |für |mit |als )?(((zu )?d|jed|ein|ihr|zur|sein)(e|er|ie) )?(([a-zäöüß]{4,20}[enr]) )?([a-zäöüß]{2,})(en?|in)( und | oder | & | bzw\.? |[\/\*_\(-])(\1|vom )?((((zu )?d|jed|ein|ihr|zum|sein)(e[nrms])? )?(\7[nrms]? )?(\8(e?(s|n|r)?)))\b/ig, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18) => {
                this.replacementsd++;
                if (p1) {
                    if (p6 && !p17) {
                        this.log("21003");
                        return p1 + p13 + p6 + p18;
                    } else {
                        this.log("21004");
                        return p1 + p12;
                    }
                } else if (p6 && !p17) {
                    this.log("21005");
                    return p13 + p6 + this.pluraly(p18);
                } else {
                    this.log("21006");
                    if(this.startsWithCapitalLetter(p2)){
                        return this.capitalize(this.singulary(p12));
                    }
                    return this.singulary(p12);
                }
            }); //die Bürgerin und der Bürger
            s = s.replace(/\b(von |für |mit |als )?(((zu )?d|jed|ein|ihr|sein)(e|er|ie) |zur )?(([a-zäöüß]{4,20}[enr]) )?([a-zäöüß]{4,20})?(ärztin|anwältin|bäue?rin|rätin|fränkin|schwäbin|schwägerin)( und | oder | & | bzw\.? |[\/\*_\(-])(\1|vom )?((((zu )?d|jed|ein|ihr|zum|sein)(e[nrms])? )?(\7[nrms]? )?(\8(e?(s|n|r)?))(arzt|anwalt|bauer|rat|frank|schwab|schwager)(e(n|s)?)?)\b/ig, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12) => {
                this.replacementsd++;
                if (p1) {
                    this.log("21007");
                    return p1 + p12;
                } else {
                    this.log("21008");
                    return this.singulary(p12);
                }
            }); //unregelmäßiger Singular: die Ärztin und der Arzt
            s = s.replace(/\b((von |für |mit |als )?(((zu )?d|jed|ein|ihr|zur|sein)(e|er|ie) )?((zur|[a-zäöüß]{4,20}[enr]) ))?([a-zäöüß]{4,20})?((bäue?r|jüd|fränk|schwäb)innen)( und | oder | & | bzw\.? |[\/\*_\(-])(\1|vom )?((((zu )?d|jed|ein|ihr|zum|sein)(e[nrms])? )?(\7[nrms]? )?(\8(e?(s|n|r)?))(bauer|jude|franke|schwabe)([ns])?)\b/ig, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14) => {
                this.replacementsd++;
                if (p1) {
                    this.log("21009");
                    return this.singulary(p1 + p14);
                } else {
                    this.log("21010");
                    return this.pluraly(p14);
                }
            }); //unregelmäßiger Plural: Bäuerinnen und Bauern
            s = s.replace(/\b((von |für |mit |als )?((d|jed|ein|ihr|zum|sein)(e[rnms]?|ie) )?([a-zäöüß]{4,20}[enr] )?([a-zäöüß]{2,})(e?(n|s|r)?))( und | oder | & | bzw\.? |[\/\*_\(-])(\2|von der )?(((von |zu )?d|jed|ein|ihr|zur|sein)(e[rn]?|ie) )?\6?\7(in(nen)?|en?)\b/ig, (match, p1) => {
                this.log("21011");
                this.replacementsd++;
                return this.pluraly(p1);
            }); //Bürger und Bürgerinnen, Bürger und Bürgerin
            s = s.replace(/\b((von |für |mit |als )?((d|jed|ein|ihr|sein)(e[rnms]?|ie) |zum )?([a-zäöüß]{4,20}[enr] )?([a-zäöüß]{4,20})?(arzt|anwalt|bauer|rat|frank|schwab|schwager)(e?(s)?))( und | oder | & | bzw\.? |[\/\*_\(-])(\2|von der )?(((von |zu )?d|jed|ein|ihr|sein)(e[rn]?|ie) |zur )?\6?\7(ärzt|anwält|bäue?rin|rät|fränk|schwäb|schwäger)(in(nen)?)\b/ig, (match, p1) => {
                this.log("21012");
                this.replacementsd++;
                return this.pluraly(p1);
            }); //unregelmäßiger Singular: der Arzt und die Ärztin
            s = s.replace(/\b((von |für |mit |als )?((d|jed|ein|ihr|zum|sein)(e[rnms]?|ie) )?([a-zäöüß]{4,20}[enr] )?([a-zäöüß]{4,20})?(bauer|jud|frank|schwab)(e?n)?)( und | oder | & | bzw\.? |[\/\*_\(-])(\2|von der )?(((von |zu )?d|jed|ein|ihr|zur|sein)(e[rn]?|ie) )?\6?\7(bäue?r|jüd|fränk|schwäb)(in(nen)?)\b/ig, (match, p1) => {
                this.log("21013");
                this.replacementsd++;
                return p1;
            });//unregelmäßiger Plural: Bauern und Bäuerinnen
            s = s.replace(/\b([A-Z][a-zäöüß]{2,})([a-zäöüß]{2,})innen( und | oder | & | bzw\.? )-(\2(e*n)*)\b/g, (match, p1, p2, p3, p4) => {
                this.log("21014");
                this.replacementsd++;
                return p1 + this.pluraly(p4);
            }); //Bürgervertreterinnen und -vertreter
        }
        return s;
    }

    private entfernePartizip(s: string): string {
        if (/(ier|arbeit|orsch|fahr|verdien|nehm|es)ende|(?<!^)(?<!\. )Interessierte/.test(s)) {
            s = s.replace(/der Studierende\b/g, (match) => {
                this.replacementsp++;
                let suffix = "das Studenty";
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Studierende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Studenty";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Teilnehmende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Teilnehmy";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Dozierende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Dozenty";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Lesende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Lesy";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Assistierende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Assistenty";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Mitarbeitende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Mitarbeity";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Forschende(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix =  "Forschy";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )Interessierte(r|n?)?/g, (match) => {
                this.replacementsp++;
                let suffix = "Interessenty";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )([A-Z]+[a-zäöü]+)fahrende(r|n?)?/g, (match, p1) => {
                this.replacementsp++;
                let suffix = "fahry";
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return p1 + suffix;
            });
            s = s.replace(/(?<!^)(?<!\. )([A-Z]+[a-zäöü]+)verdienende(r|n?)?/g, (match, p1) => {
                this.replacementsp++;

                let suffix = "verdieny"
                if(match.endsWith("n") || match.endsWith("e")){
                    suffix = suffix + "s"
                }
                return p1 + suffix;
            });
        }

        return s;
    }

    private ersetzeGefluechteteDurchFluechtlinge(s: string): string {
        if (/flüch/.test(s)) {
            s = s.replace(/[\u00AD\u200B]/g, ""); //entfernt soft hyphens

            // "Geflüchtete" vor einem Substantiv ignorieren - das ist ein Adjektiv
            if (/\bGeflüchtet(e\b|er\b|en\b)[\s]{1,2}[A-Z]/g.test(s)) {
                return s;
            }

            s = s.replace(/\b[Dd]er Geflüchtete\b/g, (match, praeposition, zahlwort, aufzaehlung, gefluechtete, endung, zufolge) => {
                return "Das Flüchtly";
            });

            // Annahme: Gefluechtete wird fast ausschließlich in der Mehrzahl verwendet, was die Ersetzung einfacher macht
            // (?:[A-Z][a-zöüä]+\b[,] ) -> Behandlung von Aufzählungen der Form "gegenüber Obdachlosen, Geflüchteten und Menschen ohne Papiere"
            s = s.replace(/\b([Aa]us[\s]{1,2}|[Aa]ußer[\s]{1,2}|[Bb]ei[\s]{1,2}|[Zz]u[\s]{1,2}|[Ee]ntgegen[\s]{1,2}|[Ee]ntsprechend[\s]{1,2}|[Gg]emäß[\s]{1,2}|[Gg]etreu[\s]{1,2}|[Gg]egenüber[\s]{1,2}|[Nn]ahe[\s]{1,2}|[Mm]it[\s]{1,2}|[Nn]ach[\s]{1,2}|[Ss]amt[\s]{1,2}|[Mm]itsamt[\s]{1,2}|[Ss]eit[\s]{1,2}|[Vv]on[\s]{1,2})?(den[\s]{1,2})?(den[\s]{1,2}|vielen[\s]{1,2}|mehreren[\s]{1,2})?([A-Z][a-zöüä]+\b[,][\s]{1,2}|[A-Z][a-zöüä]+\b und[\s]{1,2})*([„“‟”’’❝❞❮❯⹂〝〞〟＂‚‘‛❛❜❟«‹»›]?Geflüchtet(e\b|en\b|er\b)[„“‟”’’❝❞❮❯⹂〝〞〟＂‚‘‛❛❜❟«‹»›]?)([\s]{1,2}zufolge)?\b/g, (match, praeposition, den, zahlwort, aufzaehlung, gefluechtete, endung, zufolge) => {
                this.replacementsp++;
                if (!praeposition) praeposition = "";
                if (!zahlwort) zahlwort = "";
                if (!aufzaehlung) aufzaehlung = "";
                if (!zufolge) zufolge = "";
                if (!den) den = "";

                if (praeposition || den) {
                    return  praeposition + den + zahlwort + aufzaehlung + "Flüchtlys" + zufolge;
                } else {
                    return  praeposition + den + zahlwort + aufzaehlung + "Flüchtlys" + zufolge;
                }
            });

            // "geflüchtete xxx" -> "geflohene xxx"
            s = s.replace(/\b(geflüchtet)(e(?:(r|n)?)?[\s]{1,2}(?:Kind|Mensch)[\w]+)\b/g, (match, gefluechtet, rest) => {
                return "geflohen" + rest;
            });

            // "Geflüchtetenxxx" -> "Flüchtlingsxxx"
            s = s.replace(/\b(Geflüchteten)([\w]{3,})\b/g, (match, gefluechteten, rest) => {
                return "Flüchtlys" + rest;
            });
        }
        return s;
    }

    private probeDocument(bodyTextContent: string = document.body.textContent ? document.body.textContent : ""): 
    {
        probeBinnenI: boolean,
        probeRedundancy: boolean,
        probePartizip: boolean
        probeGefluechtete: boolean;

    } {
        let probeBinnenI = false;
        let probeRedundancy = false;
        let probePartizip = false;
        let probeGefluechtete = false;
        if (!this.settings.skip_topic || this.settings.skip_topic && this.mtype || this.settings.skip_topic && !/Binnen-I|Geflüchtete/.test(bodyTextContent)) {
            probeBinnenI = /[a-zäöüß]{2}((\/-?|_|\*|:|\.|\u00b7| und -)?In|(\/-?|_|\*|:|\.|\u00b7| und -)in(n[\*|\.]en)?|INNen|\([Ii]n+(en\)|\)en)?|\/inne?)(?!(\w{1,2}\b)|[A-Z]|[cf]o|t|act|clu|dex|di|line|ner|put|sert|stall|stan|stru|val|vent|v?it|voice)|[A-ZÄÖÜß]{3}(\/-?|_|\*|:|\.)IN\b|(der|die|dessen|ein|sie|ihr|sein|zu[rm]|jede|frau|man|eR\b|em?[\/\*.&_\(])/.test(bodyTextContent);

            if (this.settings.doppelformen) {
                probeRedundancy = /\b(und|oder|bzw)\b/.test(bodyTextContent);
            }
            if (this.settings.partizip) {
                probePartizip = /ierende|Mitarbeitende|Forschende|fahrende|verdienende|Interessierte|Teilnehmende|esende/.test(bodyTextContent);
            }
            if (this.settings.partizip) {
                // immer "flüch" testen, "flücht" schlug wegen soft hyphens schon fehl
                probeGefluechtete = /flüch/.test(bodyTextContent);
            }
        }

        return {
            probeBinnenI: probeBinnenI,
            probeRedundancy: probeRedundancy,
            probePartizip: probePartizip,
            probeGefluechtete : probeGefluechtete
        }
    }

    private isHTMLFormattingNodeName(nodeName?: string): boolean {
        if (!nodeName) {
            return false;
        }

        nodeName = nodeName.toLowerCase();

        return nodeName === "mark" 
        || nodeName === "b" 
        || nodeName === "strong" 
        || nodeName === "i"
        || nodeName === "em"
        || nodeName === "small"
        || nodeName === "del"
        || nodeName === "ins"
        || nodeName === "sub"
        || nodeName === "sup"
        || nodeName === "a";
    }

    // unfortunately this lead to newlines being removed in tweets on Twitter etc.; TODO: once FireFox supports the dotAll operator we should use this in the regexes instead, or modify the regexes to handle newlines as whitespace
    private replaceLineBreak(s: string) {
        return s.replace(/(\n|\r|\r\n)/ig, " ");
    }

    private applyToNodes(nodes: Array<CharacterData>, modifyData: (s: string) => string) {
        var textnodes = nodes;
        for (var i = 0; i < textnodes.length; i++) {
            var node = textnodes[i];
            var oldText = node.data;
            var newText = oldText;

            var parentNodeName = node.parentNode ? node.parentNode.nodeName.toLowerCase() : "";
            // special treatment of HTML nodes that are only there for formatting; those might tear a word out of it's context which is important for correcting
            if (this.isHTMLFormattingNodeName(parentNodeName)) {
                // this word needs to be replaced in context
                var oldTextInContext = (i > 0 ? textnodes[i-1].data : "") + "\f" + oldText + "\f" + (i < textnodes.length - 1 ? textnodes[i+1].data : "");
                //oldTextInContext = this.replaceLineBreak(oldTextInContext);
                oldTextInContext = modifyData.call(this, oldTextInContext);
                var index1 = oldTextInContext.indexOf("\f");
                var index2 = oldTextInContext.indexOf("\f", index1 + 1);
                var index3 = oldTextInContext.indexOf("\f", index2 + 1);
                if (index1 > -1 && index2 > -2 && index3 === -1) // sanity check - RegEx magic might remove our marker; fall back to old behavior in this case
                {
                    newText = oldTextInContext.substring(index1 + 1, index2);
                } else {
                    //oldText = this.replaceLineBreak(oldText);
                    newText = modifyData.call(this, oldText);
                }
            } else {
                //oldText = this.replaceLineBreak(oldText);
                newText = modifyData.call(this, oldText);
            }

            if (node.data !== newText) {
                node.data = newText;
            }
        }
    }

    public entferneInitial() {
        const probeResult = this.probeDocument()

        if (probeResult.probeBinnenI || this.settings.doppelformen && probeResult.probeRedundancy || this.settings.partizip && probeResult.probePartizip) {
            this.nodes = this.textNodesUnder(document)
            if (this.settings.doppelformen && probeResult.probeRedundancy) {
                this.applyToNodes(this.nodes, this.entferneDoppelformen);
            }
            if (this.settings.partizip && probeResult.probePartizip) {
                this.applyToNodes(this.nodes, this.entfernePartizip);
            }
            if (probeResult.probeBinnenI) {
                this.applyToNodes(this.nodes, this.entferneBinnenIs);
            }
            if (probeResult.probeGefluechtete) {
                this.applyToNodes(this.nodes, this.ersetzeGefluechteteDurchFluechtlinge);
            }

            if (this.settings.counter) {
                this.sendCounttoBackgroundScript();
            }
        }
    }

    public entferneInitialForTesting(s: string): string {
        const probeResult = this.probeDocument(s)

        if (probeResult.probeBinnenI || this.settings.doppelformen && probeResult.probeRedundancy || this.settings.partizip && probeResult.probePartizip || this.settings.partizip && probeResult.probeGefluechtete) {
            if (this.settings.doppelformen && probeResult.probeRedundancy) {
                s = this.entferneDoppelformen(s);
            }
            if (this.settings.partizip && probeResult.probePartizip) {
                s = this.entfernePartizip(s);
            }
            if (probeResult.probeBinnenI) {
                s = this.entferneBinnenIs(s);
            }
            if (probeResult.probeGefluechtete) {
                s = this.ersetzeGefluechteteDurchFluechtlinge(s);
            }

            if (this.settings.counter) {
                this.sendCounttoBackgroundScript();
            }
        }
        return s;
    }    

    private entferneInserted(nodes: Array<CharacterData>) {
        if (!this.settings.skip_topic || this.settings.skip_topic && this.mtype || this.settings.skip_topic && !/Binnen-I/.test(document.body.textContent ? document.body.textContent : "")) {
                if (this.settings.doppelformen) {
                    this.applyToNodes(nodes, this.entferneDoppelformen);
                }
                if (this.settings.partizip) {
                    this.applyToNodes(nodes, this.entfernePartizip);
                }
                this.applyToNodes(nodes, this.entferneBinnenIs);
                if (this.settings.counter) {
                    this.sendCounttoBackgroundScript();
                }
        }
    }

    public notifyBackgroundScript() {
        chrome.runtime.sendMessage({
            action: 'needOptions'
        }, (res: { type?: string, response: string }) => {
            this.handleResponse(res);
        });
    }
    
    private sendCounttoBackgroundScript() {
        chrome.runtime.sendMessage({
            countBinnenIreplacements: this.replacementsb,
            countDoppelformreplacements: this.replacementsd,
            countPartizipreplacements: this.replacementsp,
            type: "count"
        });
    }    
}

if (typeof document != "undefined" && document.body.textContent) {
    const beGone = new BeGone();
    //Einstellungen laden
    beGone.notifyBackgroundScript();
    chrome.runtime.onMessage.addListener((message: { type?: string, response: string }) => {
        beGone.handleResponse(message);
    });
}