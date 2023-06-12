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
    WORKSPACE:'workspace',
    GENERAL_FOLDER:'general'
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
    WORKSPACE_ROOT: 'workspaceroot'
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
export const DEFAULT_NUMBER_OF_TAGS_PREVIEW = 8;

export const ROOT_ID = '00000000-0000-0000-0000-000000000000';
export const REPORT_ROLE = 'reportAdmin';
export const specialExtensions = [ // NOTE: these are extensions of special routes in backend, please connect with "Mudit" before changing it
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

export const EXTERNAL_GROUP_GLOBAL = 'external_group_global';
export const EXTERNAL_USER = 'external_user';
export const DRONE_UPLOADER = 'drone_uploader';
export const WARROOM_VIEW_ACCESS = 'Warroom View Access'
export const adminPanelWorkspacePath = '/default-domain/workspaces/AdminPanelWorkspace';
export const tabs = {
    MEDIA: 'media',
    CONSTRUCTION: 'construction'
  };

export const AISearchThemeMapping = {
    people: ["andrew mcevoy", "wayne borg", "vishal wanchoo", "roger nickells", "crown prince mohammed bin salman al saud", "peter terium", "paul marshall", "nadhmi alnasr", "king salman bin abdulaziz al saud", "justin mynar", "juan carlos", "jan paterson", "christopher tompkins", "neom ceo", "sector head", "managing director", "executive director", "sector head", "prince", "chief environment officer", "king", "woman", "person", "man", "boy", "girl", "disgust", "angry", "stressful", "neutral", "sad", "happy", "fear", "jacket", "scarf", "shorts", "tie", "clothing", "suit", "trousers", "cloth", "coat", "swimwear", "shirt", "hat", "footwear", "goggles", "fashion accessory", "goggles/sunglasses", "handbag", "tying bow tie", "sunglasses"],
    sports: ["football", "sports", "snowboard", "wakeboarding", "sports ball", "baseball bat", "playing basketball", "throwing", "skydiving", "parasailing", "surfing water", "baseball_field", "rock climbing", "baseball glove", "tennis racket", "surfboard", "scoreboard", "playing kickball", "frisbee", "motorcycling", "climbing a rope", "diving", "tennis racket", "helmet", "tennis ball", "skydiving", "shooting goal (soccer)", "skateboard", "athlete", "tennis", "sport", "sports", "scorer", "referee", "workout", "soccer", "champion", "wakeboarding", "sporting", "football", "acing", "score", "wakeboard", "ball", "basketball"],
    nature: ["tree", "grass", "forest", "snowfield", "shrubbery", "sand", "desert", "snow", "natural light", "foliage", "iceberg", "leaves", "ocean deep", "ocean", "garden", "rock", "trees", "clouds", "coral", "deserts", "environment", "mountains", "air", "water", "skies", "coast", "lakes", "winds", "valley", "leaves"],
    leisure: ["riding camel", "swimming pool", "exercise", "writing", "tourism", "touring", "camping", "reading book", "jumping in pool", "shopping", "movie theater", "book", "looking at phone", "riding bike", "jogging", "climbing a rope", "diving", "riding a bike", "swimming", "biking through snow", "scuba diving", "journey", "social", "fit"],
    technology: ["using microscope", "tv", "headphones", "laptop", "keyboard", "remote", "cell phone", "computer_room", "using remote controller", "playing controller", "refrigerator", "clock", "mouse", "camera", "remote", "watch", "opening refrigerator", "microwave", "using remote controller (not gaming)", "robots", "automobile", "technology", "science", "imaging", "robotics"],
    animals: ["sheep", "camel", "horse", "fish", "animals", "shark"],
    transportation: ["bicycle", "car interior", "airplane", "car", "bus", "bus station", "boat", "truck", "train", "airplane cabin", "motorcycle", "riding scooter", "driving tractor", "driving car", "cars", "trucks", "motorcycles", "racing", "helicopter", "submarine"],
    places: ["flea market", "hospital", "beach", "mountains", "house", "parking lot", "science museum", "campsite", "gas_station", "art gallery", "pavement", "art_school", "playground", "library", "bus station", "server room", "airport_terminal", "airplane_cabin", "auditorium", "baseball_field", "biology_laboratory", "classroom", "coffee_shop", "ocean deep", "desserts", "snowfield", "conference_room", "construction_site", "dam", "gymnasium", "industrial_area", "locker_room", "office", "restaurant", "street", "supermarket", "wind_farm", "village", "runway", "pharmacy", "music_studio", "region", "university"],
    events: ["events", "event", "exhibition", "socializing", "training", "program", "stage", "attending conference", "congregating", "celebrating", "auditorium"]
}
