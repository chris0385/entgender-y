import {Request, Response, Settings} from "./control-api";
import MessageSender = chrome.runtime.MessageSender;

let settings: Partial<Settings> = {};

// console.warn("Starting background", chrome.runtime.getManifest());

function updateSetting(setting: Partial<Settings>) {
    chrome.storage.sync.set(setting);
}

const DefaultSettings: Required<Settings> = {
    aktiv: true,
    counter: true,
    entgender_alternative: "phettberg",
    invertiert: false,
    doppelformen: true,
    partizip: false,
    skip_topic: false,
    filterliste: "Blacklist",
    whitelist: ".gv.at\n.ac.at\nderstandard.at\ndiestandard.at\nhttps://ze.tt/",
    blacklist: "stackoverflow.com\ngithub.com\nhttps://developer\nhttps://de.wikipedia.org/wiki/Gendersternchen",
    hervorheben: false,
    hervorheben_style: "text-decoration: underline wavy blue;",
};


function updateSettings() {
    chrome.storage.sync.get(function(res: Settings) {
        function isAnyUndefined(...arg: any[]): boolean {
            for (let s of arg) {
                if (s === undefined || s === 'undefined') return true;
            }
            return false;
        }
        //Standardwerte bei der Initialisierung
        if (isAnyUndefined(...Object.keys(DefaultSettings).map(key => res[key]))) {

            for (let key of Object.keys(DefaultSettings)) {
                let current = res[key];
                if (current === undefined || current == "undefined") {
                    updateSetting({
                        [key]: DefaultSettings[key]
                    });
                }
            }

            chrome.storage.sync.get(function(resagain:Settings) {
                settings = resagain;
            });
        } else {
            for (let key of Object.keys(DefaultSettings)) {
                let previousValue = settings[key];
                let newValue = res[key];
                if (previousValue != newValue) {
                    onConfigChanged(key, previousValue, newValue);
                    console.log("Changed config", key, "from", previousValue, "to", newValue);
                }
            }
            settings = res;
        }
        updateIcon();
    });
}

function onConfigChanged<K extends keyof Settings>(key: K, from: Settings[K], to: Settings[K]) {
    switch (key) {
        case "entgender_alternative":
            chrome.tabs.query({
            }, function(tabs) {
                sendMessageToTabs(tabs, {
                    response: JSON.stringify(settings),
                    type: "entgender_alternative"
                });
            });
            break;
    }
}

function handleMessage(request: Request, sender: MessageSender, sendResponse: (response?: any) => void) {
    if (request.action == "needOptions") {
        sendResponse({
            response: JSON.stringify(settings)
        });
    } else if (sender.tab && request.type == "count" && request.countBinnenIreplacements + request.countDoppelformreplacements + request.countPartizipreplacements > 0) {
        const displayednumber = request.countBinnenIreplacements + request.countDoppelformreplacements + request.countPartizipreplacements;
        chrome.browserAction.setBadgeText({
            text: "" + displayednumber + "",
            tabId: sender.tab.id
        });
        /* Folgende Anzeige bereitet Probleme im Overflow-Menü von Firefox*/
        if (!settings.doppelformen && !settings.partizip) {
            chrome.browserAction.setTitle({
                title: "Filterung aktiv\n\nGefilterte Elemente auf dieser Seite\nBinnen-Is: " + request.countBinnenIreplacements,
                tabId: sender.tab.id
            });
        } else if (settings.doppelformen && !settings.partizip) {
            chrome.browserAction.setTitle({
                title: "Filterung aktiv\n\nGefilterte Elemente auf dieser Seite\nBinnen-Is: " + request.countBinnenIreplacements + "\nDoppelformen: " + request.countDoppelformreplacements,
                tabId: sender.tab.id
            });
        } else if (!settings.doppelformen && settings.partizip) {
            chrome.browserAction.setTitle({
                title: "Filterung aktiv\n\nGefilterte Elemente auf dieser Seite\nBinnen-Is: " + request.countBinnenIreplacements + "\nPartizipformen: " + request.countPartizipreplacements,
                tabId: sender.tab.id
            });
        } else if (settings.doppelformen && settings.partizip) {
            chrome.browserAction.setTitle({
                title: "Filterung aktiv\n\nGefilterte Elemente auf dieser Seite\nBinnen-Is: " + request.countBinnenIreplacements + "\nDoppelformen: " + request.countDoppelformreplacements + "\nPartizipformen: " + request.countPartizipreplacements,
                tabId: sender.tab.id
            });
        }
    }
}

function sendMessage(tabId: number, message: Response) {
    chrome.tabs.sendMessage(tabId, message);
}

function sendMessageToTabs(tabs:chrome.tabs.Tab[], message: Response) {
    for (let tab of tabs) {
        if (tab.id == null) {
            continue;
        }
        sendMessage(tab.id,message );
    }
}

function updateIcon() {
    chrome.storage.sync.get(function(res:Settings) {
        if (res.filterliste == "Bei Bedarf") {
            chrome.browserAction.setTitle({
                title: 'Klick entgendert Binnen-Is auf dieser Seite'
            });
            if (res.invertiert !== true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOff.png'
                });
            } else if (res.invertiert === true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOffi.png'
                });
            }
        } else if (res.aktiv === true) {
            chrome.browserAction.setTitle({
                title: 'Filterung aktiv'
            });
            if (res.invertiert !== true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOn.png'
                });
            } else if (res.invertiert === true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOni.png'
                });
            }
        } else {
            chrome.browserAction.setTitle({
                title: 'Entgenderung deaktiviert'
            });
            if (res.invertiert !== true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOff.png'
                });
            } else if (res.invertiert === true) {
                chrome.browserAction.setIcon({
                    path: 'images/iconOffi.png'
                });
            }
        }
    });
}

function ButtonClickHandler() {
    chrome.storage.sync.get(function(res:Settings) {
        if (res.filterliste == "Bei Bedarf") {
            chrome.tabs.query({
                currentWindow: true,
                active: true
            }, function(tabs) {
                sendMessageToTabs(tabs, {
                    response: JSON.stringify(settings),
                    type: "ondemand"
                });

                if (res.invertiert !== true) {
                    chrome.browserAction.setIcon({
                        path: 'images/iconOn.png',
                        tabId: tabs[0].id
                    });
                } else if (res.invertiert === true) {
                    chrome.browserAction.setIcon({
                        path: 'images/iconOni.png',
                        tabId: tabs[0].id
                    });
                }
            });
        } else if (res.aktiv === true) {
            updateSetting({
                aktiv: false
            });
        } else {
            updateSetting({
                aktiv: true
            });
            settings.aktiv = true;
            chrome.tabs.query({
                currentWindow: true,
                active: true
            }, function(tabs) {
                sendMessageToTabs(tabs, {
                    response: JSON.stringify(settings),
                    type: "ondemand"
                });
            });
        }
    });
}

updateSettings();

chrome.commands.onCommand.addListener((command) => {
    console.log("Received command", command);
});

//Kommunikation mit Content-Script
chrome.runtime.onMessage.addListener(handleMessage);

//Ein/aus bei Toolbar Klick
chrome.browserAction.onClicked.addListener(ButtonClickHandler);

//Icon aktualisieren bei Änderungen in Optionen
chrome.storage.onChanged.addListener(updateSettings);