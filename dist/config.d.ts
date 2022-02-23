export interface GatewayConfig {
    [key: string]: boolean | string | undefined;
    debug?: boolean;
    entry?: string;
    compress?: boolean;
    cacheKey?: string;
}
export declare const config: GatewayConfig;
export declare function gatewayConfig(option: GatewayConfig): void;
