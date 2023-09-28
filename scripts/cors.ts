import { DuploConfig, DuploInstance } from "@duplojs/duplojs";

export interface DuploCorsOptions {
    allowOrigin?: string | string[] | null,
    allowHeaders?: string | string[],
    exposeHeaders?: string | string[],
    maxAge?: number
}

export function duploCors(
    instance: DuploInstance<DuploConfig>, 
    {
        allowOrigin = null,
        allowHeaders,
        exposeHeaders,
        maxAge,
    }: DuploCorsOptions
){
    if(allowOrigin === null)allowOrigin = "null";
    else if(Array.isArray(allowOrigin))allowOrigin = allowOrigin.join(", ");

    if(Array.isArray(allowHeaders))allowHeaders = allowHeaders.join(", ");

    if(Array.isArray(exposeHeaders))exposeHeaders = exposeHeaders.join(", ");

    instance.addHook(
        "onConstructResponse", 
        response => {
            response.setHeader("Access-Control-Allow-Origin", allowOrigin as string);
            response.setHeader("Access-Control-Allow-Headers", allowHeaders as string);
            response.setHeader("Access-Control-Expose-Headers", exposeHeaders as string);
            response.setHeader("Access-Control-Max-Age", maxAge?.toString() as string);
        }
    );
}