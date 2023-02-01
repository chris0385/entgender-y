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