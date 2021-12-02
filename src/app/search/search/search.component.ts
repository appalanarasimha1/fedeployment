import { Component, OnInit, ViewChild } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
// import { ApiService } from '../services/http.service';
import { SharedService } from '../../services/shared.service';
import { constants } from 'src/app/common/constant';
import { DataService } from 'src/app/services/data.service';
import { SideDrawerComponent } from 'src/app/common/sideDrawer/sideDrawer.component';

@Component({
  selector: 'app-search',
  styleUrls: ['./search.component.css'],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  @ViewChild('advancedFilter') advancedFilter: SideDrawerComponent;
  searchValue: IHeaderSearchCriteria = { ecm_fulltext: '', highlight: '' };
  documents: any = { aggregations: {}, entries: [], resultsCount: 0 };
  loading = false;
  error = undefined;
  metaData = {
    system_primaryType_agg: { buckets: [], selection: [], extendedBuckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [], selection: [] },
    asset_height_agg: { buckets: [], selection: [] },
    video_duration_agg: { buckets: [], selection: [] },
    system_tag_agg: { buckets: [], selection: [] },
    dublincore_sector_agg: { buckets: [], selection: [] },
    dublincore_created_agg: { buckets: [], selection: [] }
  };
  aggregationsMetaData;
  filtersParams = {};
  documentCount = {};
  extra = 0;
  images: any = { aggregations: {}, entries: [], resultsCount: 0 };
  videos: any = { aggregations: {}, entries: [], resultsCount: 0 };
  audio: any = { aggregations: {}, entries: [], resultsCount: 0 };
  files: any = { aggregations: {}, entries: [], resultsCount: 0 };
  tagsMetadata: any = { bucket: [], selection: [] };
  apiToHit: any = { Picture: {}, Video: {}, Audio: {} };
  count = 0; // for multiple api calls
  sectors = [];
  firstCallResult = true;

  // TypeScript public modifiers
  constructor(
    public nuxeo: NuxeoService,
    private router: Router,
    private sharedService: SharedService,
    private dataService: DataService
  ) { }

  ngOnInit() {

    if (!this.nuxeo.nuxeoClient || !localStorage.getItem('token')) {
      this.sharedService.redirectToLogin();
      return;
    }

    this.dataService.sectorSelected$.subscribe((sectorSelected: IHeaderSearchCriteria) => {
      this.filters(sectorSelected);
    });
    // this.connectToNuxeo();
  }

  connectToNuxeo() {
    // this.nuxeo.nuxeoClientConnect();
  }

  searchTerm(data: IHeaderSearchCriteria) {
    this.searchValue = data;

    this.searchDocuments(data);
  }

  filters(data: IHeaderSearchCriteria) {
    this.filtersParams = data;
    this.searchDocuments(data);
  }

  searchDocuments(dataParam: IHeaderSearchCriteria, pageNumber?: any) {

    this.error = undefined;
    this.filtersParams['ecm_fulltext'] = this.searchValue.ecm_fulltext || '';
    this.filtersParams['highlight'] = this.searchValue.highlight || '';
    this.filtersParams['sortBy'] = dataParam['sortBy'] || '';
    this.filtersParams['sortOrder'] = dataParam['sortOrder'] || '';

    const data = this.filtersParams;


    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40 };
    for (const key in data) {
      if (typeof data[key] !== 'string' && typeof data[key] !== 'number') {
        data[key].map((item: string) => {
          if (queryParams[key]) {
            queryParams[key] = queryParams[key].split(']')[0] + `,"${item.toString()}"]`;
          }
          else { queryParams[key] = `["${item.toString()}"]`; }
        });
      } else {
        queryParams[key] = data[key];
      }
    }
    if (queryParams['dublincore_sector_agg'] !== undefined) {
      if (queryParams['dublincore_sector_agg'] === '[""]') {
        delete queryParams['dublincore_sector_agg']

      }
    }
    this.hitSearchApi(queryParams, pageNumber);
  }

  hitSearchApi(queryParams: any, pageNumber) {
    this.firstCallResult = true;
    const params = this.populateQueryParams(queryParams);
    this.fetchApiResult(params);
  }

  populateQueryParams(queryParams) {
    return queryParams;
  }

  fetchApiResult(params, isShowMore: boolean = false) {
    const headers = { 'enrichers-document': ['thumbnail', 'tags', 'favorites', 'audit', 'renditions', 'preview'], 'fetch.document': 'properties', properties: '*', 'enrichers.user': 'userprofile' };
    this.dataService.loaderValueChange(true);
    const url = apiRoutes.SEARCH_PP_ASSETS;
    this.nuxeo.nuxeoClient.request(url, { queryParams: params, headers })
      .get().then((docs) => {
        this.setData(docs, isShowMore);
        this.getAggregationValues();
        this.dataService.loaderValueChange(false);
      }).catch((error) => {
        console.log('search document error = ', error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        if (--this.count === 0) {
          this.getAggregationValues();
          // this.loading = false;
          this.dataService.loaderValueChange(false);
        }
      });
  }

  fetchNextPageResults(count, data: { primaryType: string, pageNumber: number }) {
    this.count = count;
    let queryParams;
    if(data.primaryType.toLowerCase() !== 'all') {
      queryParams = { currentPageIndex: data.pageNumber, offset: 0, pageSize: 40, system_primaryType_agg: `["${data.primaryType}"]` };
    } else {
      queryParams = { currentPageIndex: data.pageNumber, offset: 0, pageSize: 40 };
    }
    this.fetchApiResult(queryParams, true);
    return;
  }

  selectDocType(type) {
    if (type === "all") {
      delete this.filtersParams["system_primaryType_agg"];
    } else {
      this.filtersParams["system_primaryType_agg"] = [type];
    }
    this.searchDocuments(this.filtersParams);
  }

  cloneQueryParamsForPrimaryTypes(queryParams: any) {
    this.apiToHit.Picture = Object.assign({ 'system_primaryType_agg': 'Picture' }, queryParams);
    this.apiToHit.Video = Object.assign({ 'system_primaryType_agg': 'Video' }, queryParams);
    this.apiToHit.Audio = Object.assign({ 'system_primaryType_agg': 'Audio' }, queryParams);
    this.apiToHit.File = Object.assign({ 'system_primaryType_agg': 'File' }, queryParams);
    return;
  }

  getAggregationValues() {
    this.setUniqueBucketValues(this.documents);
    this.aggregationsMetaData = Object.assign({}, this.metaData);
    this.setTagsMetadata();
  }

  setUniqueBucketValues(primaryTypeData: any): void {
    this.metaData = Object.assign({}, primaryTypeData.aggregations);
  }

  setData(data: any, isShowMore: boolean) {
    if (this.firstCallResult) {
      this.resetResults();
    }
    this.resetTagsMetadata();
    if (isShowMore) this.documents.entries = new Object(this.documents.entries.concat(data.entries)); else this.documents = data;
  }

  getPrimeTypeByFilter(primaryType: string, queryParams: any): string[] {
    // TODO: add new primarytype/filetype here
    let videoIndex;
    let pictureIndex;
    let audioIndex;

    if (queryParams['system_mimetype_agg']) {
      const dataToIterate = JSON.parse(queryParams['system_mimetype_agg']);
      const mimeTypeValue = queryParams['system_mimetype_agg'];
      if (primaryType.toLowerCase() === constants.VIDEO_SMALL_CASE) {
        if (mimeTypeValue.toLowerCase().includes(constants.VIDEO_SMALL_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          let newMime = '';
          dataToIterate.map(mimeType => {
            if (mimeType.includes(constants.VIDEO_SMALL_CASE)) {
              newMime += `"${mimeType}",`;
            }
          });
          queryParams['system_mimetype_agg'] = `[${newMime.substr(0, newMime.length - 1)}]`;
        } else {
          queryParams['system_primaryType_agg'] = [];
        }
      }

      if (primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
        if (mimeTypeValue.toLowerCase().includes(constants.IMAGE_SMALL_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          let newMime = '';
          dataToIterate.map(mimeType => {
            if (mimeType.includes(constants.IMAGE_SMALL_CASE)) {
              newMime += `"${mimeType}",`;
            }
          });
          queryParams['system_mimetype_agg'] = `[${newMime.substr(0, newMime.length - 1)}]`;
        } else {
          queryParams['system_primaryType_agg'] = [];
        }
      }

      if (primaryType.toLowerCase() === constants.AUDIO_SMALL_CASE) {
        if (mimeTypeValue.toLowerCase().includes(constants.AUDIO_SMALL_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          let newMime = '';
          dataToIterate.map(mimeType => {
            if (mimeType.includes(constants.AUDIO_SMALL_CASE)) {
              newMime += `"${mimeType}",`;
            }
          });
          queryParams['system_mimetype_agg'] = `[${newMime.substr(0, newMime.length - 1)}]`;
        } else {
          queryParams['system_primaryType_agg'] = [];
        }
      }

      if (primaryType.toLowerCase() === constants.FILE_SMALL_CASE) {
        if (mimeTypeValue.toLowerCase().includes(constants.FILE_SMALL_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          let newMime = '';
          dataToIterate.map(mimeType => {
            if (mimeType.includes(constants.FILE_SMALL_CASE)) {
              newMime += `"${mimeType}",`;
            }
          });
          queryParams['system_mimetype_agg'] = `[${newMime.substr(0, newMime.length - 1)}]`;
        } else {
          queryParams['system_primaryType_agg'] = [];
        }
      }
    }


    if (queryParams['asset_width_agg'] || queryParams['asset_height_agg']) {

      if (primaryType.toLowerCase() === constants.VIDEO_SMALL_CASE) {
        if (queryParams['system_primaryType_agg'].includes(constants.VIDEO_TITLE_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        } else queryParams['system_primaryType_agg'] = [];
      }
      if (primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
        if (queryParams['system_primaryType_agg'].includes(constants.PICTURE_TITLE_CASE)) {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        } else queryParams['system_primaryType_agg'] = [];
      }
      if (primaryType.toLowerCase() === constants.AUDIO_SMALL_CASE) {
        queryParams['system_primaryType_agg'] = [];
      }
    }

    if (queryParams['video_duration_agg']) {
      if (primaryType.toLowerCase() === constants.VIDEO_SMALL_CASE) {
        if (queryParams['system_primaryType_agg']) {
          if (queryParams['system_primaryType_agg'].includes(constants.VIDEO_TITLE_CASE)) {
            queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          } else queryParams['system_primaryType_agg'] = [];
        } else {
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        }
      }
      if (primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
        // if (queryParams['system_primaryType_agg'].includes(constants.PICTURE_TITLE_CASE)) {
        //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        //   queryParams['video_duration_agg'] = `[]`;
        // } else {
        queryParams['system_primaryType_agg'] = [];
        // }
      }
      if (primaryType.toLowerCase() === constants.AUDIO_SMALL_CASE) {
        // if (queryParams['system_primaryType_agg'].includes(constants.AUDIO_TITLE_CASE)) {
        //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        //   queryParams['video_duration_agg'] = `[]`;
        // } else {
        queryParams['system_primaryType_agg'] = [];
        // }
      }
    }

    return queryParams;
  }

  resetResults() {
    // TODO: add new primarytype/filetype here
    this.firstCallResult = false;
    // this.images = { aggregations: {}, entries: [], resultsCount: 0 };
    // this.videos = { aggregations: {}, entries: [], resultsCount: 0 };
    // this.audio = { aggregations: {}, entries: [], resultsCount: 0 };
    this.documents = { aggregations: {}, entries: [], resultsCount: 0 };
  }

  setTagsMetadata(): void {
    this.tagsMetadata = this.metaData.system_tag_agg;
  }

  resetTagsMetadata() {
    this.metaData.system_tag_agg = { buckets: [], selection: [] }
  }

  resetAggregationsMetaData() {
    this.aggregationsMetaData = {
      system_primaryType_agg: { buckets: [], selection: [], extendedBuckets: [] },
      system_mimetype_agg: { buckets: [], selection: [] },
      asset_width_agg: { buckets: [], selection: [] },
      asset_height_agg: { buckets: [], selection: [] },
      video_duration_agg: { buckets: [], selection: [] },
      system_tag_agg: { buckets: [], selection: [] },
      dublincore_sector_agg: { buckets: [], selection: [] },
      dublincore_created_agg: { buckets: [], selection: [] }
    };
  }

  resetFilter() {
    const tmpFilters = Object.assign({}, this.filtersParams);
    const params = {};
    params['ecm_fulltext'] = tmpFilters['ecm_fulltext'] || '';
    params['highlight'] = tmpFilters['highlight'] || '';
    this.resetAggregationsMetaData();
    this.filters(params);
    this.advancedFilter.resetFilter();
  }

  openFilterModal(type) {
    this.advancedFilter.openModal(type);
  }

}
