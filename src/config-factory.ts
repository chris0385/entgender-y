import {
    GenericOneLevelConfig,
    KeyToReplacementConfig,
    NeutralStyleConfig,
    ReplacementConfig,
    TwoLevelConfig
} from "./config-def";
import {Replacement} from "./replacement";

class SubCls<T extends GenericOneLevelConfig> {
    private config: T;

    constructor(config: T) {
        this.config = config;
    }

    replacement<G extends keyof T, E extends keyof T[G]>(
        group: G, entry: E,
        regex: string, modifier: string, description: string | undefined = undefined): Replacement {
        let replacement: ReplacementConfig = this.config[group][entry];
        return new Replacement(regex, modifier, replacement, description);
    }

    group<K extends keyof T>(clas: K): SubGroup<T[K]> {
        return new SubGroup<T[K]>(this.config[clas]);
    }
}

class SubGroup<T extends KeyToReplacementConfig> {
    private config: T;

    constructor(config: T) {
        this.config = config;
    }

    replacement<E extends keyof T>(
        entry: E,
        regex: string, modifier: string, description: string | undefined = undefined): Replacement {
        let replacement: ReplacementConfig = this.config[entry];
        return new Replacement(regex, modifier, replacement, description);
    }

}

type ValueOf<T> = T[keyof T];
export class Factory {
    private config: TwoLevelConfig;

    constructor(config: NeutralStyleConfig) {
        this.config = config;
    }

    replacement<K extends keyof TwoLevelConfig, G extends (keyof TwoLevelConfig[K] & string), E extends (keyof TwoLevelConfig[K][G] & string)>(
        clas: K, group: G, entry: E,
        regex: string, modifier: string, description: string | undefined = undefined): Replacement {
        // TODO: type inference weird, needs level by level
        let onelevel: GenericOneLevelConfig = this.config[clas];
        let twoLevel: KeyToReplacementConfig = onelevel[group];
        let replacement: ReplacementConfig = twoLevel[entry];
        return new Replacement(regex, modifier, replacement, description);
    }

    class<K extends keyof TwoLevelConfig>(clas: K): SubCls<TwoLevelConfig[K]> {
        return new SubCls<TwoLevelConfig[K]>(this.config[clas]);
    }
}