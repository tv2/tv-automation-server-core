/** @deprecated This is temporary and should be removed ASAP. Can we do it better? */
export declare const TMP_TSR_VERSION: string;
export declare enum iterateDeeplyEnum {
    CONTINUE = "$continue"
}
/**
 * Iterates deeply through object or array
 * @param obj the object or array to iterate through
 * @param iteratee function to apply on every attribute
 */
export declare function iterateDeeply(obj: any, iteratee: (val: any, key?: string | number) => any | iterateDeeplyEnum, key?: string | number): any;
/**
 * Iterates deeply through object or array, using an asynchronous iteratee
 * @param obj the object or array to iterate through
 * @param iteratee function to apply on every attribute
 */
export declare function iterateDeeplyAsync(obj: any, iteratee: (val: any, key?: string | number) => Promise<any | iterateDeeplyEnum>, key?: string | number): Promise<any>;
