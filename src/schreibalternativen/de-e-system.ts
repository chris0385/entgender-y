import {SchreibAlternative} from "./alternative";

export class DeESystem implements SchreibAlternative {

    replacementsBinnen = 0;
    replacementsDoppel = 0;
    replacementsPartizip = 0;
    
    artikelUndKontraktionen = (s: string) => {
        return s;
    }

    entferneBinnenIs = (s: string) => {
        return s;
    }

    entferneDoppelformen = (s: string) => {
        return s;
    }

    entfernePartizip = (s: string) => {
        return s;
    }

    ersetzeGefluechteteDurchFluechtlinge = (s: string) => {
        return s;
    }

}