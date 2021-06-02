"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeripheralDeviceAPI = void 0;
/**
 * Note: This file contains a copy of the typings from meteor/lib/api/peripheralDevice.ts in Core
 */
var PeripheralDeviceAPI;
(function (PeripheralDeviceAPI) {
    let StatusCode;
    (function (StatusCode) {
        /** Unknown status, could be due to parent device connected etc.. */
        StatusCode[StatusCode["UNKNOWN"] = 0] = "UNKNOWN";
        /** All good and green */
        StatusCode[StatusCode["GOOD"] = 1] = "GOOD";
        /** Everything is not OK, but normal operation should not be affected. An optional/backup service might be offline, etc. */
        StatusCode[StatusCode["WARNING_MINOR"] = 2] = "WARNING_MINOR";
        /** Everything is not OK, operation might be affected. Like when having switched to a backup, or have taken action to fix an error. Sofie will show a restart device button for this and all higher severity warnings. */
        StatusCode[StatusCode["WARNING_MAJOR"] = 3] = "WARNING_MAJOR";
        /** Not good. Operation is affected. Will be able to recover on it's own when the situation changes. */
        StatusCode[StatusCode["BAD"] = 4] = "BAD";
        /** Not good. Operation is affected. Will NOT be able to to recover from this, manual intervention will be required. */
        StatusCode[StatusCode["FATAL"] = 5] = "FATAL";
    })(StatusCode = PeripheralDeviceAPI.StatusCode || (PeripheralDeviceAPI.StatusCode = {}));
    // Note: The definite type of a device is determined by the Category, Type and SubType
    let DeviceCategory;
    (function (DeviceCategory) {
        DeviceCategory["INGEST"] = "ingest";
        DeviceCategory["PLAYOUT"] = "playout";
        DeviceCategory["MEDIA_MANAGER"] = "media_manager";
    })(DeviceCategory = PeripheralDeviceAPI.DeviceCategory || (PeripheralDeviceAPI.DeviceCategory = {}));
    /**
     * Deprecated and should not be used in new integrations.
     */
    let DeviceType;
    (function (DeviceType) {
        // Ingest devices:
        DeviceType["MOS"] = "mos";
        DeviceType["SPREADSHEET"] = "spreadsheet";
        DeviceType["INEWS"] = "inews";
        // Playout devices:
        DeviceType["PLAYOUT"] = "playout";
        // Media-manager devices:
        DeviceType["MEDIA_MANAGER"] = "media_manager";
    })(DeviceType = PeripheralDeviceAPI.DeviceType || (PeripheralDeviceAPI.DeviceType = {}));
    PeripheralDeviceAPI.SUBTYPE_PROCESS = '_process';
    let methods;
    (function (methods) {
        methods["functionReply"] = "peripheralDevice.functionReply";
        methods["testMethod"] = "peripheralDevice.testMethod";
        methods["setStatus"] = "peripheralDevice.status";
        methods["ping"] = "peripheralDevice.ping";
        methods["initialize"] = "peripheralDevice.initialize";
        methods["unInitialize"] = "peripheralDevice.unInitialize";
        methods["getPeripheralDevice"] = "peripheralDevice.getPeripheralDevice";
        methods["pingWithCommand"] = "peripheralDevice.pingWithCommand";
        methods["killProcess"] = "peripheralDevice.killProcess";
        methods["determineDiffTime"] = "systemTime.determineDiffTime";
        methods["getTimeDiff"] = "systemTime.getTimeDiff";
        methods["getTime"] = "systemTime.getTime";
        methods["timelineTriggerTime"] = "peripheralDevice.timeline.setTimelineTriggerTime";
        methods["partPlaybackStarted"] = "peripheralDevice.rundown.partPlaybackStarted";
        methods["partPlaybackStopped"] = "peripheralDevice.rundown.partPlaybackStopped";
        methods["piecePlaybackStarted"] = "peripheralDevice.rundown.piecePlaybackStarted";
        methods["piecePlaybackStopped"] = "peripheralDevice.rundown.piecePlaybackStopped";
        methods["reportCommandError"] = "peripheralDevice.playout.reportCommandError";
        methods["mosRoCreate"] = "peripheralDevice.mos.roCreate";
        methods["mosRoReplace"] = "peripheralDevice.mos.roReplace";
        methods["mosRoDelete"] = "peripheralDevice.mos.roDelete";
        methods["mosRoDeleteForce"] = "peripheralDevice.mos.roDeleteForce";
        methods["mosRoMetadata"] = "peripheralDevice.mos.roMetadata";
        methods["mosRoStatus"] = "peripheralDevice.mos.roStatus";
        methods["mosRoStoryStatus"] = "peripheralDevice.mos.roStoryStatus";
        methods["mosRoItemStatus"] = "peripheralDevice.mos.roItemStatus";
        methods["mosRoStoryInsert"] = "peripheralDevice.mos.roStoryInsert";
        methods["mosRoStoryReplace"] = "peripheralDevice.mos.roStoryReplace";
        methods["mosRoStoryMove"] = "peripheralDevice.mos.roStoryMove";
        methods["mosRoStoryDelete"] = "peripheralDevice.mos.roStoryDelete";
        methods["mosRoStorySwap"] = "peripheralDevice.mos.roStorySwap";
        methods["mosRoItemInsert"] = "peripheralDevice.mos.roItemInsert";
        methods["mosRoItemReplace"] = "peripheralDevice.mos.roItemReplace";
        methods["mosRoItemMove"] = "peripheralDevice.mos.roItemMove";
        methods["mosRoItemDelete"] = "peripheralDevice.mos.roItemDelete";
        methods["mosRoItemSwap"] = "peripheralDevice.mos.roItemSwap";
        methods["mosRoReadyToAir"] = "peripheralDevice.mos.roReadyToAir";
        methods["mosRoFullStory"] = "peripheralDevice.mos.roFullStory";
        methods["dataRundownList"] = "peripheralDevice.rundown.rundownList";
        methods["dataRundownGet"] = "peripheralDevice.rundown.rundownGet";
        methods["dataRundownDelete"] = "peripheralDevice.rundown.rundownDelete";
        methods["dataRundownCreate"] = "peripheralDevice.rundown.rundownCreate";
        methods["dataRundownUpdate"] = "peripheralDevice.rundown.rundownUpdate";
        methods["dataSegmentGet"] = "peripheralDevice.rundown.segmentGet";
        methods["dataSegmentDelete"] = "peripheralDevice.rundown.segmentDelete";
        methods["dataSegmentCreate"] = "peripheralDevice.rundown.segmentCreate";
        methods["dataSegmentUpdate"] = "peripheralDevice.rundown.segmentUpdate";
        methods["dataSegmentRanksUpdate"] = "peripheralDevice.rundown.segmentRanksUpdate";
        methods["dataPartDelete"] = "peripheralDevice.rundown.partDelete";
        methods["dataPartCreate"] = "peripheralDevice.rundown.partCreate";
        methods["dataPartUpdate"] = "peripheralDevice.rundown.partUpdate";
        methods["resyncRundown"] = "peripheralDevice.mos.roResync";
        methods["getMediaObjectRevisions"] = "peripheralDevice.mediaScanner.getMediaObjectRevisions";
        methods["updateMediaObject"] = "peripheralDevice.mediaScanner.updateMediaObject";
        methods["clearMediaObjectCollection"] = "peripheralDevice.mediaScanner.clearMediaObjectCollection";
        methods["getMediaWorkFlowRevisions"] = "peripheralDevice.mediaManager.getMediaWorkFlowRevisions";
        methods["updateMediaWorkFlow"] = "peripheralDevice.mediaManager.updateMediaWorkFlow";
        methods["getMediaWorkFlowStepRevisions"] = "peripheralDevice.mediaManager.getMediaWorkFlowStepRevisions";
        methods["updateMediaWorkFlowStep"] = "peripheralDevice.mediaManager.updateMediaWorkFlowStep";
        methods["insertExpectedPackageWorkStatus"] = "peripheralDevice.packageManager.insertExpectedPackageWorkStatus";
        methods["updateExpectedPackageWorkStatus"] = "peripheralDevice.packageManager.updateExpectedPackageWorkStatus";
        methods["removeExpectedPackageWorkStatus"] = "peripheralDevice.packageManager.removeExpectedPackageWorkStatus";
        methods["removeAllExpectedPackageWorkStatusOfDevice"] = "peripheralDevice.packageManager.removeAllExpectedPackageWorkStatusOfDevice";
        methods["updatePackageContainerPackageStatus"] = "peripheralDevice.packageManager.updatePackageContainerPackageStatus";
        methods["fetchPackageInfoMetadata"] = "peripheralDevice.packageManager.fetchPackageInfoMetadata";
        methods["updatePackageInfo"] = "peripheralDevice.packageManager.updatePackageInfo";
        methods["removePackageInfo"] = "peripheralDevice.packageManager.removePackageInfo";
        methods["requestUserAuthToken"] = "peripheralDevice.spreadsheet.requestUserAuthToken";
        methods["storeAccessToken"] = "peripheralDevice.spreadsheet.storeAccessToken";
    })(methods = PeripheralDeviceAPI.methods || (PeripheralDeviceAPI.methods = {}));
})(PeripheralDeviceAPI = exports.PeripheralDeviceAPI || (exports.PeripheralDeviceAPI = {}));
//# sourceMappingURL=corePeripherals.js.map