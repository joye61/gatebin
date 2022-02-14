export const config = {
    get gatewayUrl() {
        let url = "//bin.chelun.com/do";
        if (process.env.NODE_ENV !== "production") {
            url = "//10.10.29.70:5000";
        }
        return url;
    },
};
