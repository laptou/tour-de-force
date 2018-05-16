export namespace Text {
    export const Font = {
        Normal: "Clear Sans"
    };

    export const Header = {
        fontFamily: Font.Normal,
        fontStyle: "bold",
        fontSize: 24,
        fill: "black"
    };

    export const Normal = {
        Light: {
            fontFamily: Font.Normal,
            fontSize: 16,
            fill: "black"
        },
        Dark: {
            fontFamily: Font.Normal,
            fontSize: 16,
            fill: "white"
        }
    };

    export const Small = {
        Light: {
            fontFamily: Font.Normal,
            fontSize: 13,
            fill: "black"
        },
        Dark: {
            fontFamily: Font.Normal,
            fontSize: 13,
            fill: "white"
        }
    };
}