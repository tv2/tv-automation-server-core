"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManifestEntryType = void 0;
var ConfigManifestEntryType;
(function (ConfigManifestEntryType) {
    ConfigManifestEntryType["STRING"] = "string";
    ConfigManifestEntryType["MULTILINE_STRING"] = "multiline_string";
    /** @deprecated use INT/FLOAT instead */
    ConfigManifestEntryType["NUMBER"] = "number";
    ConfigManifestEntryType["INT"] = "int";
    ConfigManifestEntryType["FLOAT"] = "float";
    ConfigManifestEntryType["BOOLEAN"] = "boolean";
    ConfigManifestEntryType["ENUM"] = "enum";
    ConfigManifestEntryType["TABLE"] = "table";
    ConfigManifestEntryType["SELECT"] = "select";
    ConfigManifestEntryType["SOURCE_LAYERS"] = "source_layers";
    ConfigManifestEntryType["LAYER_MAPPINGS"] = "layer_mappings";
    ConfigManifestEntryType["JSON"] = "json";
})(ConfigManifestEntryType = exports.ConfigManifestEntryType || (exports.ConfigManifestEntryType = {}));
//# sourceMappingURL=config.js.map