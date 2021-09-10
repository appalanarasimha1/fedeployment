import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { IHeaderSearchCriteria } from './interface';
import { constants } from '../constant';
import { NuxeoService } from '../../services/nuxeo.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({

  selector: 'app-side-drawer',
  templateUrl: './sideDrawer.component.html',
  styleUrls: ['./sideDrawer.component.css'],

})
export class SideDrawerComponent implements OnInit, OnChanges {

  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @Input() inputMetaData = {
    system_primaryType_agg: { buckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] }, asset_height_agg: { buckets: [] }, video_duration_agg: { buckets: [] }
  };
  metaData = {
    system_primaryType_agg: { buckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] }, asset_height_agg: { buckets: [] },
    video_duration_agg: { buckets: [] }
  };
  sectors = undefined;
  loading = false;
  error = undefined;
  private searchCriteria: {
    quickFilters?: string,
    system_primaryType_agg?: string[],
    system_mimetype_agg?: string[],
    asset_width_agg: string[],
    asset_height_agg: string[],
    video_duration_agg: string[]
  } = {
      system_primaryType_agg: [],
      system_mimetype_agg: [],
      asset_width_agg: [],
      asset_height_agg: [],
      video_duration_agg: []
    };
  modifiedDate = { dc_modified_agg: [] };
  showImageSize = true;
  showVideoSize = true;
  productsSelectedItems;


  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};
  constructor(private nuxeo: NuxeoService) {


   }

  ngOnInit(): void {
    this.getSectors();
    this.getMetaData();
    this.dropdownList = [
      { item_id: 1, item_text: 'Mumbai' },
      { item_id: 2, item_text: 'Bangaluru' },
      { item_id: 3, item_text: 'Pune' },
      { item_id: 4, item_text: 'Navsari' },
      { item_id: 5, item_text: 'New Delhi' }
    ];
    this.selectedItems = [
      { item_id: 3, item_text: 'Pune' },
      { item_id: 4, item_text: 'Navsari' }
    ];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };
    // this.nuxeo.nuxeoClientConnect();
  }
  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }

  ngOnChanges(changes: any): void {
    if (Object.keys(changes.inputMetaData.currentValue).length) {
      this.metaData = this.inputMetaData;
      this.checkSelectedPrimeAndMimeType(this.metaData);
    }
  }

  getSectors() {
    this.loading = true;
    this.error = undefined;
    this.sectors = undefined;
    let queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, queryParams: '00000000-0000-0000-0000-000000000000' };

    this.nuxeo.nuxeoClient.request('/search/pp/tree_children/execute', { queryParams: queryParams })
      .get().then((docs) => {
        this.sectors = docs.entries;
        if (docs.aggregations) {
          this.metaData = docs.aggregations;
          this.checkSelectedPrimeAndMimeType(docs.aggregations);
        }
        this.loading = false;
      }).catch((error) => {
        console.log(error);
        this.error = `${error}. Ensure Nuxeo is running on port 8080.`;
        this.loading = false;
      });
  }

  checkSelectedPrimeAndMimeType(metaData: any) {
    if (metaData.system_primaryType_agg.selection.indexOf(constants.AUDIO_TITLE_CASE) != -1 
    || this.checkMimeSelection(constants.AUDIO_SMALL_CASE)) {
      this.showImageSize = false;
      this.showVideoSize = false;
      return;
    } else if (metaData.system_primaryType_agg.selection.indexOf(constants.IMAGE_TITLE_CASE) != -1 
    || this.checkMimeSelection(constants.IMAGE_SMALL_CASE)) {
      this.showImageSize = true;
      this.showVideoSize = false;
      return;
    }
    this.showImageSize = true;
    this.showVideoSize = true;
    return;
  }

  checkMimeSelection(checkString: string) {
    let flag = false;
    this.metaData.system_mimetype_agg.selection.map(item => {
      if (item.split('/')[0].toLowerCase() == checkString) {
        flag = true;
      }
    });
    return flag;
  }

  getMetaData() {
    this.loading = true;
    this.error = undefined;
    this.sectors = undefined;
    let queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, system_primaryType_agg: '[]', system_mimetype_agg: '[]', asset_width_agg: '[]', asset_height_agg: '[]', color_profile_agg: '[]', color_depth_agg: '[]', video_duration_agg: '[]' };

    this.nuxeo.nuxeoClient.request('/search/pp/assets_search/execute', { queryParams: queryParams })
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
    if (sortBy) {
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

  selectSector(event: any) {
    return event.target.outerText;
  }

  selectDoctype(event: any): void {
    let docType = event.target.textContent;
    let index = this.searchCriteria['system_primaryType_agg'].indexOf(docType);
    index > -1 ? this.searchCriteria['system_primaryType_agg'].splice(index, 1) : this.searchCriteria['system_primaryType_agg'].push(docType);
    this.emitData(this.searchCriteria);
    return;
  }

  createQuery(value: string) {
    if (value === 'recent') {
      this.searchCriteria['quickFilters'] = 'mostRecent';
    } else {
      delete this.searchCriteria['quickFilters'];
    }
    this.emitData(this.searchCriteria);
  }

  selectMimeType(event: any) {
    let mimeType = event.target.textContent;
    let index = this.searchCriteria['system_mimetype_agg'].indexOf(mimeType);
    index > -1 ? this.searchCriteria['system_mimetype_agg'].splice(index, 1) : this.searchCriteria['system_mimetype_agg'].push(mimeType);
    this.emitData(this.searchCriteria);
    return;
  }

  selectWidth(event: any) {
    let width = event.target.textContent;
    if (width.trim().toLowerCase() === 'all') {
      this.searchCriteria['asset_width_agg'] = [];
    } else {
      let index = this.searchCriteria['asset_width_agg'].indexOf(width);
      index > -1 ? this.searchCriteria['asset_width_agg'].splice(index, 1) : this.searchCriteria['asset_width_agg'].push(width);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  selectHeight(event: any) {
    let height = event.target.textContent;
    if (height.trim().toLowerCase() === 'all') {
      this.searchCriteria['asset_height_agg'] = [];
    } else {
      let index = this.searchCriteria['asset_height_agg'].indexOf(height);
      index > -1 ? this.searchCriteria['asset_height_agg'].splice(index, 1) : this.searchCriteria['asset_height_agg'].push(height);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  selectVieoDuration(event: any) {
    let height = event.target.textContent;
    if (height.trim().toLowerCase() === 'all') {
      this.searchCriteria['video_duration_agg'] = [];
    } else {
      let index = this.searchCriteria['video_duration_agg'].indexOf(height);
      index > -1 ? this.searchCriteria['video_duration_agg'].splice(index, 1) : this.searchCriteria['video_duration_agg'].push(height);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  selectModifiedDate(event: any) {
    let mimeType = event.target.value;
    let index = this.modifiedDate['dc_modified_agg'].indexOf(mimeType);
    index > -1 ? this.modifiedDate['dc_modified_agg'].splice(index, 1) : this.modifiedDate['dc_modified_agg'].push(mimeType);
    this.emitData(this.modifiedDate);
    return;
  }

  openNav() {
    document.getElementById("main-sidebar").style.width = "280px";
    document.getElementById("main").classList.toggle('shiftFilter');
    document.getElementById("main-sidebar").classList.toggle("closeBtn");

  }
}
