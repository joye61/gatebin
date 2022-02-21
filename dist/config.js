export const config = {
    get gatewayUrl() {
        let url = "//bin.chelun.com/do";
        if (process.env.NODE_ENV !== "production") {
            url = "//127.0.0.1:5000/do";
        }
        return url;
    },
    encryption: process.env.NODE_ENV === "production",
    encryptKey: "7-Gd.*u(y@Y&$*&#"
};
