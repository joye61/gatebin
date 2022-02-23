import isPlainObject from "lodash/isPlainObject";
export const config = {
    debug: false,
    entry: "",
    cacheKey: "__bin_gateway",
};
export function gatewayConfig(option) {
    if (isPlainObject(option)) {
        for (let key in option) {
            if (config.hasOwnProperty(key)) {
                config[key] = option[key];
            }
        }
    }
}
