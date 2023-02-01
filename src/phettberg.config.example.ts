
type ReplacementConfig = string;
type NeutralStyleConfig = {
    artikelUndKontraktionen: {
        "dendiedessen..":{
            "dendie": ReplacementConfig
        }
    }
};

export const Phettberg: NeutralStyleConfig = {
    artikelUndKontraktionen: {
        "dendiedessen..": {
            dendie: "\$1as"
        }
    }
}