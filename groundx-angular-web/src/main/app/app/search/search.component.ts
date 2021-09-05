import { Component } from '@angular/core';
import { Document } from './document';
import { SubHeaderComponent } from '../common/subHeader/subHeader.component';
import { SideDrawerComponent } from '../common/sideDrawer/sideDrawer.component';
import { NuxeoService } from '../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../common/subHeader/interface';
// import { ApiService } from '../services/http.service';

@Component({
  selector: 'app-search',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './search.style.css' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './search.template.html',
  directives: [SubHeaderComponent, SideDrawerComponent, Document],
  // providers: [ApiService]
})
export class Search {
  searchValue = '';
  documents = undefined;
  loading = false;
  error = undefined;
  metaData = {};

  // TypeScript public modifiers
  constructor(public nuxeo: NuxeoService) {}

  searchDocuments(data: IHeaderSearchCriteria) {
    this.loading = true;
    this.error = undefined;
    this.documents = undefined;
    let queryParams = Object.assign({currentPageIndex: 0, offset: 0, pageSize: 40});
    for(let key in data) {
      if(typeof data[key] !== 'string' && typeof data[key] !== 'number') {
        data[key].map((item: string) => {
          if(queryParams[key])
            queryParams[key] = queryParams[key].split(']')[0]+`,"${item.toString()}"]`;
          else queryParams[key] = `["${item.toString()}"]`;
        })
      } else {
        queryParams[key] = data[key];
      }
    }

    this.nuxeo.request('/search/pp/assets_search/execute', {queryParams: queryParams, headers: {'enrichers-document': 'thumbnail'}})
    .get(
//       {
//       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
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
