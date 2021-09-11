import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';
// import { ApiService } from '../services/http.service';

@Component({
  selector: 'app-search',
  styleUrls: ['./search.component.css'],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  searchValue = '';
  documents = undefined;
  loading = false;
  error = undefined;
  metaData = {};

  // TypeScript public modifiers
  constructor(public nuxeo: NuxeoService) { }

  ngOnInit() {
    // this.connectToNuxeo();
  }

  connectToNuxeo() {
    // this.nuxeo.nuxeoClientConnect();
  }

  searchDocuments(data: IHeaderSearchCriteria) {
    this.loading = true;
    this.error = undefined;
    this.documents = undefined;
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

    this.nuxeo.nuxeoClient.request('/search/pp/assets_search/execute', { queryParams, headers: { 'enrichers-document': 'thumbnail' } })
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
        console.log(error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });
  }

}
