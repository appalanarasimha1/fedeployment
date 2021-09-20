import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
import { Router } from '@angular/router';
import { apiRoutes } from 'src/app/common/config';
// import { ApiService } from '../services/http.service';

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

  // TypeScript public modifiers
  constructor(
    public nuxeo: NuxeoService,
    private router: Router
    ) { }

  ngOnInit() {

    if(!this.nuxeo.nuxeoClient) {
      this.router.navigate(['login']);
      return;
    }
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

  searchDocuments(dataParam: IHeaderSearchCriteria) {
    this.loading = true;
    this.error = undefined;
    this.documents = undefined;
    this.filtersParams['ecm_fulltext'] = this.searchValue.ecm_fulltext || '';
    this.filtersParams['highlight'] = this.searchValue.highlight || '';
    const data = this.filtersParams;
    // let data = Object.assign(this.filtersParams || {}, this.searchValue);
    const headers = { 'enrichers-document': ['thumbnail', 'tags', 'favorites', 'audit', 'renditions'], 'fetch.document': 'properties', properties: '*', 'enrichers.user': 'userprofile' };
    const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40}; //, sectors: `["Sport"]`
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

    this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams, headers } )
      .get(
        //       {
        //       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or
        // dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
        //  ,{
        //       enrichers: {'document': ['thumbnail']}
        //     }
      ).then((docs) => {
        this.documents = docs.entries;
        this.metaData = docs.aggregations;
        console.log(docs.entries[0]);
        this.loading = false;
      }).catch((error) => {
        console.log('search document error = ', error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });
  }

}
