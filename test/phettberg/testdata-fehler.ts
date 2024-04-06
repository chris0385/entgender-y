
import {replacementTestStrings} from "./testdata";

type TestDataType = typeof replacementTestStrings;
export function insertDataOfFailingTestsInto(replacementTestStrings: TestDataType) {
// Binnen
    replacementTestStrings.push(
        [
            "Schüler[in]",
            "Schüly"
        ],
        [
            "LEHRER*INNEN",
            "LEHRERYS"
        ],
        [
            "Lehrer{innen}",
            "Lehrys"
        ],
        [
            "Schülerïn",
            "Schüly"
        ],
        [
            "Lehrerïnnen",
            "Lehrys"
        ],
        [
            "KeinE",
            "Kein"
        ],
        [
            "keineN",
            "keinen"
        ],
        [
            "Lebensmitteltechnologin/en",
            "Lebensmitteltechnologen"
        ],
        [
            "Bürgermeister*Bürgermeisterin",
            "Bürgermeisty"
        ],
        [
            "Bauern_Bäuerinnen",
            "Bauy" // ???
        ],
        [
            "jed:r Student:In",
            "jedes Studenty"
        ],
        [
            "als Studierender oder Studierende",
            "als Studenty"
        ],
        [
            "SchwäbInnen",
            "Schwabys"
        ],
        [
            "GöttInnen",
            "Göttys"
        ],
        [
            "Bäur:innen",
            "Bauys"
        ],
        [
            "ChefIn",
            "Chefy"
        ],
        [
            "SCHÜLER*IN",
            "SCHÜLY"
        ],
        ["die WählerINnen", "die Wählys"],
        ["die WÄHLER*INNEN", "die WÄHLYS"],
        [
            "Leser’innen", "Lesys"
        ],
        [
            'soft hyphens Schüler­Innen auf dem Bürger­steig',
            'soft hyphens Schülys auf dem Bürger­steig'
        ],
        [
            'Wehrbeauftragte*n“',
            'Wehrbeauftragtys“'
        ],
        [
            'jede(r),jedeR',
            'jedes,jedes'
        ],
        [
            "meine*r PsychologIn",
            "meinem Psychology"
        ],
        [
            "jede_jeder",
            "jedes" // aktuell jeder
        ],
        [
            "Alle Bürger und -innen",
            "Alle Bürgys" // aktuell Bürger
        ],
        [
            "ihn:sie",
            "ihn"
        ],
        [
            "BäuerIn",
            "Bauy" // aktuell Bauer
        ],
    ); // end Binnen

// Doppel
    replacementTestStrings.push(
        [
            "Bürgermeister oder Bürgermeisterin",
            "Bürgermeisty"
        ],
        [
            "der oder die Studierende",
            "das Studenty"
        ],
        [
            "Derjenige/Diejenige",
            "Dasjenige"
        ],
        [
            "Ihr oder sein",
            "Sein"
        ],
        [
            "Seine oder ihre",
            "Seine"
        ],
        [
            "ihre oder seine",
            "seine"
        ],
        [
            "sein oder ihr",
            "sein"
        ],
        [
            "Beamte u. Beamtinnen",
            "Beamtys"
        ],
        [
            "Bürgermeisterinnen o. Bürgermeister",
            "Bürgermeistys"
        ],
        [
            "gemeinsam mit einer Trägerin oder einem Träger",
            "gemeinsam mit einem Trägy" // Falsch "gemeinsam das Trägy"
        ],
    ); // End doppel

// Unnötig gegendert
    replacementTestStrings.push(
        [
            "Gästin",
            "Gast"
        ],
        [
            "Menschin",
            "Mensch"
        ],
        [
            "Menschinnen",
            "Menschen"
        ],
        [
            "Männin",
            "Mann"
        ],
        [
            "Männinnen",
            "Männer"
        ],
    );


// Nicht ändern
    replacementTestStrings.push(
        [
            "DropIn-replacement",
            "DropIn-replacement"
        ],
        [
            'https://blabla.net/in-der-praxis-anwenden',
            'https://blabla.net/in-der-praxis-anwenden'
        ]
    );
    /* TODO: was soll es sein?
        [
            "als Schreibende/r",
            "als Schreibendy"
        ],
     */
}