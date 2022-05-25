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
   "properties":{
      
   },
   "ranges": IRange[],
   "selection":[
      
   ],
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
   "entity-type": string,
   "repository": string,
   "uid": string,
   "path": string,
   "type": string,
   "state": string,
   "parentRef": string,
   "isCheckedOut": boolean;
   "isRecord": boolean;
   "retainUntil": string,
   "hasLegalHold": boolean;
   "isUnderRetentionOrLegalHold": boolean;
   "isVersion": boolean;
   "isProxy": boolean;
   "changeToken": string,
   "isTrashed": boolean;
   "title": string,
   "lastModified": string,
   "properties":{
      "uid:uid": string,
      "uid:major_version": number,
      "uid:minor_version": number,
      "thumb:thumbnail": string,
      "file:content":{
         "name": string,
         "mime-type": string,
         "encoding": string,
         "digestAlgorithm": string,
         "digest": string,
         "length": string,
         "data": string
      },
      "common:icon-expanded": string,
      "common:icon": string,
      "files:files":[
         
      ],
      "dc:description": string,
      "dc:language": string,
      "dc:start": string,
      "dc:coverage": string,
      "dc:valid": string,
      "dc:creator": string,
      "dc:modified": Date,
      "dc:lastContributor": string,
      "dc:workspace": string,
      "dc:rights": string,
      "dc:expired": string,
      "dc:format": string,
      "dc:end": string,
      "dc:folderType": string,
      "dc:created": Date,
      "dc:title": string,
      "dc:issued": string,
      "dc:recurrence": string,
      "dc:nature": string,
      "dc:subjects":[
         
      ],
      "dc:contributors":[
         "Administrator"
      ],
      "dc:source": string,
      "dc:publisher": string,
      "vid:storyboard":[
         {
            "comment":"videoplayback (7).avi 0",
            "content":{
               "name":"0.00-seconds.jpeg",
               "mime-type":"image/jpeg",
               "encoding": string,
               "digestAlgorithm":"MD5",
               "digest":"09ceb8042a6cb7a64c73ae2971491b97",
               "length":"2174",
               "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/vid:storyboard/0/content/0.00-seconds.jpeg?changeToken=9-0"
            },
            "timecode":0.0
         }
      ],
      "vid:transcodedVideos":[
         {
            "name":"MP4 480p",
            "content":{
               "name":"videoplayback (7).mp4",
               "mime-type":"video/mp4",
               "encoding": string,
               "digestAlgorithm":"MD5",
               "digest":"d118520ad4bee39261d90d4b1475ecbc",
               "length":"7837639",
               "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/vid:transcodedVideos/0/content/videoplayback%20(7).mp4?changeToken=9-0"
            },
            "info":{
               "duration":49.76,
               "frameRate":25.0,
               "streams":[
                  {
                     "codec":"h264 (High) (avc1 / 0x31637661)",
                     "bitRate":1135.0,
                     "streamInfo":"Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 854x480 [SAR 1280:1281 DAR 16:9], 1135 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)",
                     "type":"Video"
                  }
               ],
               "width":854,
               "format":"mov,mp4,m4a,3gp,3g2,mj2",
               "height":480
            }
         }
      ],
      "vid:info":{
         "duration":49.78,
         "frameRate":25.0,
         "streams":[
            {
               "codec":"h264 (High) (H264 / 0x34363248)",
               "bitRate":727.0,
               "streamInfo":"Stream #0:0: Video: h264 (High) (H264 / 0x34363248), yuv420p(progressive), 640x360 [SAR 1:1 DAR 16:9], 727 kb/s, 25 fps, 25 tbr, 25 tbn, 50 tbc",
               "type":"Video"
            }
         ],
         "width":640,
         "format":"avi",
         "height":360
      },
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
      "picture:views":[
         {
            "filename":"Small_videoplayback (7).jpg",
            "width":350,
            "description": string,
            "tag": string,
            "title":"Small",
            "content":{
               "name":"Small_videoplayback (7).jpg",
               "mime-type":"image/jpeg",
               "encoding": string,
               "digestAlgorithm":"MD5",
               "digest":"7849b3fd5e6195fae7b99d8b3b308b35",
               "length":"11477",
               "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/picture:views/0/content/Small_videoplayback%20(7).jpg?changeToken=9-0"
            },
            "height":197,
            "info":{
               "colorSpace":"sRGB",
               "depth":8,
               "width":350,
               "format":"JPEG",
               "sector": string,
               "height":197
            }
         },
         {
            "filename":"StaticPlayerView_videoplayback (7).jpg",
            "width":640,
            "description": string,
            "tag": string,
            "title":"StaticPlayerView",
            "content":{
               "name":"StaticPlayerView_videoplayback (7).jpg",
               "mime-type":"image/jpeg",
               "encoding": string,
               "digestAlgorithm":"MD5",
               "digest":"e10be592a24c157505a309c7f06a72b5",
               "length":"19538",
               "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/picture:views/1/content/StaticPlayerView_videoplayback%20(7).jpg?changeToken=9-0"
            },
            "height":360,
            "info":{
               "colorSpace":"sRGB",
               "depth":8,
               "width":640,
               "format":"JPEG",
               "sector": string,
               "height":360
            }
         }
      ],
      "picture:info":{
         "colorSpace":"sRGB",
         "depth":8,
         "width":640,
         "format":"JPEG",
         "sector": string,
         "height":360
      },
      "nxtag:tags":[
         {
            "label":"bird",
            "username":"Administrator"
         }
      ]
   },
   "facets": string[],
   "schemas":[
      {
         "name":"uid",
         "prefix":"uid"
      }
   ],
   "contextParameters":{
      "permissions":[],
      "preview":{
         "url": string
      },
      "thumbnail":{
         "url": string
      }
   }
  }

  export interface IEntryProperties {
   "uid:uid": string,
   "uid:major_version": number,
   "uid:minor_version": number,
   "thumb:thumbnail": string,
   "file:content":{
      "name": string,
      "mime-type": string,
      "encoding": string,
      "digestAlgorithm": string,
      "digest": string,
      "length": string,
      "data": string
   },
   "common:icon-expanded": string,
   "common:icon": string,
   "files:files":[
      
   ],
   "dc:description": string,
   "dc:language": string,
   "dc:start": string,
   "dc:coverage": string,
   "dc:valid": string,
   "dc:creator": string,
   "dc:modified": Date,
   "dc:lastContributor": string,
   "dc:workspace": string,
   "dc:rights": string,
   "dc:expired": string,
   "dc:format": string,
   "dc:end": string,
   "dc:folderType": string,
   "dc:created": Date,
   "dc:title": string,
   "dc:issued": string,
   "dc:recurrence": string,
   "dc:nature": string,
   "dc:subjects":[
      
   ],
   "dc:contributors":[
      "Administrator"
   ],
   "dc:source": string,
   "dc:publisher": string,
   "vid:storyboard":[
      {
         "comment":"videoplayback (7).avi 0",
         "content":{
            "name":"0.00-seconds.jpeg",
            "mime-type":"image/jpeg",
            "encoding": string,
            "digestAlgorithm":"MD5",
            "digest":"09ceb8042a6cb7a64c73ae2971491b97",
            "length":"2174",
            "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/vid:storyboard/0/content/0.00-seconds.jpeg?changeToken=9-0"
         },
         "timecode":0.0
      }
   ],
   "vid:transcodedVideos":[
      {
         "name":"MP4 480p",
         "content":{
            "name":"videoplayback (7).mp4",
            "mime-type":"video/mp4",
            "encoding": string,
            "digestAlgorithm":"MD5",
            "digest":"d118520ad4bee39261d90d4b1475ecbc",
            "length":"7837639",
            "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/vid:transcodedVideos/0/content/videoplayback%20(7).mp4?changeToken=9-0"
         },
         "info":{
            "duration":49.76,
            "frameRate":25.0,
            "streams":[
               {
                  "codec":"h264 (High) (avc1 / 0x31637661)",
                  "bitRate":1135.0,
                  "streamInfo":"Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 854x480 [SAR 1280:1281 DAR 16:9], 1135 kb/s, 25 fps, 25 tbr, 12800 tbn, 50 tbc (default)",
                  "type":"Video"
               }
            ],
            "width":854,
            "format":"mov,mp4,m4a,3gp,3g2,mj2",
            "height":480
         }
      }
   ],
   "vid:info":{
      "duration":49.78,
      "frameRate":25.0,
      "streams":[
         {
            "codec":"h264 (High) (H264 / 0x34363248)",
            "bitRate":727.0,
            "streamInfo":"Stream #0:0: Video: h264 (High) (H264 / 0x34363248), yuv420p(progressive), 640x360 [SAR 1:1 DAR 16:9], 727 kb/s, 25 fps, 25 tbr, 25 tbn, 50 tbc",
            "type":"Video"
         }
      ],
      "width":640,
      "format":"avi",
      "height":360
   },
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
   "picture:views":[
      {
         "filename":"Small_videoplayback (7).jpg",
         "width":350,
         "description": string,
         "tag": string,
         "title":"Small",
         "content":{
            "name":"Small_videoplayback (7).jpg",
            "mime-type":"image/jpeg",
            "encoding": string,
            "digestAlgorithm":"MD5",
            "digest":"7849b3fd5e6195fae7b99d8b3b308b35",
            "length":"11477",
            "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/picture:views/0/content/Small_videoplayback%20(7).jpg?changeToken=9-0"
         },
         "height":197,
         "info":{
            "colorSpace":"sRGB",
            "depth":8,
            "width":350,
            "format":"JPEG",
            "sector": string,
            "height":197
         }
      },
      {
         "filename":"StaticPlayerView_videoplayback (7).jpg",
         "width":640,
         "description": string,
         "tag": string,
         "title":"StaticPlayerView",
         "content":{
            "name":"StaticPlayerView_videoplayback (7).jpg",
            "mime-type":"image/jpeg",
            "encoding": string,
            "digestAlgorithm":"MD5",
            "digest":"e10be592a24c157505a309c7f06a72b5",
            "length":"19538",
            "data":"http://10.101.21.58:8089/nuxeo/nxfile/default/507d1b60-f269-49b8-a6c1-cec175a7593b/picture:views/1/content/StaticPlayerView_videoplayback%20(7).jpg?changeToken=9-0"
         },
         "height":360,
         "info":{
            "colorSpace":"sRGB",
            "depth":8,
            "width":640,
            "format":"JPEG",
            "sector": string,
            "height":360
         }
      }
   ],
   "picture:info":{
      "colorSpace":"sRGB",
      "depth":8,
      "width":640,
      "format":"JPEG",
      "sector": string,
      "height":360
   },
   "nxtag:tags":[
      {
         "label":"bird",
         "username":"Administrator"
      }
   ]
}