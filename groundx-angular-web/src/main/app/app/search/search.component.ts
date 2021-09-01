import { Component } from '@angular/core';
import { Document } from './document';
import { NuxeoService } from '../services/nuxeo.service';
import { SubHeaderComponent } from '../common/subHeader/subHeader.component';
import { SideDrawerComponent } from '../common/sideDrawer/sideDrawer.component';
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

  // TypeScript public modifiers
  constructor(public nuxeo: NuxeoService) { //, public http: ApiService

  }

  searchDocuments(value: String) {
    console.log('Search: ' + value);

    this.loading = true;
    this.error = undefined;
    this.documents = undefined;

    this.nuxeo.request('/search/pp/assets_search/execute')
    .get({asset_height_agg: []}
//       {
//       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
//  ,{
//       enrichers: {'document': ['thumbnail']}
//     }
    ).then((docs) => {
      this.documents = docs.entries;
      console.log(docs.entries[0]);
      this.loading = false;
    }).catch((error) => {
      console.log(error);
      this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
      this.loading = false;
    });

    // this.http.get('/search/pp/assets_search/execute?currentPageIndex=1&offset=0&pageSize=50&system_primaryType_agg=%5B%5D&system_mimetype_agg=%5B%5D&asset_width_agg=%5B%5D&asset_height_agg=%5B%5D&color_profile_agg=%5B%5D&color_depth_agg=%5B%5D&video_duration_agg=%5B%5D')
    // .subscribe((docs: any) => {
    //   this.documents = docs.entries;
    //   console.log(docs.entries[0]);
    //   this.loading = false;
    // });
    // .catch((error) => {
    //   console.log(error);
    //   this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
    //   this.loading = false;
    // });
  }

}
