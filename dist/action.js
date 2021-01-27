"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionExecuteAfterChanged = void 0;
var ActionExecuteAfterChanged;
(function (ActionExecuteAfterChanged) {
    /** Do not execute the action after userData has changed, unless specifically triggered by the user */
    ActionExecuteAfterChanged["none"] = "none";
    /** Execute the action immediately after userData has changed */
    ActionExecuteAfterChanged["immediately"] = "immediately";
    /** Execute the action after userData has changed and there was an identifiable period of calm in the changes */
    ActionExecuteAfterChanged["debounce"] = "debounce";
})(ActionExecuteAfterChanged = exports.ActionExecuteAfterChanged || (exports.ActionExecuteAfterChanged = {}));
//# sourceMappingURL=action.js.map