export const apiRoutes = {
    FAVORITE_FETCH: '/automation/Favorite.Fetch',
    GET_FAVOURITE_COLLECTION: 'search/pp/default_content_collection/execute',
    SEARCH_PP_ASSETS: '/search/pp/assets_search/execute',
    FETCH_TASKS: '/task',
    FETCH_COLLECTIONS: '/search/pp/user_collections/execute',
    FETCH_RECENT_EDITED: '/search/pp/domain_documents/execute',
    MARK_FAVOURITE: '/automation/Document.AddToFavorites',
    UNMARK_FAVOURITE: '/automation/Document.RemoveFromFavorites',
    FETCH_COMMENTS: '/id/[assetId]/@comment/',
    SAVE_COMMENT: '/id/[assetId]/@comment/',
    USER_PROFILE: '/user/',
    ADD_TAG: '/automation/Services.TagDocument'
};
