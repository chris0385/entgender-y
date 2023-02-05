import {isNodeJs} from "./logUtil";

const code_coverage_usedReplacements = new Map<string, [boolean, Replacement]>();


export class Replacement {
    readonly regex: string;
    readonly modifier: string;
    readonly replacement: string;
    readonly description: string | undefined;
    //readonly last: boolean = false;

    constructor(regex: string, modifier: string, replacement: string, description: string | undefined) {
        this.regex = regex;
        this.modifier = modifier;
        this.replacement = replacement;
        this.description = description;

        isNodeJs?.run(() => {
            if (!code_coverage_usedReplacements.get(this.id)) {
                code_coverage_usedReplacements.set(this.id, [false, this]);
            }
        });
    }

    private get id(): string {
        return `${this.regex}, ${this.modifier} -> ${this.replacement}`
    }

    public toString(): string {
        const ret = `Regex: ${this.regex} Replacement: ${this.replacement} Description: ${this.description}`;
        return ret;
    }

    private log(inputString: string, outputString: string) {
        console.log(`R /${this.regex}/ -> "${this.replacement}"`, inputString, "->", outputString);
    }

    public replace(inputString: string, incrementCounter: () => void){
        let outputString = inputString;
        let reg = RegExp(this.regex, this.modifier);
        if (reg.test(outputString)) {
            outputString = outputString.replace(reg, this.replacement);
            isNodeJs?.run(() => {
                this.log(inputString, outputString);
                let wasUsed = code_coverage_usedReplacements.get(this.id)?.[0];
                if (wasUsed === false) {
                    console.log("First use of", this.toString(), "on:", inputString);
                }
                code_coverage_usedReplacements.set(this.id, [true, this]);
            })
            incrementCounter();
        }
        return outputString;
    }

    public test(inputString: string): boolean {
        let reg = RegExp(this.regex, this.modifier);
        isNodeJs?.run(() => {
            this.log("#match", inputString);
            let wasUsed = code_coverage_usedReplacements.get(this.id)?.[0];
            if (wasUsed === false) {
                console.log("Match use of", this.toString(), "on:", inputString);
            }
            code_coverage_usedReplacements.set(this.id, [true, this]);
        })
        return reg.test(inputString);
    }


    public regexp(): RegExp {
        return new RegExp(this.regex, this.modifier);
    }
}

export const _devGetUsedReplacements = () => code_coverage_usedReplacements