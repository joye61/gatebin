import isPlainObject from "lodash/isPlainObject";
export const config = {
    url: "//bin.chelun.com/do",
};
if (process.env.NODE_ENV !== "production") {
    config.url = "//10.10.33.70:9003/do";
}
export function updateConfig(option) {
    if (isPlainObject(option)) {
        for (let key in option) {
            if (config.hasOwnProperty(key)) {
                config[key] = option[key];
            }
        }
    }
}
