export interface GatewayConfig {
    [key: string]: boolean | string | undefined;
    debug?: boolean;
    entry?: string;
    cacheKey?: string;
}
export declare const config: GatewayConfig;
export declare function GatewayConfig(option: GatewayConfig): void;
