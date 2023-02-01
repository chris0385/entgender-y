//type MapElementType<G, OBJ, K extends keyof OBJ> = G extends (infer T) ? O
//type item1 = ;
import {Factory} from "./config-factory";
import {Phettberg} from "./phettberg.config.example";
import {PartialStyleConfig} from "./config-def";

let factory = new Factory(Phettberg);

factory.replacement("artikelUndKontraktionen", "den,die,dessen..", "dendie", ",", "");
factory.replacement("artikelUndKontraktionen", "other", "bla", ",", "");
// factory.replacement("artikelUndKontraktionen", "other", "dendie", ",", ""); // doesn't compile

let clazz = factory.class("artikelUndKontraktionen");
clazz.replacement("den,die,dessen..", "dendie", ",", "")
clazz.replacement("den,die,dessen..", "dendie", ",", "")
clazz.group("den,die,dessen..").replacement("dendie", ",", "")

export const IncompleteConfig: PartialStyleConfig = {
    /* something: {
         foo: {dendie: "undefined"}
     },*/
    artikelUndKontraktionen: {
        "den,die,dessen..": {
            //dendie: "\$1as"
        }
        /*
        other: {
            bla: ""
        }
         */
    }
}