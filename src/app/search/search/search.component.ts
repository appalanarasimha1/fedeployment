import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
// import { ApiService } from '../services/http.service';
import { SharedService } from "../../services/shared.service";
import { constants } from 'src/app/common/constant';

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
    'system_primaryType_agg': { buckets: [], selection: [] },
    'system_mimetype_agg': { buckets: [], selection: [] },
    'asset_width_agg': { buckets: [], selection: [] },
    'asset_height_agg': { buckets: [], selection: [] },
    'video_duration_agg': { buckets: [], selection: [] },
    'sectors': { buckets: [], selection: [] }
  };
  filtersParams = {};
  documentCount = {};
  pageShown = {
    'Picture': 0,
    'Video': 0,
    'Audio': 0
  };
  extra = 0;
  images: any = { aggregations: {}, entries: [], resultsCount: 0 };
  videos: any = { aggregations: {}, entries: [], resultsCount: 0 };
  audio: any = { aggregations: {}, entries: [], resultsCount: 0 };

  // TypeScript public modifiers
  constructor(
    public nuxeo: NuxeoService,
    private router: Router, private sharedService: SharedService,
  ) { }

  ngOnInit() {

    if (!this.nuxeo.nuxeoClient || !localStorage.getItem('token')) {
      this.sharedService.redirectToLogin();
      return;
    }
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
    const data = this.filtersParams;
    // console.log("filters are ", this.filtersParams)
    // let data = Object.assign(this.filtersParams || {}, this.searchValue);


    const headers = { 'enrichers-document': ['thumbnail', 'tags', 'favorites', 'audit', 'renditions'], 'fetch.document': 'properties', properties: '*', 'enrichers.user': 'userprofile' };
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
    this.hitSearchApi(queryParams, headers, pageNumber);



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

  hitSearchApi(queryParams: any, headers, pageNumber) {
    let primaryTypes = JSON.parse(queryParams['system_primaryType_agg'] || '[]');

    if (!primaryTypes.length) {
      primaryTypes = ['Picture', 'Video', 'Audio'];
    }

    primaryTypes = this.getPrimeTypeByFilter(primaryTypes, queryParams);
    let count = primaryTypes.length;
    this.resetResults();
    for (let i = 0; i < primaryTypes.length; i++) {
      queryParams['system_primaryType_agg'] = `["${primaryTypes[i]}"]`;
      this.loading = true;
      this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers })
        .get().then((docs) => {
          this.setData(docs, primaryTypes[i]);
          if (--count === 0) {
            this.getAggregationValues();
            this.loading = false;
          }
        }).catch((error) => {
          console.log('search document error = ', error);
          this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
          if (--count === 0) {
            this.getAggregationValues();
            this.loading = false;
          }
        });
    }
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

  setData(data: any, primaryType: string) {
    // TODO: add new primarytype/filetype here
    switch (primaryType.toLowerCase()) {
      case constants.VIDEO_SMALL_CASE:
        this.videos = data;
        break;
      case constants.AUDIO_SMALL_CASE:
        this.audio = data;
        break;
      case constants.PICTURE_SMALL_CASE:
        this.images = data;
        break;
    }
    return;
  }

  getPrimeTypeByFilter(primaryTypes: string[], queryParams: any): string[] {
    // TODO: add new primarytype/filetype here
    let dataToIterate;
    let videoIndex;
    let pictureIndex;
    let audioIndex;

    if (queryParams['system_mimetype_agg']) {
      if (typeof queryParams['system_mimetype_agg'] === 'string') {
        dataToIterate = JSON.parse(queryParams['system_mimetype_agg']);
      }
      dataToIterate.map((value: string) => {
        videoIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.VIDEO_SMALL_CASE));
        pictureIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.PICTURE_SMALL_CASE));
        audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));

        if (value.toLowerCase().includes(constants.VIDEO_SMALL_CASE)) {
          if(pictureIndex !== -1) primaryTypes.splice(pictureIndex, 1);
          audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));
          if(audioIndex !== -1) primaryTypes.splice(audioIndex, 1);
        } else if (value.toLowerCase().includes(constants.PICTURE_SMALL_CASE)) {
          if(videoIndex !== -1) primaryTypes.splice(videoIndex, 1);
          audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));
          if(audioIndex !== -1) primaryTypes.splice(audioIndex, 1);
        } else if (value.toLowerCase().includes(constants.AUDIO_SMALL_CASE)) {
          if(pictureIndex !== -1) primaryTypes.splice(pictureIndex, 1);
          videoIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.VIDEO_SMALL_CASE));
          if(videoIndex !== -1) primaryTypes.splice(videoIndex, 1);
        }
      });
    }

    if (queryParams['asset_width_agg'] || queryParams['asset_height_agg']) {
      audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));
      primaryTypes.splice(audioIndex, 1);
    }

    if (queryParams['video_duration_agg'] && (pictureIndex !== -1 || audioIndex !== -1)) {
      pictureIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.PICTURE_SMALL_CASE));
      primaryTypes.splice(pictureIndex, 1);
      audioIndex = primaryTypes.findIndex((item: any) => item.toLowerCase().includes(constants.AUDIO_SMALL_CASE));
      primaryTypes.splice(audioIndex, 1);
    }

    return primaryTypes;
  }

  resetResults() {
    // TODO: add new primarytype/filetype here
    this.images = { aggregations: {}, entries: [], resultsCount: 0 };
    this.videos = { aggregations: {}, entries: [], resultsCount: 0 };
    this.audio = { aggregations: {}, entries: [], resultsCount: 0 };
  }

  async callRequestByFilterType(filterType, queryParams, headers, pageNumber?: any) {



  }

}
