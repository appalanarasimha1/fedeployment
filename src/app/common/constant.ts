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
