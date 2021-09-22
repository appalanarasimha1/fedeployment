import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
// import { ApiService } from '../services/http.service';
import {SharedService} from "../../services/shared.service";

@Component({
  selector: 'app-search',
  styleUrls: ['./search.component.css'],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  searchValue: IHeaderSearchCriteria = {ecm_fulltext: '', highlight: ''};
  documents = undefined;
  loading = false;
  error = undefined;
  metaData = {};
  filtersParams = {};
  documentCount={};
  pageShown={
    'Picture':0,
    'Video':0,
    'Audio':0
  };
extra=0;

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
      if(this.extra===0) {
          this.searchValue = data;

          this.searchDocuments(data);
          this.extra=this.extra+1
      }
  }

  filters(data: IHeaderSearchCriteria) {
      if(this.extra===0) {
          console.log("in filters")

          this.filtersParams = data;
          this.searchDocuments(data);
          this.extra=this.extra+1

      }
  }

  searchDocuments(dataParam: IHeaderSearchCriteria, pageNumber?:any) {


    this.loading = true;
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
   console.log(queryParams['system_primaryType_agg'])


        this.callRequestByFilterType(queryParams['system_primaryType_agg'], queryParams, headers,pageNumber)



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
   async callRequestByFilterType(filterType, queryParams,headers,pageNumber?:any){

    console.log("pagenumber",pageNumber);

     let localdoc=[];
     let localmetaData=[];
    localdoc[0]=[]
     if(filterType===''||filterType===undefined){
   filterType='["Picture","Video","Audio"]'
     }


    //  queryParams['system_primaryType_agg']=[];

    if(filterType.includes('Picture')){
      if(pageNumber!==undefined) {
        if (pageNumber['Picture'] === 1) {
          this.pageShown['Picture'] = this.pageShown['Picture'] + 1
          queryParams.currentPageIndex = this.pageShown['Picture']
          queryParams.offset = this.pageShown['Picture']//, sectors: `["Sport"]`
        }
      }


      queryParams['system_primaryType_agg']='["Picture"]';
     // console.log(filterType)
      //console.log(queryParams['system_primaryType_agg'])
       await this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers } ) .get(
          //       {
          //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
          // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
          //  ,{
          //       enrichers: {'document': ['thumbnail']}
          //     }

        //       {
        //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
        // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
        //  ,{
        //       enrichers: {'document': ['thumbnail']}
        //     }
      ).then((docs) => {
        localdoc[0].push(docs.entries)
           this.documentCount['Picture']=docs.resultsCount
       // this.documents.push( docs.entries);
         localmetaData.push(docs.aggregations)
       // this.metaData = docs.aggregations;
       // console.log(this.metaData);
        this.loading = false;
      }).catch((error) => {
        console.log('search document error = ', error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        if (error && error.message) {
          if (error.message.toLowerCase() === 'unauthorized') {
            this.sharedService.redirectToLogin();
          }
        }
        this.loading = false;
      });
    }
    if(filterType.includes('Video')){
      if(pageNumber!==undefined) {
        if (pageNumber['Video'] === 1) {
          this.pageShown['Video'] = this.pageShown['Video'] + 1
          queryParams.currentPageIndex = this.pageShown['Video']
          queryParams.offset = this.pageShown['Video']//, sectors: `["Sport"]`
        }
      }
      queryParams['system_primaryType_agg']='["Video"]';
      console.log(filterType)
      console.log(queryParams['system_primaryType_agg'])
       await this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers } ) .get(
          //       {
          //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
          // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
          //  ,{
          //       enrichers: {'document': ['thumbnail']}
          //     }
      ).then((docs) => {
        localdoc[0].push(docs.entries);
        localmetaData.push(docs.aggregations);
        this.documentCount['Video']=docs.resultsCount;
       // this.documents = docs.entries;
       // this.metaData = docs.aggregations;
        console.log(this.documents);
        this.loading = false;
      }).catch((error) => {
        console.log('search document error = ', error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });

    }
     if(filterType.includes('Audio')){
       if(pageNumber!==undefined) {
         if (pageNumber['Audio'] === 1) {
           this.pageShown['Video'] = this.pageShown['Audio'] + 1
           queryParams.currentPageIndex = this.pageShown['Audio']
           queryParams.offset = this.pageShown['Audio']//, sectors: `["Sport"]`
         }
       }
       queryParams['system_primaryType_agg']='["Video"]';
       console.log(filterType)
       console.log(queryParams['system_primaryType_agg'])
       await this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers } ) .get(
           //       {
           //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
           // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
           //  ,{
           //       enrichers: {'document': ['thumbnail']}
           //     }
       ).then((docs) => {
         localdoc[0].push(docs.entries)
         localmetaData.push(docs.aggregations)
           this.documentCount['Audio']=docs.resultsCount
         // this.documents = docs.entries;
         // this.metaData = docs.aggregations;
         console.log(this.documents);
         this.loading = false;
       }).catch((error) => {
         console.log('search document error = ', error);
         this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
         this.loading = false;
       });

     }
    // console.log("after docs")
     //console.log(localdoc[0])

     for(let i=0;i<localdoc[0].length;i++){
       console.log(this.documents)
       if(this.documents===undefined){
         console.log('others')
            this.documents = localdoc[0][0]
            this.metaData=localmetaData[0]
       }
     else {
         // if(i===0) {
         //
         //   this.documents = this.documents.concat(localdoc[0][i])
         //   this.metaData=localmetaData[0]
         // }
         // else{
         this.documents = this.documents.concat(localdoc[0][i])
         //this.metaData['system_primaryType_agg']['buckets']=this.metaData['system_primaryType_agg']['buckets'].concat(localmetaData[i]['system_primaryType_agg']['buckets'])
         this.metaData['system_mimetype_agg']['buckets'] = this.metaData['system_mimetype_agg']['buckets'].concat(localmetaData[i]['system_mimetype_agg']['buckets'])
         this.metaData['system_mimetype_agg']['selection'] = this.metaData['system_mimetype_agg']['selection'].concat(localmetaData[i]['system_mimetype_agg']['selection'])
         this.metaData['asset_width_agg']['buckets'] = this.metaData['asset_width_agg']['buckets'].concat(localmetaData[i]['asset_width_agg']['buckets'])
         this.metaData['asset_height_agg']['buckets'] = this.metaData['asset_height_agg']['buckets'].concat(localmetaData[i]['asset_height_agg']['buckets'])
         this.metaData['video_duration_agg']['buckets'] = this.metaData['video_duration_agg']['buckets'].concat(localmetaData[i]['video_duration_agg']['buckets'])
         this.metaData['sectors']['buckets'] = this.metaData['sectors']['buckets'].concat(localmetaData[i]['sectors']['buckets'])
       }
       //}
     }
    console.log( this.documents);
     this.extra=0





  }

}
