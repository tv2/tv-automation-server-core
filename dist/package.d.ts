/**
 * An ExpectedPackage is sent from Core to the Package Manager, to signal that a Package (ie a Media file) should be copied to a playout-device.
 * It used by core to describe what Packages are needed on various sources.
 * Example: A piece uses a media file for playout in CasparCG. The media file will then be an ExpectedPackage, which the Package Manager
 *   will fetch from a MAM and copy to the media-folder of CasparCG.
 */
export declare namespace ExpectedPackage {
    type Any = ExpectedPackageMediaFile | ExpectedPackageQuantelClip;
    enum PackageType {
        MEDIA_FILE = "media_file",
        QUANTEL_CLIP = "quantel_clip"
    }
    /** Generic (used in extends) */
    interface Base {
        /** Unique id of the expectedPackage */
        _id: string;
        /** Reference to which timeline-layer(s) the Package is going to be used in.
         * (Used to route the package to the right playout-device (targets))
         */
        layers: string[];
        /** What type of package it is */
        type: PackageType;
        /** Definition of the content of the Package.
         * With "content", we mean what's the basic definition of a package. For a media file, think "filename".
         */
        content: unknown;
        /** Definition of the version of the Package
         * A "version" is used to differ between different "modifications" for the same content. For a media file, think "modified date".
         */
        version: unknown;
        /** Hash that changes whenever the content or version changes. */
        contentVersionHash: string;
        /** Definition of the source-PackageContainers of the Package
         * The source is used by the package manager to be able to be able to do an action on the Package. For a media file about to be copied, think "source file path".
         * Multiple sources can be defined, in order of preference(?)
         */
        sources: {
            /** Reference to a PackageContainer */
            containerId: string;
            /** Locally defined Accessors, these are combined (deep extended) with the PackageContainer (if it is found) Accessors */
            accessors: {
                [accessorId: string]: AccessorOnPackage.Any;
            };
        }[];
        /** The sideEffect is used by the Package Manager to generate extra artifacts, such as thumbnails & previews */
        sideEffect: {
            /** Which container previews are to be put into */
            previewContainerId?: string;
            previewPackageSettings?: SideEffectPreviewSettings;
            /** Which container thumbnails are to be put into */
            thumbnailContainerId?: string;
            thumbnailPackageSettings?: SideEffectThumbnailSettings;
        };
    }
    interface SideEffectPreviewSettings {
        /** What the preview package filePath is going to be */
        path: string;
    }
    interface SideEffectThumbnailSettings {
        /** What the thumbnails package filePath is going to be */
        path: string;
        /** What time to pick the thumbnail from [ms] */
        seekTime?: number;
    }
    interface ExpectedPackageMediaFile extends Base {
        type: PackageType.MEDIA_FILE;
        content: {
            /** Local file path on the playout device */
            filePath: string;
        };
        version: {
            fileSize?: number;
            modifiedDate?: number;
            checksum?: string;
            checkSumType?: 'sha' | 'md5' | 'whatever';
        };
        sources: {
            containerId: string;
            accessors: {
                [accessorId: string]: AccessorOnPackage.LocalFolder | AccessorOnPackage.FileShare | AccessorOnPackage.HTTP;
            };
        }[];
    }
    interface ExpectedPackageQuantelClip extends Base {
        type: PackageType.QUANTEL_CLIP;
        content: {
            guid: string;
            title?: string;
        } | {
            guid?: string;
            title: string;
        };
        version: {
            /** The time the clips was created */
            created?: string;
            /** Quantel cloneId defines a clip across multiple servers */
            cloneId?: number;
        };
        sources: {
            containerId: string;
            accessors: {
                [accessorId: string]: AccessorOnPackage.Quantel;
            };
        }[];
    }
}
/** A PackageContainer defines a place that contains Packages, that can be read or written to.
 * For example:
 *   A PackageContainer could be a folder on a computer that contains media files.
 *   That folder could be accessed locally (Accessor.LocalFolder)
 *   and if the folder is shared, by a Accessor.FileShare over the network
 */
export interface PackageContainer {
    /** Short name, for displaying to user */
    label: string;
    /** A list of ways to access the PackageContainer. Note: The accessors are different ways to access THE SAME PackageContainer. */
    accessors: {
        [accessorId: string]: Accessor.Any;
    };
}
/** Defines different ways of accessing a PackageContainer.
 * For example, a local folder on a computer might be accessed through a LocalFolder and a FileShare
 */
export declare namespace Accessor {
    type Any = LocalFolder | FileShare | HTTP | Quantel | CorePackageCollection;
    enum AccessType {
        LOCAL_FOLDER = "local_folder",
        FILE_SHARE = "file_share",
        HTTP = "http",
        QUANTEL = "quantel",
        CORE_PACKAGE_INFO = "core_package_info"
    }
    /** Generic (used in extends) */
    interface Base {
        type: AccessType;
        label: string;
        allowRead: boolean;
        allowWrite: boolean;
    }
    /** Defines access to a local folder */
    interface LocalFolder extends Base {
        type: AccessType.LOCAL_FOLDER;
        /** Name/id of the resource, this could for example be the computer name. */
        resourceId?: string;
        /** Path to the folder
         * @example 'C:\media\'
         */
        folderPath: string;
    }
    interface FileShare extends Base {
        type: AccessType.FILE_SHARE;
        /** Name/Id of the network the share exists on. Used to differ between different local networks. */
        networkId?: string;
        /** Path to a folder on a network-share
         * @example '\\192.168.0.1\shared\'
         */
        folderPath: string;
        userName?: string;
        password?: string;
    }
    interface HTTP extends Base {
        type: AccessType.HTTP;
        /** Base url (url to the host), for example http://myhost.com/fileShare/ */
        baseUrl: string;
        /** Any headers to send along with the request */
        /** Name/Id of the network the share exists on. Used to differ between different local networks. Leave empty if globally accessible. */
        networkId?: string;
    }
    interface Quantel extends Base {
        type: AccessType.QUANTEL;
        /** URL to a Quantel-gateway (https://github.com/nrkno/tv-automation-quantel-gateway) */
        quantelGatewayUrl: string;
        /** Locations of the Quantel ISA:s (in order of importance) */
        ISAUrls: string[];
        /** Zone id, defaults to 'default' */
        zoneId?: string;
        /** Server id. Can be omitted for sources, as clip-searches are zone-wide */
        serverId?: number;
        /** Name/Id of the network the share exists on. Used to differ between different networks. Leave empty if globally accessible. */
        networkId?: string;
        /** URL to a HTTP-transformer. Used for thumbnails, previews etc.. (http://hostname:port) */
        transformerURL?: string;
    }
    /** Virtual PackageContainer used for piping data into core */
    interface CorePackageCollection extends Base {
        type: Accessor.AccessType.CORE_PACKAGE_INFO;
    }
}
/**
 * AccessorOnPackage contains interfaces for Accessor definitions that are put ON the Package.
 * The info is then (optionally) combined with the Accessor data
 */
export declare namespace AccessorOnPackage {
    type Any = LocalFolder | FileShare | HTTP | Quantel | CorePackageCollection;
    interface LocalFolder extends Partial<Accessor.LocalFolder> {
        /** Path to the file (starting from .folderPath). If not set, the filePath of the ExpectedPackage will be used */
        filePath: string;
    }
    interface FileShare extends Partial<Accessor.FileShare> {
        /** Path to the file (starting from .folderPath). If not set, the filePath of the ExpectedPackage will be used */
        filePath: string;
    }
    interface HTTP extends Partial<Accessor.HTTP> {
        /** URL path to resource (combined with .baseUrl gives the full URL), for example: /folder/myFile */
        url: string;
    }
    interface Quantel extends Partial<Accessor.Quantel> {
        guid?: string;
        title?: string;
    }
    interface CorePackageCollection extends Partial<Accessor.CorePackageCollection> {
    }
}
export interface PackageContainerOnPackage extends Omit<PackageContainer, 'accessors'> {
    containerId: string;
    /** Short name, for displaying to user */
    label: string;
    accessors: {
        [accessorId: string]: AccessorOnPackage.Any;
    };
}
export declare namespace ExpectedPackageStatusAPI {
    /** Information about the status of some work being performed with regards to an Expected Package */
    interface WorkStatus extends WorkBaseInfo, WorkStatusInfo {
    }
    interface WorkBaseInfo {
        /** Which packages the WorkStatus belongs to */
        fromPackages: WorkBaseInfoFromPackage[];
        /** Short Display label */
        label: string;
        /** Longer expanation on what the Expectation does */
        description: string;
        /** Used in status GUI to order the Expecations within the same packageId. */
        displayRank?: number;
        /** If the expectation is required to be fullfilled for playout */
        requiredForPlayout?: boolean;
    }
    interface WorkBaseInfoFromPackage {
        /** Reference to the id of the Package */
        id: string;
        /** Reference to the contentVersionHash of the ExpectedPackage, used to reference the expected content+version of the Package */
        expectedContentVersionHash: string;
        /** Referring to the actual contentVersionHash of the Package, used to reference the exact content+version of the Package */
        actualContentVersionHash: string;
    }
    /** The stat */
    interface WorkStatusInfo {
        /** Short description on what the current status is. Example "working", "fulfilled" */
        status: string;
        /** Longer reason as to why the status is what it is */
        statusReason: string;
        /** Progress, 0-1 */
        progress?: number;
        /** Calculated time left of this step */
        expectedLeft?: number;
    }
    /** Describes the status of a Package in a PackageContainer */
    interface PackageContainerPackageStatus extends Omit<WorkStatusInfo, 'status'> {
        status: PackageContainerPackageStatusStatus;
        /** Indicates that the Package is a Placehodler / Is NOT ready to be played out */
        isPlaceholder: boolean;
        contentVersionHash: string;
        progress: number;
        /** Calculated time left, used when status = TRANSFERRING_* */
        expectedLeft?: number;
        /** Longer reason as to why the status is what it is */
        statusReason: string;
    }
    enum PackageContainerPackageStatusStatus {
        /** The Package source isn't found at all */
        NOT_FOUND = "not_found",
        /** The Package source is found, but not able to be transferred */
        NOT_READY = "not_ready",
        /** The Package is currently transferring, but can be played out */
        TRANSFERRING_READY = "transferring_ready",
        /** The Package is currently transferring, and is not ready to be played out */
        TRANSFERRING_NOT_READY = "transferring_not_ready",
        /** All good, the package is in place and ready to play*/
        READY = "ready"
    }
}
export declare type ListenToPackageUpdate = any;
//# sourceMappingURL=package.d.ts.map