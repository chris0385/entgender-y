

export const EngenderSystemLabels = {
    deesystem: "De-e-System",
    phettberg: "Phettberg Schreibweise",
}

/*export const EngenderSystemDescriptions = {
    phettberg: "<a href=\"https://blog.lplusl.de/nebenbei/gendern-nach-phettberg/\">Phettberg Schreibweise</a>",
    deesystem: "<a href=\"https://geschlechtsneutral.net/inklusivum/\">De-e-System</a>",
}*/

export type EngenderSystem = keyof typeof EngenderSystemLabels;
export type FilterType = "Bei Bedarf" | "Whitelist" | "Blacklist";
export interface BeGoneSettings {
    aktiv?: boolean;
    doppelformen?: boolean;
    // skip_topic: Filterung auf Seiten zum Thema "Binnen-I" aussetzen
    skip_topic?: boolean;
    partizip?: boolean;
    whitelist?: string;
    blacklist?: string;
    counter?: boolean;
    hervorheben?: boolean;
    hervorheben_style?: string;
    filterliste?: FilterType | undefined;
    entgender_alternative?: EngenderSystem;
}

export interface Settings extends BeGoneSettings {
    // Wird nur in options benutzt (ist für Icons)
    invertiert: boolean,
}

export interface CountRequest  {
    type: "count";
    countBinnenIreplacements: number;
    countDoppelformreplacements: number;
    countPartizipreplacements: number;
}

export interface NeedOptionsRequest {
    action: "needOptions";
}

// TODO: sent by gendersprachekorrigieerne, but not processed in backend
export interface ErrorRequest {
    action: "error";
    page: string,
    source: string,
    error: any,
}

export type Request = CountRequest & NeedOptionsRequest

export type ResponseType = "ondemand" | "entgender_alternative"
export interface Response  {
    type?: ResponseType,
    response: string
}