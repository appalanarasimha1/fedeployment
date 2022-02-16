export const apiRoutes = {
    FAVORITE_FETCH: '/automation/Favorite.Fetch',
    GET_FAVOURITE_COLLECTION: 'search/pp/default_content_collection/execute',
    SEARCH_PP_ASSETS: '/search/pp/assets_search/execute',
    DEFAULT_SEARCH: '/search/pp/default_search/execute',
    FETCH_TASKS: '/task',
    FETCH_COLLECTIONS: '/search/pp/user_collections/execute',
    FETCH_RECENT_EDITED: '/search/pp/domain_documents/execute',
    MARK_FAVOURITE: '/automation/Document.AddToFavorites',
    UNMARK_FAVOURITE: '/automation/Document.RemoveFromFavorites',
    FETCH_COMMENTS: '/id/[assetId]/@comment/',
    SAVE_COMMENT: '/id/[assetId]/@comment/',
    USER_PROFILE: '/user/',
    ADD_TAG: '/automation/Services.TagDocument',
    UPLOAD: '/upload',
    ADVANCE_DOC_PP: '/search/pp/advanced_document_content/execute',
    SEARCH_USER: '/user/search',
    ADD_PERMISSION: '/automation/Document.AddPermission',
    REMOVE_ACL: '/automation/Document.RemoveACL',
    NXQL_SEARCH: '/search/pp/nxql_search/execute',
    FETCH_PERSONALIZED_VIDEO: '/fetchPersonalizedVideo',
    FETCH_RECENT_UPLOAD: '/search/pp/recent_upload/execute',
    FETCH_FAVORITE: '/search/pp/favoritepp/execute',
    REPORT_FETCH: '/report/fetch-report'
};
