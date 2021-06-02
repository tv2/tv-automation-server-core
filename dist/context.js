"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserNotesContext = exports.isCommonContext = void 0;
function isCommonContext(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const { getHashId, unhashId, logDebug, logInfo, logWarning, logError } = obj;
    return (typeof getHashId === 'function' &&
        typeof unhashId === 'function' &&
        typeof logDebug === 'function' &&
        typeof logInfo === 'function' &&
        typeof logWarning === 'function' &&
        typeof logError === 'function');
}
exports.isCommonContext = isCommonContext;
function isUserNotesContext(obj) {
    if (!isCommonContext(obj)) {
        return false;
    }
    const { notifyUserError, notifyUserWarning } = obj;
    return typeof notifyUserError === 'function' && typeof notifyUserWarning === 'function';
}
exports.isUserNotesContext = isUserNotesContext;
//# sourceMappingURL=context.js.map