"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookaheadMode = void 0;
var LookaheadMode;
(function (LookaheadMode) {
    LookaheadMode[LookaheadMode["NONE"] = 0] = "NONE";
    LookaheadMode[LookaheadMode["PRELOAD"] = 1] = "PRELOAD";
    // RETAIN = 2, // Removed due to complexity and it being possible to emulate with WHEN_CLEAR and infinites
    LookaheadMode[LookaheadMode["WHEN_CLEAR"] = 3] = "WHEN_CLEAR";
})(LookaheadMode = exports.LookaheadMode || (exports.LookaheadMode = {}));
//# sourceMappingURL=studio.js.map