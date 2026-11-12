export interface Avatar {id:string;name:string;path:string;bytes:number;width:number;height:number;animated:boolean;provisional:boolean}
export interface Pack {id:string;title:string;folder:string;folderId:number;platform:string;universe:string;franchises:string[];count:number;animated:number;bytes:number;manifest:string;manifestId:number;manifestBytes:number;preview:Avatar[]}
export interface PackDetail extends Pack {images:Avatar[]}
export interface Catalog {version:string;auditedAt:string;packCount:number;imageCount:number;animatedCount:number;imageBytes:number;rootFolderId:number;globalManifestId:number;globalManifestBytes:number;packs:Pack[]}
export interface DownloadAudit {bytes:number;entries:number;crc:string;filename:string}
export interface Config {shareCode:string;shareUrl:string;apiOrigin:string;downloadsEnabled:boolean;previewsEnabled:boolean;previewLimitBytes:number;siteUrl:string;libraryArchive?:string;contactEmail?:string;contactUrl?:string;downloadAudit:null|{manifests?:DownloadAudit;library?:DownloadAudit}}
export interface SearchEntry {pack:string;id:string;name:string;original:string;animated:boolean}
