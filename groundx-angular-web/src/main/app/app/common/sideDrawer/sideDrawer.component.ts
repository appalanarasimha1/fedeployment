import { Component, OnInit } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../subHeader/interface';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './sideDrawer.component.html',
  styleUrls: ['./sideDrawer.component.css']
})
export class SideDrawerComponent implements OnInit {

  sectors = undefined;
  loading = false;
  error = undefined;

  constructor(private nuxeo: NuxeoService) {}

  ngOnInit(): void {
    this.getSectors();
  }

  getSectors() {
    this.loading = true;
    this.error = undefined;
    this.sectors = undefined;
    let queryParams = {currentPageIndex: 0, offset: 0, pageSize: 40, queryParams: '00000000-0000-0000-0000-000000000000'};

    this.nuxeo.request('/search/pp/tree_children/execute', {queryParams: queryParams})
    .get(
//       {
//       // query: `Select * from Document where ecm:fulltext LIKE '${value}' or dc:title LIKE '%${value}%' and ecm:isProxy = 0 and ecm:currentLifeCycleState <> 'deleted'`
//  ,{
//       enrichers: {'document': ['thumbnail']}
//     }
    ).then((docs) => {
      this.sectors = docs.entries;
      this.loading = false;
    }).catch((error) => {
      console.log(error);
      this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
      this.loading = false;
    });
  
  }
openNav() {
    document.getElementById("main-sidebar").style.width = "270px";
    document.getElementById("main").classList.toggle('shiftFilter');
  document.getElementById("main-sidebar").classList.toggle("closeBtn");

  }
}
