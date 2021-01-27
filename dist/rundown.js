"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieceLifespan = exports.PartHoldMode = void 0;
var PartHoldMode;
(function (PartHoldMode) {
    PartHoldMode[PartHoldMode["NONE"] = 0] = "NONE";
    PartHoldMode[PartHoldMode["FROM"] = 1] = "FROM";
    PartHoldMode[PartHoldMode["TO"] = 2] = "TO";
})(PartHoldMode = exports.PartHoldMode || (exports.PartHoldMode = {}));
var PieceLifespan;
(function (PieceLifespan) {
    PieceLifespan["WithinPart"] = "part-only";
    PieceLifespan["OutOnSegmentChange"] = "segment-change";
    PieceLifespan["OutOnSegmentEnd"] = "segment-end";
    PieceLifespan["OutOnRundownChange"] = "rundown-change";
    PieceLifespan["OutOnRundownEnd"] = "rundown-end";
})(PieceLifespan = exports.PieceLifespan || (exports.PieceLifespan = {}));
//# sourceMappingURL=rundown.js.map