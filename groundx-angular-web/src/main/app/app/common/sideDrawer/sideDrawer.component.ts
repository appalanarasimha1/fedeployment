import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NuxeoService } from '../../services/nuxeo.service';
import { IHeaderSearchCriteria } from '../subHeader/interface';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './sideDrawer.component.html',
  styleUrls: ['./sideDrawer.component.css']
})
export class SideDrawerComponent implements OnInit {

  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  sectors = undefined;
  loading = false;
  error = undefined;
  metaData = {system_primaryType_agg: {extendedBuckets: []}};
  private searchCriteria: {quickFilters?: string, system_primaryType_agg?: string[]} = {system_primaryType_agg: []};

  constructor(private nuxeo: NuxeoService) { }

  ngOnInit(): void {
    this.getSectors();
    this.getMetaData();
  }

  getSectors() {
    this.loading = true;
    this.error = undefined;
    this.sectors = undefined;
    let queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, queryParams: '00000000-0000-0000-0000-000000000000' };

    this.nuxeo.request('/search/pp/tree_children/execute', { queryParams: queryParams })
      .get().then((docs) => {
        this.sectors = docs.entries;
        this.loading = false;
      }).catch((error) => {
        console.log(error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });
  }

  getMetaData() {
    this.loading = true;
    this.error = undefined;
    this.sectors = undefined;
    let queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, system_primaryType_agg: '[]', system_mimetype_agg: '[]', asset_width_agg: '[]', asset_height_agg: '[]', color_profile_agg: '[]', color_depth_agg: '[]', video_duration_agg: '[]' };

    this.nuxeo.request('/search/pp/assets_search/execute', { queryParams: queryParams })
      .get().then((result) => {
        this.metaData = result.aggregations;
        this.loading = false;
      }).catch((error) => {
        console.log(error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });
  }

  dropdownMenu(event: any): void {
    let sortBy = event.target.value;
    if(sortBy) {
      this.searchCriteria['sortBy'] = sortBy;
      this.searchCriteria['sortOrder'] = 'asc';
    } else {
      delete this.searchCriteria['sortBy'];
      delete this.searchCriteria['sortOrder']
    }
    this.emitData(this.searchCriteria);
  }

  emitData(data: any): void {
    this.searchTextOutput.emit(data);
    return;
  }

  selectDoctype(docType: string): void {
    let index = this.searchCriteria['system_primaryType_agg'].indexOf(docType);
    index > -1 ? this.searchCriteria['system_primaryType_agg'].splice(index, 1) : this.searchCriteria['system_primaryType_agg'].push(docType);
    this.emitData(this.searchCriteria);
    return;
  }

  createQuery(value: string) {
    if(value === 'recent') {
      this.searchCriteria['quickFilters'] = 'mostRecent';
    } else {
      delete this.searchCriteria['quickFilters'];
    }
  }

  openNav() {
    document.getElementById("main-sidebar").style.width = "270px";
    document.getElementById("main").classList.toggle('shiftFilter');
    document.getElementById("main-sidebar").classList.toggle("closeBtn");

  }
}
