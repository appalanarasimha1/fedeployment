import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { IHeaderSearchCriteria } from './interface';
import {
  constants,
  assetDimension,
  reverseAssetDimension,
  videoDurationDictionary,
  reverseVideoDurationDictionary } from '../constant';
import { NuxeoService } from '../../services/nuxeo.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { apiRoutes } from '../config';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './sideDrawer.component.html',
  styleUrls: ['./sideDrawer.component.css'],

})
export class SideDrawerComponent implements OnInit, OnChanges {

  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  @Output() emitSectorList: EventEmitter<any> = new EventEmitter();
  @Input() inputMetaData = {
    system_primaryType_agg: { buckets: [], selection: [], extendedBuckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] },
    asset_height_agg: { buckets: [] },
    video_duration_agg: { buckets: [] },
    dublincore_sector_agg: { buckets: [], selection: [] },
    dublincore_created_agg: { buckets: [], selection: [] }
  };
  metaData = {
    system_primaryType_agg: { buckets: [], extendedBuckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] }, asset_height_agg: { buckets: [] },
    video_duration_agg: { buckets: [] },
    dublincore_sector_agg: { buckets: [], selection: [] },
    dublincore_created_agg: { buckets: [], selection: [] }
  };
  loading = false;
  error = undefined;
  filterClosed: boolean = true;

  searchCriteria: {
    quickFilters?: string,
    system_primaryType_agg?: string[],
    system_mimetype_agg?: string[],
    asset_width_agg?: string[],
    asset_height_agg?: string[],
    video_duration_agg?: string[]
    sectors?: string[],
    dc_modified_agg: string[],
    dublincore_created_agg: string[],
    downloadApproval: boolean,
    includePrivate: boolean
  } = {
      system_primaryType_agg: [],
      system_mimetype_agg: [],
      asset_width_agg: [],
      asset_height_agg: [],
      video_duration_agg: [],
      dc_modified_agg: [],
      dublincore_created_agg: [],
      downloadApproval: false,
      includePrivate: false
    };
  // modifiedDate = { dc_modified_agg: [] };
  showImageSize = true;
  showVideoSize = true;
  productsSelectedItems;
  primeTypeData = [];
  mimeTypeData = [];
  assetWidthData = [];
  assetHeightData = [];
  videoSizeData = [];
  assetOrientationData = [];
  updatedDateData = [];
  sectors = [];
  createdAtData = [];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};

  modifiedDateDropDown = [{ key: 'last24h', id: 0 }, { key: 'lastWeek', id: 1 }, { key: 'lastMonth', id: 2 }, { key: 'lastYear', id: 3 }, { key: 'priorToLastYear', id: 4 }];
  // sharedService: any;
  selectedMimetypeByType = [];

  downloadApproval = false;
  includePrivate = false;

  isOpen = false;
  selectedType: string;

  assetCount: number = 0;
  assetCountLoader: boolean = false;


  constructor(
    private nuxeo: NuxeoService,
    private http: HttpClient,
    private router: Router,
    private dataService: DataService,
    private sharedService: SharedService) { }

  ngOnInit(): void {
    if (!this.nuxeo.nuxeoClient) {
      this.router.navigate(['login']);
      return;
    }
    // this.getSectors();
    this.getMetaData();
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'id',
      textField: 'key',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 5,
      allowSearchFilter: false
    };
    this.dataService.sectorSelected$.subscribe(sector => this.selectSector(sector));
  }

  ngOnChanges(changes: any): void {
    if (changes.inputMetaData.currentValue && Object.keys(changes.inputMetaData.currentValue).length) {
      this.metaData = this.inputMetaData;
      this.count();
    }
  }

  // getSectors() {
  //   this.loading = true;
  //   this.error = undefined;
  //   const queryParams = { currentPageIndex: 0, offset: 0, pageSize: 40, queryParams: '00000000-0000-0000-0000-000000000000' };

  //   this.nuxeo.nuxeoClient.request('/search/pp/tree_children/execute', { queryParams })
  //     .get().then((docs) => {
  //       // this.sectors = docs.entries;
  //       this.loading = false;
  //     }).catch((error) => {
  //       console.log('sidedrawer get sector document error = ', error.message);
  //       this.loading = false;
  //       if (error.message === 'Unauthorized') {
  //         this.router.navigate(['login']);
  //       }
  //     });
  // }

  filterMimeTypeByType(mimeTypeList) {
    const filteredList = mimeTypeList.filter(data => {
      if (!this.selectedType || this.selectedType === "all") return true;
      if (this.selectedType === "Picture" && data.key.includes("image/")) return true;
      if (this.selectedType === "Video" && data.key.includes("video/")) return true;
      if (this.selectedType === "File" && !data.key.includes("image/") && !data.key.includes("video/")) return true;
      return false;
    });

    this.mimeTypeData = [...filteredList];
  }

  filterSeelectedMimetype(list) {
    const filteredList = list.filter(data => {
      if (!this.selectedType || this.selectedType === "all") return true;
      if (this.selectedType === "Picture" && data.includes("image/")) return true;
      if (this.selectedType === "Video" && data.includes("video/")) return true;
      if (this.selectedType === "File" && !data.includes("image/") && !data.includes("video/")) return true;
      return false;
    });

    this.selectedMimetypeByType = [...filteredList];
  }

  manupulateData(data, resetSectors: boolean, initSector: boolean = false) {

    this.mimeTypeData = [];
    this.assetWidthData = [];
    this.assetHeightData = [];
    this.videoSizeData = [];
    if(resetSectors || initSector) {}this.sectors = [];

    const mimeTypeList = [];

    data.system_mimetype_agg?.buckets.map((item: { key: string, docCount: number }, index: number) => {
      mimeTypeList.push({ key: item.key, id: index, docCount: item.docCount});
    });
    this.filterMimeTypeByType(mimeTypeList);

    data.asset_width_agg?.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.assetWidthData.push({ key: assetDimension[item.key], id: index, docCount: item.docCount });
    });

    data.asset_height_agg?.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.assetHeightData.push({ key: assetDimension[item.key], id: index, docCount: item.docCount });
    });

    data.video_duration_agg?.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.videoSizeData.push({ key: videoDurationDictionary[item.key], id: index, docCount: item.docCount });
    });

    data.sectors?.buckets.map((item: { key: string }, index: number) => {
      this.sectors.push(item.key);
    });

    data.dublincore_created_agg?.buckets.map((item: { key: string }, index: number) => {
      this.createdAtData.push(item.key);
    });

    if(resetSectors || initSector) this.dataService.sectorDataPush(this.sectors);
    // this.emitSectorList.emit(data.sectors.buckets);
    return;
  }

  /**
   * This function checks the primary type values in search criteria and show/hides
   * width, height filters accordingly
   * @param metaData - aggregation values coming in search API response
   * @returns void
   */
  checkSelectedPrimeAndMimeType(metaData: any) {
    if (this.searchCriteria['system_primaryType_agg'].includes(constants.PICTURE_TITLE_CASE)) {
      this.showImageSize = true;
      this.showVideoSize = false;
    } else if (this.searchCriteria['system_primaryType_agg'].includes(constants.VIDEO_TITLE_CASE)) {
      this.showImageSize = true;
      this.showVideoSize = true;
    } else if (this.searchCriteria['system_primaryType_agg'].includes(constants.AUDIO_TITLE_CASE)) {
      this.showImageSize = false;
      this.showVideoSize = false;
    }

    // if (metaData.system_primaryType_agg.selection.indexOf(constants.AUDIO_TITLE_CASE) !== -1
    //   || this.checkMimeSelection(constants.AUDIO_SMALL_CASE)) {
    //   this.showImageSize = false;
    //   this.showVideoSize = false;
    //   return;
    // } else if (metaData.system_primaryType_agg.selection.indexOf(constants.IMAGE_TITLE_CASE) !== -1
    //   || this.checkMimeSelection(constants.IMAGE_SMALL_CASE)) {
    //
    //   this.showImageSize = true;
    //   this.showVideoSize = false;
    //   return;
    // }
    // this.showImageSize = true;
    // this.showVideoSize = true;



    return;
  }

  checkMimeSelection(checkString: string) {

    let flag = false;
    this.metaData.system_mimetype_agg.selection.map(item => {
      if (item.split('/')[0].toLowerCase() === checkString) {
        flag = true;
      }
    });

    return flag;
  }

  getMetaData() {
    this.loading = true;
    this.error = undefined;
    let queryParams = { currentPageIndex: 0, offset: 0, pageSize: 1 }; //, system_primaryType_agg: '[]', system_mimetype_agg: '[]', asset_width_agg: '[]', asset_height_agg: '[]', color_profile_agg: '[]', color_depth_agg: '[]', video_duration_agg: '[]'

    this.nuxeo.nuxeoClient.request(apiRoutes.SEARCH_PP_ASSETS, { queryParams })
      .get().then((result) => {
        this.metaData = result.aggregations;
        if (result && result.aggregations) {
          this.metaData = result.aggregations;
          this.checkSelectedPrimeAndMimeType(result.aggregations);
          this.manupulateData(result.aggregations, true, true);
        }
        this.loading = false;
      }).catch((error) => {
        console.log(error);
        this.loading = false;
        if (error.message === 'Unauthorized') {
          this.router.navigate(['login']);
        }
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
    // if (!event.target.outerText) {
    //   return;
    // }
    if (!event)
      this.searchCriteria['sectors'] = [];
    else
      this.searchCriteria['sectors'] = [event];
    // const docType = event.target.outerText;
    // const index = this.searchCriteria['sectors'].indexOf(docType);
    // index > -1 ? this.searchCriteria['sectors'].splice(index, 1) : this.searchCriteria['sectors'].push(docType);
    this.emitData(this.searchCriteria);
    return;
  }

  selectDoctype(event: any): void {
    if (!event.target.textContent) {
      return;
    }
    let docType = event.target.textContent;
    let index = this.searchCriteria['system_primaryType_agg'].indexOf(docType);
    index > -1 ? this.searchCriteria['system_primaryType_agg'].splice(index, 1) : this.searchCriteria['system_primaryType_agg'].push(docType);
    this.emitData(this.searchCriteria);
    return;
  }

  isActive(key: string, value: string): boolean {
    let result = false;
    // if (key === 'modifiedDate') {
    //   this.modifiedDate.dc_modified_agg.map(item => {
    //     if (item.toLowerCase() === value.toLowerCase()) {
    //       result = true;
    //     }
    //   });
    //   return result;
    // }
    this.searchCriteria[key].map(item => {
      if (item.toLowerCase() === value.toLowerCase()) {
        result = true;
      }
    });
    return result;
  }

  createQuery(value: string) {
    if (value === 'recent') {
      this.searchCriteria['quickFilters'] = 'mostRecent';
    } else {
      delete this.searchCriteria['quickFilters'];
    }
    this.emitData(this.searchCriteria);
  }

  selectMimeType(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['system_mimetype_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['system_mimetype_agg'].push(item.key);
      });
    } else {
      this.searchCriteria['system_mimetype_agg'].push(data.key);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  selectCreatedAt(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['dublincore_created_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['dublincore_created_agg'].push(item.key);
      });
    } else {
      this.searchCriteria['dublincore_created_agg'].push(data.key);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectCreatedAt(data: any): void {
    if (!data.key && !data.length) {
      this.searchCriteria['dublincore_created_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = data.key;
    const index = this.searchCriteria['dublincore_created_agg'].indexOf(mimeType);
    this.searchCriteria['dublincore_created_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectFormat(data: any): void {
    if (!data.key && !data.length) {
      this.searchCriteria['system_mimetype_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = data.key;
    const index = this.searchCriteria['system_mimetype_agg'].indexOf(mimeType);
    this.searchCriteria['system_mimetype_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  selectWidth(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['asset_width_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['asset_width_agg'].push(reverseAssetDimension[item.key]);
      });
    } else {
      this.searchCriteria['asset_width_agg'].push(reverseAssetDimension[data.key]);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectWidth(data: any) {
    if (!data.key && !data.length) {
      this.searchCriteria['asset_width_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = reverseAssetDimension[data.key];
    const index = this.searchCriteria['asset_width_agg'].indexOf(mimeType);
    this.searchCriteria['asset_width_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  selectHeight(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['asset_height_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['asset_height_agg'].push(reverseAssetDimension[item.key]);
      });
    } else {
      this.searchCriteria['asset_height_agg'].push(reverseAssetDimension[data.key]);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectHeight(data: any) {
    if (!data.key && !data.length) {
      this.searchCriteria['asset_height_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = reverseAssetDimension[data.key];
    const index = this.searchCriteria['asset_height_agg'].indexOf(mimeType);
    this.searchCriteria['asset_height_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  selectVideoDuration(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['video_duration_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['video_duration_agg'].push(reverseVideoDurationDictionary[item.key]);
      });
    } else {
      this.searchCriteria['video_duration_agg'].push(reverseVideoDurationDictionary[data.key]);
    }
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectVideoDuration(data: any) {
    if (!data.key && !data.length) {
      this.searchCriteria['video_duration_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = reverseVideoDurationDictionary[data.key];
    const index = this.searchCriteria['video_duration_agg'].indexOf(mimeType);
    this.searchCriteria['video_duration_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  selectModifiedDate(data: any) {
    if (Array.isArray(data)) {
      this.searchCriteria['dc_modified_agg'] = [];
      data.map((item: { key: string }) => {
        this.searchCriteria['dc_modified_agg'].push(item.key);
      });
    } else {
      this.searchCriteria['dc_modified_agg'].push(data.key);
    }
    // this.modifiedDate['system_primaryType_agg'] = this.searchCriteria['system_primaryType_agg'];
    this.emitData(this.searchCriteria);
    return;
  }

  deSelectModifiedDate(data: any) {
    if (!data.key && !data.length) {
      this.searchCriteria['dc_modified_agg'] = [];
      this.emitData(this.searchCriteria);
      return;
    }
    const mimeType = data.key;
    const index = this.searchCriteria['dc_modified_agg'].indexOf(mimeType);
    this.searchCriteria['dc_modified_agg'].splice(index, 1);
    this.emitData(this.searchCriteria);
    return;
  }

  onCheckDownloadApproval(event) {
    this.assetCountLoader = true;
    this.searchCriteria['downloadApproval'] = this.downloadApproval;
    this.emitData(this.searchCriteria);
    return;
  }

  onCheckIncludePrivate(event) {
    this.assetCountLoader = true;
    this.searchCriteria['includePrivate'] = this.includePrivate;
    this.emitData(this.searchCriteria);
    return;
  }

  // selectModifiedDate(value: string) {
  //   const mimeType = value;
  //   const index = this.modifiedDate['dc_modified_agg'].indexOf(mimeType);
  //   index > -1 ? this.modifiedDate['dc_modified_agg'].splice(index, 1) : this.modifiedDate['dc_modified_agg'].push(mimeType);

  //   this.modifiedDate['system_primaryType_agg']=this.searchCriteria['system_primaryType_agg'];

  //   this.emitData(this.modifiedDate);

  //   return;
  // }

  count() {
    this.assetCount = 0;
    if (this.selectedType === 'all') {
      // let total = 0;
      this.inputMetaData.system_primaryType_agg.extendedBuckets.forEach(b => {
        this.assetCount += b.docCount;
      });
      this.assetCountLoader = false;
      return;
    }
    const bucket = this.inputMetaData.system_primaryType_agg.extendedBuckets.find(b => b.key === this.selectedType);
    this.assetCount = bucket?.docCount || 0;
    this.assetCountLoader = false;
  }

  closeModal() {
    this.isOpen = false;
  }

  openModal(type) {
    this.isOpen = true;
    this.selectedType = type;
    if(type !== 'all')
    this.searchCriteria.system_primaryType_agg = [this.selectedType];

    this.manupulateData(this.inputMetaData, false);
    this.filterSeelectedMimetype(this.searchCriteria.system_mimetype_agg);
    this.count();
  }

  resetFilter() {
    this.searchCriteria = {
      system_primaryType_agg: [],
      system_mimetype_agg: [],
      asset_width_agg: [],
      asset_height_agg: [],
      video_duration_agg: [],
      sectors: [],
      dc_modified_agg: [],
      dublincore_created_agg: [],
      downloadApproval: false,
      includePrivate: false
    };
  }
}
