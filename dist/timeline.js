"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineObjHoldMode = exports.Timeline = exports.TSR = void 0;
const TSR = require("timeline-state-resolver-types");
exports.TSR = TSR;
var timeline_state_resolver_types_1 = require("timeline-state-resolver-types");
Object.defineProperty(exports, "Timeline", { enumerable: true, get: function () { return timeline_state_resolver_types_1.Timeline; } });
var TimelineObjHoldMode;
(function (TimelineObjHoldMode) {
    TimelineObjHoldMode[TimelineObjHoldMode["NORMAL"] = 0] = "NORMAL";
    TimelineObjHoldMode[TimelineObjHoldMode["ONLY"] = 1] = "ONLY";
    TimelineObjHoldMode[TimelineObjHoldMode["EXCEPT"] = 2] = "EXCEPT";
})(TimelineObjHoldMode = exports.TimelineObjHoldMode || (exports.TimelineObjHoldMode = {}));
//# sourceMappingURL=timeline.js.map