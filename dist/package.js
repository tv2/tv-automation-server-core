"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpectedPackageStatusAPI = exports.Accessor = exports.ExpectedPackage = void 0;
/**
 * An ExpectedPackage is sent from Core to the Package Manager, to signal that a Package (ie a Media file) should be copied to a playout-device.
 * It used by core to describe what Packages are needed on various sources.
 * Example: A piece uses a media file for playout in CasparCG. The media file will then be an ExpectedPackage, which the Package Manager
 *   will fetch from a MAM and copy to the media-folder of CasparCG.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var ExpectedPackage;
(function (ExpectedPackage) {
    let PackageType;
    (function (PackageType) {
        PackageType["MEDIA_FILE"] = "media_file";
        PackageType["QUANTEL_CLIP"] = "quantel_clip";
        // TALLY_LABEL = 'tally_label'
        // VIZ_GFX = 'viz_gfx'
    })(PackageType = ExpectedPackage.PackageType || (ExpectedPackage.PackageType = {}));
})(ExpectedPackage = exports.ExpectedPackage || (exports.ExpectedPackage = {}));
/** Defines different ways of accessing a PackageContainer.
 * For example, a local folder on a computer might be accessed through a LocalFolder and a FileShare
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var Accessor;
(function (Accessor) {
    let AccessType;
    (function (AccessType) {
        AccessType["LOCAL_FOLDER"] = "local_folder";
        AccessType["FILE_SHARE"] = "file_share";
        AccessType["HTTP"] = "http";
        AccessType["QUANTEL"] = "quantel";
        AccessType["CORE_PACKAGE_INFO"] = "core_package_info";
    })(AccessType = Accessor.AccessType || (Accessor.AccessType = {}));
})(Accessor = exports.Accessor || (exports.Accessor = {}));
// todo: should this be moved into core-integration?
// eslint-disable-next-line @typescript-eslint/no-namespace
var ExpectedPackageStatusAPI;
(function (ExpectedPackageStatusAPI) {
    let PackageContainerPackageStatusStatus;
    (function (PackageContainerPackageStatusStatus) {
        /** The Package source isn't found at all */
        PackageContainerPackageStatusStatus["NOT_FOUND"] = "not_found";
        /** The Package source is found, but not able to be transferred */
        PackageContainerPackageStatusStatus["NOT_READY"] = "not_ready";
        /** The Package is currently transferring, but can be played out */
        PackageContainerPackageStatusStatus["TRANSFERRING_READY"] = "transferring_ready";
        /** The Package is currently transferring, and is not ready to be played out */
        PackageContainerPackageStatusStatus["TRANSFERRING_NOT_READY"] = "transferring_not_ready";
        /** All good, the package is in place and ready to play*/
        PackageContainerPackageStatusStatus["READY"] = "ready";
    })(PackageContainerPackageStatusStatus = ExpectedPackageStatusAPI.PackageContainerPackageStatusStatus || (ExpectedPackageStatusAPI.PackageContainerPackageStatusStatus = {}));
})(ExpectedPackageStatusAPI = exports.ExpectedPackageStatusAPI || (exports.ExpectedPackageStatusAPI = {}));
//# sourceMappingURL=package.js.map