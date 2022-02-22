export const config = {
    get gatewayUrl() {
        let url = "//bin.chelun.com/do";
        if (process.env.NODE_ENV !== "production") {
            url = "//10.10.33.70:9003/do";
        }
        return url;
    }
};
