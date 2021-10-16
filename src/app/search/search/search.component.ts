import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
// import { ApiService } from '../services/http.service';
import { SharedService } from '../../services/shared.service';
import { constants } from 'src/app/common/constant';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-search',
  styleUrls: ['./search.component.css'],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  searchValue: IHeaderSearchCriteria = { ecm_fulltext: '', highlight: '' };
  documents = undefined;
  loading = false;
  error = undefined;
  metaData = {
    system_primaryType_agg: { buckets: [], selection: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [], selection: [] },
    asset_height_agg: { buckets: [], selection: [] },
    video_duration_agg: { buckets: [], selection: [] },
    sectors: { buckets: [], selection: [] },
    system_tag_agg: { buckets: [], selection: [] }
  };
  aggregationsMetaData;
  filtersParams = {};
  documentCount = {};
  // pageShown = {
  //   'Picture': 0,
  //   'Video': 0,
  //   'Audio': 0
  // };
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
    // if (this.extra === 0) {
    this.searchValue = data;

    this.searchDocuments(data);
    // this.extra = this.extra + 1
    // }
  }

  // sectorList(data: string[]) {
  //   this.sectors = data;
  // }

  filters(data: IHeaderSearchCriteria) {
    // if (this.extra === 0) {
    //   console.log("in filters")

    this.filtersParams = data;
    this.searchDocuments(data);
    //   this.extra = this.extra + 1

    // }
  }

  searchDocuments(dataParam: IHeaderSearchCriteria, pageNumber?: any) {

    this.error = undefined;
    //  this.documents = undefined;
    this.filtersParams['ecm_fulltext'] = this.searchValue.ecm_fulltext || '';
    this.filtersParams['highlight'] = this.searchValue.highlight || '';
    this.filtersParams['sortBy'] = dataParam['sortBy'] || '';
    this.filtersParams['sortOrder'] = dataParam['sortOrder'] || '';
    const data = this.filtersParams;
    // console.log("filters are ", this.filtersParams)
    // let data = Object.assign(this.filtersParams || {}, this.searchValue);


    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40 }; //, sectors: `["Sport"]`
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
    if (queryParams['sectors'] !== undefined) {
      if (queryParams['sectors'] === '[""]') {
        delete queryParams['sectors']

      }
    }
    this.hitSearchApi(queryParams, pageNumber);



    // this.callRequestByFilterType(queryParams['system_primaryType_agg'], queryParams, headers, pageNumber);



    // this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers } )
    //   .get(
    //     //       {
    //     //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
    //     // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
    //     //  ,{
    //     //       enrichers: {'document': ['thumbnail']}
    //     //     }
    //   ).then((docs) => {
    //     this.documents = docs.entries;
    //     this.metaData = docs.aggregations;
    //     console.log(docs.entries[0]);
    //     this.loading = false;
    //   }).catch((error) => {
    //     console.log('search document error = ', error);
    //     this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
    //     this.loading = false;
    //   });
  }

  hitSearchApi(queryParams: any, pageNumber) {
    let primaryTypes = JSON.parse(queryParams['system_primaryType_agg'] || '[]');

    if (!primaryTypes.length) {
      primaryTypes = ['Picture', 'Video', 'Audio', 'File'];
    }
    // this.resetResults();
    this.cloneQueryParamsForPrimaryTypes(queryParams);
    this.count = 0; // if new primary type comes up then add +1 here
    this.firstCallResult = true;
    // tslint:disable-next-line:forin
    for (const primaryType in this.apiToHit) {
      this.apiToHit[primaryType] = this.getPrimeTypeByFilter(primaryType, this.apiToHit[primaryType]);
      if (this.apiToHit[primaryType].system_primaryType_agg.indexOf(primaryType) === -1) {
        this.apiToHit[primaryType] = {};
      } else {
        this.apiToHit[primaryType].system_primaryType_agg = `["${primaryType}"]`;
        ++this.count;
      }
    }
    // primaryTypes = this.getPrimeTypeByFilter(primaryTypes, queryParams);
    // let count = primaryTypes.length;

    for (const primaryType in this.apiToHit) {
      if (!Object.keys(this.apiToHit[primaryType]).length) {
        continue;
      }
      const data = { queryParams: this.apiToHit[primaryType], primaryType };
      this.fetchApiResult(data);
    }
  }

  fetchApiResult(data: { primaryType: string, queryParams: any }, isShowMore: boolean = false) {
    const headers = { 'enrichers-document': ['thumbnail', 'tags', 'favorites', 'audit', 'renditions', 'preview'], 'fetch.document': 'properties', properties: '*', 'enrichers.user': 'userprofile' };
    // this.loading = true;
    this.dataService.loaderValueChange(true);
    const url = data.primaryType.toLowerCase() !== 'file' ? apiRoutes.SEARCH_PP_ASSETS : apiRoutes.DEFAULT_SEARCH;
    this.nuxeo.nuxeoClient.request(url, { queryParams: data.queryParams, headers })
      .get().then((docs) => {
        this.setData(docs, data.primaryType, isShowMore);
        if (--this.count === 0) {
          this.getAggregationValues();
          this.dataService.loaderValueChange(false);
          // this.loading = false;
        }
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
    const queryParams = Object.assign(this.apiToHit[data.primaryType], { currentPageIndex: data.pageNumber, offset: 0, pageSize: 40 });
    this.fetchApiResult({ primaryType: data.primaryType, queryParams }, true);
    return;
  }

  cloneQueryParamsForPrimaryTypes(queryParams: any) {
    this.apiToHit.Picture = Object.assign({ 'system_primaryType_agg': 'Picture' }, queryParams);
    this.apiToHit.Video = Object.assign({ 'system_primaryType_agg': 'Video' }, queryParams);
    this.apiToHit.Audio = Object.assign({ 'system_primaryType_agg': 'Audio' }, queryParams);
    this.apiToHit.File = Object.assign({ 'system_primaryType_agg': 'File' }, queryParams);
    return;
  }

  getAggregationValues() {
    // TODO: add new primarytype/filetype here
    if (Object.keys(this.images.aggregations).length) {
      this.setUniqueBucketValues(this.images);
    }
    if (Object.keys(this.videos.aggregations).length) {
      this.setUniqueBucketValues(this.videos);
    }
    if (Object.keys(this.audio.aggregations).length) {
      this.setUniqueBucketValues(this.audio);
    }
    if (Object.keys(this.files.aggregations).length) {
      this.setUniqueBucketValues(this.files);
    }
    this.aggregationsMetaData = Object.assign({}, this.metaData);
    this.setTagsMetadata();
  }

  setUniqueBucketValues(primaryTypeData: any): void {
    for (const filter in primaryTypeData.aggregations) {
      if (this.metaData[filter] && !this.sharedService.isEmpty(filter)) {
        const dataToIterate = primaryTypeData.aggregations[filter].buckets;
        for (let i = 0; i < dataToIterate.length; i++) {
          const index = this.metaData[filter].buckets.findIndex(item => item.key === dataToIterate[i].key);
          if (index === -1) {
            this.metaData[filter].buckets.push(dataToIterate[i]);
            // primaryTypeData.aggregations['system_primaryType_agg'].buckets.map(item => this.metaData.system_primaryType_agg.buckets.push(item));
            // this.metaData.system_primaryType_agg.buckets = [...new Set()]
          }
        }
      }
    }
  }

  setData(data: any, primaryType: string, isShowMore: boolean) {
    // TODO: add new primarytype/filetype here
    // tslint:disable-next-line:no-unused-expression
    if (this.firstCallResult) {
      this.resetResults();
    }
    this.resetTagsMetadata();
    switch (primaryType.toLowerCase()) {
      case constants.VIDEO_SMALL_CASE:
        if (isShowMore) this.videos.entries = new Object(this.videos.entries.concat(data.entries)); else this.videos = data;
        break;
      case constants.AUDIO_SMALL_CASE:
        if (isShowMore) this.audio.entries = new Object(this.audio.entries.concat(data.entries)); else this.audio = data;
        break;
      case constants.PICTURE_SMALL_CASE:
        if (isShowMore) this.images.entries = new Object(this.images.entries.concat(data.entries)); else this.images = data;
        break;
      case constants.FILE_SMALL_CASE:
        if (isShowMore) this.files.entries = new Object(this.files.entries.concat(data.entries)); else this.files = data;
        break;
    }
    return;
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
          // if (dataToIterate.indexOf(constants.VIDEO_SMALL_CASE) > -1) {
          //   const index = queryParams['system_primaryType_agg'].findIndex(item => item === primaryType);
          //   queryParams['system_primaryType_agg'].splice(index, 1);
          // }
          queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          let newMime = '';
          dataToIterate.map(mimeType => {
            if (mimeType.includes(constants.VIDEO_SMALL_CASE)) {
              newMime += `"${mimeType}",`;
            }
          });
          queryParams['system_mimetype_agg'] = `[${newMime.substr(0, newMime.length - 1)}]`;
        } else {
          // if (queryParams['system_primaryType_agg'].includes(constants.VIDEO_TITLE_CASE)) {
          //   queryParams['system_mimetype_agg'] = `[]`;
          //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          // } else {
          queryParams['system_primaryType_agg'] = [];
          // }
        }
      }

      if (primaryType.toLowerCase() === constants.PICTURE_SMALL_CASE) {
        // if(dataToIterate.indexOf(constants.PICTURE_TITLE_CASE) > -1) {
        //   const index = queryParams['system_primaryType_agg'].findIndex(item => item === primaryType);
        //   queryParams['system_primaryType_agg'].splice(index, 1);
        // }
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
          // if (queryParams['system_primaryType_agg'].includes(constants.PICTURE_TITLE_CASE)) {
          //   queryParams['system_mimetype_agg'] = `[]`;
          //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          // } else {
          queryParams['system_primaryType_agg'] = [];
          // }
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
          // if (queryParams['system_primaryType_agg'].includes(constants.AUDIO_TITLE_CASE)) {
          //   queryParams['system_mimetype_agg'] = `[]`;
          //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
          // } else {
          queryParams['system_primaryType_agg'] = [];
          // }
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
      // audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));
      // if (primaryTypes.indexOf(constants.AUDIO_TITLE_CASE) !== -1) queryParams['system_primaryType_agg'].splice(audioIndex, 1);

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
        // if (queryParams['system_primaryType_agg'].includes(constants.AUDIO_TITLE_CASE)) {
        //   queryParams['system_primaryType_agg'] = `['${primaryType}']`;
        //   queryParams['asset_width_agg'] = `[]`;
        //   queryParams['asset_height_agg'] = `[]`;
        // } else {
        queryParams['system_primaryType_agg'] = [];
        // }
      }
      // else {
      //   queryParams['system_primaryType_agg'] = [];
      // }
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
    this.images = { aggregations: {}, entries: [], resultsCount: 0 };
    this.videos = { aggregations: {}, entries: [], resultsCount: 0 };
    this.audio = { aggregations: {}, entries: [], resultsCount: 0 };
    this.files = { aggregations: {}, entries: [], resultsCount: 0 };
  }

  setTagsMetadata(): void {
    this.tagsMetadata = this.metaData.system_tag_agg;
  }

  resetTagsMetadata() {
    this.metaData.system_tag_agg = { buckets: [], selection: [] }
  }

  resetAggregationsMetaData() {
    this.aggregationsMetaData = {
      system_primaryType_agg: { buckets: [], selection: [] },
      system_mimetype_agg: { buckets: [], selection: [] },
      asset_width_agg: { buckets: [], selection: [] },
      asset_height_agg: { buckets: [], selection: [] },
      video_duration_agg: { buckets: [], selection: [] },
      sectors: { buckets: [], selection: [] },
      system_tag_agg: { buckets: [], selection: [] }
    };
  }

  resetFilter() {
    const tmpFilters = Object.assign({}, this.filtersParams);
    const params = {};
    params['ecm_fulltext'] = tmpFilters['ecm_fulltext'] || '';
    params['highlight'] = tmpFilters['highlight'] || '';
    this.resetAggregationsMetaData();
    this.filters(params);
  }

}
