export type ReplacementConfig = string;
export type KeyToReplacementConfig = { [key: string]: ReplacementConfig };
export type GenericOneLevelConfig = { [group: string]: KeyToReplacementConfig };
export type GenericTwoLevelConfig = { [cls: string]: GenericOneLevelConfig };
export type TwoLevelConfig = {
    artikelUndKontraktionen: {
        "den,die,dessen..": {
            "dendie": ReplacementConfig
        },
        "other": {
            "bla": ReplacementConfig
        }
    },
    "something": {
        "foo": {
            "dendie": ReplacementConfig
        },
    }
};
export type NeutralStyleConfig = TwoLevelConfig;

type PartialRecurse<T> = {
    [P in keyof T]?: PartialRecurse<T[P]>;
};

/**
 * Wenn viele verschiedene Systeme implementiert werden, könnte es schwer werden code zu ändern.
 * Eine partielle Konfiguration (mit fallback) könnte helfen die configurationsarbeit zu verschieben
 */
export type PartialStyleConfig = PartialRecurse<NeutralStyleConfig>