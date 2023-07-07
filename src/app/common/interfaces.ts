export interface ISearchResponse {
  "entity-type"?: string;
  "isPaginable":boolean;
  "resultsCount":number;
  "pageSize": number;
  "maxPageSize": number;
  "resultsCountLimit": number;
  "currentPageSize":number;
  "currentPageIndex": number;
  "currentPageOffset": number;
  "numberOfPages":number;
  "isPreviousPageAvailable": boolean;
  "isNextPageAvailable":boolean;
  "isLastPageAvailable":boolean;
  "isSortable":boolean;
  "hasError": boolean;
  "errorMessage": string,
  "totalSize":number;
  "pageIndex": number;
  "pageCount":number;
  "aggregations":{
     "sectors": IAggregateNonRangeType,
     "asset_width_agg": IAggregateRangeType,
     "color_profile_agg": IAggregateNonRangeType,
     "color_depth_agg": IAggregateNonRangeType,
     "asset_height_agg": IAggregateRangeType,
     "video_duration_agg": IAggregateRangeType,
     "system_primaryType_agg": IAggregateNonRangeType,
     "system_mimetype_agg": IAggregateNonRangeType
  },
  "entries": IEntry[]
}

export interface IAggregateNonRangeType {
 "entity-type": string;
 "id": string;
 "field":string,
 "properties":{
    
 },
 "ranges":[
    
 ],
 "selection":[
    
 ],
 "type": string,
 "buckets": IKeyDocCount[],
 "extendedBuckets": IKeyDocCount[],
}

export interface IAggregateRangeType {
 "entity-type": string;
 "id": string;
 "field":string,
 "properties":any,
 "ranges": IRange[],
 "selection":[],
 "type": string,
 "buckets": IRangeDocCount[],
 "extendedBuckets": IRangeDocCount[]
}

export interface IRange {
 "key": string,
 "from": string,
 "to": number
}

export interface IRangeDocCount {
 "key": string,
 "from": string,
 "to": number,
 "docCount": number
}
export interface IKeyDocCount {
 "key": string,
 "docCount": number
}

export interface IEntry {
  "update"?: string,
 "childType"?: string,
 "start"?: string,
 "isSelected"?: boolean,
 "copy"?: string,
 "entity-type"?: string,
 "repository"?: string,
 "uid"?: string,
 "path"?: string,
 "type"?: string,
 "state"?: string,
 "parentRef"?: string,
 "isCheckedOut"?: boolean;
 "isRecord"?: boolean;
 "retainUntil"?: string,
 "hasLegalHold"?: boolean;
 "isUnderRetentionOrLegalHold"?: boolean;
 "isVersion"?: boolean;
 "isProxy"?: boolean;
 "changeToken"?: string,
 "isTrashed"?: boolean;
 "title"?: string,
 "lastModified"?: string,
 "properties"?: IEntryProperties,
 "facets"?: string[],
 "schemas"?:[
    {
       "name":string,
       "prefix":string
    }
 ],
 "contextParameters"?:{
   "acls": [{
      name: string,
      aces: [{
         permission: string,
         username: string
      }]
   }];
    "permissions"?:[];
    "breadcrumb"?: {
       "entity-type":string,
       "entries": IEntry[]
    };
    "preview"?:{
       "url": string
    };
    "thumbnail"?:{
       "url": string
    }
 }
}

export interface IEntryProperties {
 "uid:uid": string,
 "uid:major_version": number,
 "uid:minor_version": number,
 "thumb:thumbnail": string,
 "file:content":IContentInfo,
 "common:icon-expanded": string,
 "common:icon": string,
 "files:files":any[],
 "dc:isPrivate"?: boolean,
 "dc:description": string,
 "dc:language": string,
 "dc:start": string,
 "dc:coverage": string,
 "dc:valid": string,
 "dc:creator": IDcCreator,
 "dc:modified": string,
 "dc:lastContributor": string,
 "dc:workspace": string,
 "dc:rights": string,
 "dc:expired": string,
 "dc:format": string,
 "dc:end": string,
 "dc:folderType": string,
 "dc:created": string,
 "dc:title": string,
 "dc:issued": string,
 "dc:recurrence": string,
 "dc:nature": string,
 "dc:subjects":any[],
 "dc:contributors":string[],
 "dc:source": string,
 "dc:publisher": string,
 "vid:storyboard":IEntryPropertyContent[],
 "vid:transcodedVideos":IEntryPropertyContent[],
 "vid:info": IVideoInfo[],
 "picture:dateline": string,
 "picture:origin": string,
 "picture:caption": string,
 "picture:language": string,
 "picture:source": string,
 "picture:cropCoords": string,
 "picture:slugline": string,
 "picture:genre": string,
 "picture:typage": string,
 "picture:credit": string,
 "picture:headline": string,
 "picture:subheadline": string,
 "picture:byline": string,
 "picture:views":IPictureView[],
 "picture:info":IPictureInfo,
 "nxtag:tags":INxTag[]
}

export interface IDcCreator {
 "entity-type": string,
 extendedGroups: string[],
 id: string,
 isAdministrator: boolean,
 isAnonymous: boolean,
 isPartial: boolean,
 properties: {
    assetSeen: string,
    company: string,
    email: string,
    firstName: string,
    groups: string[],
    lastName: string,
    sector: string,
    tenantId: string,
    username: string
 }
}
export interface INxTag {
 "label":string,
 "username":string
}
export interface IEntryPropertyContent {
 "name"?:string,
 "comment"?:string,
 "content": IContentInfo,
 "timecode"?:number,
 "info"?: IVideoInfo
}

export interface IContentInfo {
 "name":string,
 "mime-type":string,
 "encoding": string,
 "digestAlgorithm":string,
 "digest":string,
 "length":string,
 "data":string
}

export interface IEntryPropertyContentInfo {
 "duration":number,
 "frameRate":number,
 "streams": IVideoInfo[],
 "width":number,
 "format":string,
 "height":number
}

export interface IVideoInfo {
 "codec":string,
 "bitRate":number,
 "streamInfo":string,
 "type":string
}
export interface IPictureInfo {
 "colorSpace":string,
 "depth":number,
 "width":number,
 "format":string,
 "sector": string,
 "height":number
}

export interface IPictureView {
 "filename":string,
 "width":number,
 "description": string,
 "tag": string,
 "title":string,
 "content":IContentInfo,
 "height":number,
 "info":IPictureInfo
}

export interface IBrowseSidebar {
 isExpand: boolean,
 menuId: string,
 parentMenuId: string,
 path: string,
 title: string,
 uid: string,
 children?: IEntry[]
}

export interface IArrow {
 "title": boolean,
 "fileType": boolean,
 "fileSize": boolean,
 "dc:creator": boolean,
 "dc:created": boolean,
 "dc:modified": boolean,
 "dc:sector": boolean
}

export interface IChildAssetACL {
   "primaryDocID": string,
   "path": string,
   "acl": string,
   "isPrivate": string,
   "title": string,
   "creator": string
}