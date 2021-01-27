"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iterateDeeplyAsync = exports.iterateDeeply = exports.iterateDeeplyEnum = exports.TMP_TSR_VERSION = void 0;
const _ = require("underscore");
// tslint:disable-next-line:no-submodule-imports
const tsrPkgInfo = require("timeline-state-resolver-types/package.json");
/** @deprecated This is temporary and should be removed ASAP. Can we do it better? */
exports.TMP_TSR_VERSION = tsrPkgInfo.version;
var iterateDeeplyEnum;
(function (iterateDeeplyEnum) {
    iterateDeeplyEnum["CONTINUE"] = "$continue";
})(iterateDeeplyEnum = exports.iterateDeeplyEnum || (exports.iterateDeeplyEnum = {}));
/**
 * Iterates deeply through object or array
 * @param obj the object or array to iterate through
 * @param iteratee function to apply on every attribute
 */
function iterateDeeply(
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
obj, iteratee, key) {
    const newValue = iteratee(obj, key);
    if (newValue === iterateDeeplyEnum.CONTINUE) {
        // Continue iterate deeper if possible
        if (_.isObject(obj)) {
            // object or array
            _.each(obj, (v, k) => {
                obj[k] = iterateDeeply(v, iteratee, k);
            });
        }
        else {
            // don't change anything
        }
        return obj;
    }
    else {
        return newValue;
    }
}
exports.iterateDeeply = iterateDeeply;
/**
 * Iterates deeply through object or array, using an asynchronous iteratee
 * @param obj the object or array to iterate through
 * @param iteratee function to apply on every attribute
 */
async function iterateDeeplyAsync(
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
obj, iteratee, key) {
    const newValue = await iteratee(obj, key);
    if (newValue === iterateDeeplyEnum.CONTINUE) {
        // Continue iterate deeper if possible
        if (_.isObject(obj)) {
            // object or array
            await Promise.all(_.map(obj, async (v, k) => {
                obj[k] = await iterateDeeplyAsync(v, iteratee, k);
            }));
        }
        else {
            // don't change anything
        }
        return obj;
    }
    else {
        return newValue;
    }
}
exports.iterateDeeplyAsync = iterateDeeplyAsync;
//# sourceMappingURL=util.js.map