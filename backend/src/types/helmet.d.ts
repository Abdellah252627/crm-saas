declare module "helmet" {
  import type { RequestHandler } from "express";

  export interface HelmetOptions {
    contentSecurityPolicy?: boolean | Record<string, unknown>;
    crossOriginEmbedderPolicy?: boolean | Record<string, unknown>;
    crossOriginOpenerPolicy?: boolean | Record<string, unknown>;
    crossOriginResourcePolicy?: boolean | Record<string, unknown>;
    dnsPrefetchControl?: boolean | Record<string, unknown>;
    frameguard?: boolean | Record<string, unknown>;
    hidePoweredBy?: boolean;
    hsts?: boolean | Record<string, unknown>;
    ieNoOpen?: boolean;
    noSniff?: boolean;
    originAgentCluster?: boolean;
    permittedCrossDomainPolicies?: boolean | Record<string, unknown>;
    referrerPolicy?: boolean | Record<string, unknown>;
    xssFilter?: boolean;
    [key: string]: unknown;
  }

  function helmet(options?: HelmetOptions): RequestHandler;

  export default helmet;
}
