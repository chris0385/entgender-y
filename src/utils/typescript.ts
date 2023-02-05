export {}

type ValueOf<T> = T[keyof T];
declare global {
    interface ObjectConstructor {
        /**
         * I don't know why it's not defined that way by typescript.
         */
        keys(o: object): (keyof typeof o)[];

        entries(o: object): [keyof typeof o, ValueOf<typeof o>][];
    }
}