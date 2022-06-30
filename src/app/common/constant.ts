export const constants = {
    AUDIO_TITLE_CASE: 'Audio',
    AUDIO_SMALL_CASE: 'audio',
    IMAGE_TITLE_CASE: 'Image',
    IMAGE_SMALL_CASE: 'image',
    VIDEO_TITLE_CASE: 'Video',
    VIDEO_SMALL_CASE: 'video',
    PICTURE_TITLE_CASE: 'Picture',
    PICTURE_SMALL_CASE: 'picture',
    FILE_TITLE_CASE: 'File',
    FILE_SMALL_CASE: 'file',
};

export const localStorageVars = {
    RECENTLY_VIEWED: 'Administrator-default-nuxeo-recent-documents',
    CLIPBOARD: 'Administrator-default-nuxeo-clipboard'
};

export const assetDimension = {
    to_500_px: 'Less than 500 px',
    from_500_to_1500_px: 'Between 500 px and 1,500 px',
    from_1500_to_2000_px: 'Between 1,500 px and 2,000 px',
    from_2000_px: 'More than 2,000 px'
};

export const reverseAssetDimension = {
    'Less than 500 px': 'to_500_px',
    'Between 500 px and 1,500 px': 'from_500_to_1500_px',
    'Between 1,500 px and 2,000 px': 'from_1500_to_2000_px',
    'More than 2,000 px': 'from_2000_px'
};

export const videoDurationDictionary = {
    to_30_s: 'Less than 30s',
    from_30_to_180_s: 'Between 30 s and 180 s',
    from_180_to_600_s: 'Between 180 s and 600 s',
    from_600_to_1800_s: 'Between 600 s and 1,800 s',
    from_1800_s: 'More than 1,800 s'
};

export const reverseVideoDurationDictionary = {
    'Less than 30s': 'to_30_s',
    'Between 30 s and 180 s': 'from_30_to_180_s',
    'Between 180 s and 600 s': 'from_180_to_600_s',
    'Between 600 s and 1,800 s': 'from_600_to_1800_s',
    'More than 1,800 s': 'from_1800_s'
};

export const MONTH_MAP_SHORT = {
    0: 'Jan',
    1: 'Feb',
    2: 'Mar',
    3: 'Apr',
    4: 'May',
    5: 'Jun',
    6: 'Jul',
    7: 'Aug',
    8: 'Sep',
    9: 'Oct',
    10: 'Nov',
    11: 'Dec'
};

export const TRIGGERED_FROM_SUB_HEADER = 'sub-header';
export const TRIGGERED_FROM_DOCUMENT = 'document';
export const WORKSPACE_ROOT = 'All workspaces';
export const ORDERED_FOLDER = 'OrderedFolder';
export const FOLDER_TYPE_WORKSPACE = 'Workspace';
export const ASSET_TYPE = {
    DOMAIN: 'domain',
    PICTURE: 'picture',
    WORKSPACE: 'workspace',
    ORDERED_FOLDER: 'orderedfolder',
    FOLDER: 'folder',
    FILE: 'file',
    VIDEO: 'video',
};
export const TAG_ATTRIBUTES = {
    ACTIVITY_DETECTION: 'nxtag:activityDetectionTag',
    EMOTION_DETECTION: 'nxtag:emotionDetectionTag',
    OBJECT_DETECTION: 'nxtag:objectDetectionTag',
    OCR_TAGS: 'nxtag:ocrTag',
    SCENE_DETECTION: 'nxtag:sceneDetectionTag',
    NX_TAGS: 'nxtag:tags',
    WEATHER_CLASSIFICATION: 'nxtag:weatherClassificationTag',
    PUBLIC_FIGURE_DETECTION: 'nxtag:publicFigureRecognitionTag'
};

export const AGGREGATE_TAGS = {
    SYSTEM_TAG: 'system_tag_agg',
    ACTIVITY_DETECTION: 'nxtag_activityDetectionTag_agg',
    EMOTION_DETECTION: 'nxtag_emotionDetectionTag_agg',
    OBJECT_DETECTION: 'nxtag_objectDetectionTag_agg',
    OCR_TAGS: 'nxtag_ocrTag_agg',
    SCENE_DETECTION: 'nxtag_sceneDetectionTag_agg',
    WEATHER_CLASSIFICATION: 'nxtag_weatherClassificationTag_agg',
    PUBLIC_FIGURE_DETECTION: 'nxtag:publicFigureRecognitionTag'
};

export const unwantedTags = [
    'man-made',
    'no horizon',
    'vertical components',
    'horizontal components',
    'angry',
    'sad',
    'fear',
    'disgust',
    'test tag'];

export const ASSET_SEARCH_PAGE_SIZE = 40;
export const PAGE_SIZE_200 = 200;
export const PAGE_SIZE_1000 = 1000;
export const PAGE_SIZE_40 = 40;
export const PAGE_SIZE_20 = 20;
export const TOTAL_ASSETS_LABEL = 'Total Assets';
export const UNWANTED_WORKSPACES = ['domain'];
export const DEFAULT_NUMBER_OF_TAGS_PREVIEW = 10;

export const ROOT_ID = '00000000-0000-0000-0000-000000000000';
export const REPORT_ROLE = 'reportAdmin';
export const specialExtensions = [ // NOTE: this is the extensions of special routes in backend, please connect with me before changing it
    '.js',
    '.ico',
    '.css',
    '.png',
    '.jpg',
    '.woff2',
    '.woff',
    '.ttf',
    '.svg',
    '.eot'
  ];