import {EngenderSystem} from "../control/control-api";
import {DeESystem} from "./de-e-system";
import {Phettberg} from "./phettberg";

interface SchreibAlternativeCounter {
    replacementsBinnen: number;
    replacementsDoppel: number;
    replacementsPartizip: number;
}

interface SchreibAlternativeMethods {
    artikelUndKontraktionen: (s: string) => string;
    entferneBinnenIs: (s: string) => string;
    entferneDoppelformen: (s: string) => string;
    entfernePartizip: (s: string) => string;
    ersetzeGefluechteteDurchFluechtlinge: (s: string) => (string);
}

export interface SchreibAlternative extends SchreibAlternativeCounter, SchreibAlternativeMethods {

}

interface SchreibAlternativeConstructor {
    new(): SchreibAlternative;
}

export const SchreibAlternativeConstructors: { [key in EngenderSystem]: SchreibAlternativeConstructor } = {
    deesystem: DeESystem,
    phettberg: Phettberg,
};