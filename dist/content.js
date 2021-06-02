"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceLayerType = void 0;
/** The type of the source layer, used to enable specific functions for special-type layers */
var SourceLayerType;
(function (SourceLayerType) {
    SourceLayerType[SourceLayerType["UNKNOWN"] = 0] = "UNKNOWN";
    SourceLayerType[SourceLayerType["CAMERA"] = 1] = "CAMERA";
    SourceLayerType[SourceLayerType["VT"] = 2] = "VT";
    SourceLayerType[SourceLayerType["REMOTE"] = 3] = "REMOTE";
    SourceLayerType[SourceLayerType["SCRIPT"] = 4] = "SCRIPT";
    SourceLayerType[SourceLayerType["GRAPHICS"] = 5] = "GRAPHICS";
    SourceLayerType[SourceLayerType["SPLITS"] = 6] = "SPLITS";
    SourceLayerType[SourceLayerType["AUDIO"] = 7] = "AUDIO";
    // CAMERA_MOVEMENT = 8,
    // METADATA = 9,
    SourceLayerType[SourceLayerType["LOWER_THIRD"] = 10] = "LOWER_THIRD";
    SourceLayerType[SourceLayerType["LIVE_SPEAK"] = 11] = "LIVE_SPEAK";
    SourceLayerType[SourceLayerType["TRANSITION"] = 13] = "TRANSITION";
    // LIGHTS = 14,
    SourceLayerType[SourceLayerType["LOCAL"] = 15] = "LOCAL";
})(SourceLayerType = exports.SourceLayerType || (exports.SourceLayerType = {}));
//# sourceMappingURL=content.js.map