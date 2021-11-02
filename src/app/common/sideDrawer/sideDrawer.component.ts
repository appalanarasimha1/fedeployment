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
  @Output() resetFilterOuput: EventEmitter<any> = new EventEmitter();
  @Input() inputMetaData = {
    system_primaryType_agg: { buckets: [], selection: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] },
    asset_height_agg: { buckets: [] },
    video_duration_agg: { buckets: [] },
    sectors: { buckets: [] }
  };
  metaData = {
    system_primaryType_agg: { buckets: [] },
    system_mimetype_agg: { buckets: [], selection: [] },
    asset_width_agg: { buckets: [] }, asset_height_agg: { buckets: [] },
    video_duration_agg: { buckets: [] },
    sectors: { buckets: [] }
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
    dc_modified_agg: string[]
  } = {
      system_primaryType_agg: [],
      system_mimetype_agg: [],
      asset_width_agg: [],
      asset_height_agg: [],
      video_duration_agg: [],
      sectors: [],
      dc_modified_agg: []
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

  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};

  modifiedDateDropDown = [{ key: 'last24h', id: 0 }, { key: 'lastWeek', id: 1 }, { key: 'lastMonth', id: 2 }, { key: 'lastYear', id: 3 }, { key: 'priorToLastYear', id: 4 }];
  // sharedService: any;

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
      this.checkSelectedPrimeAndMimeType(this.inputMetaData);
      this.manupulateData(this.inputMetaData, false);
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

  manupulateData(data, resetSectors: boolean, initSector: boolean = false) {

    this.mimeTypeData = [];
    this.assetWidthData = [];
    this.assetHeightData = [];
    this.videoSizeData = [];
    if(resetSectors || initSector) {}this.sectors = [];

    data.system_mimetype_agg.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.mimeTypeData.push({ key: item.key, id: index, docCount: item.docCount});
    });

    data.asset_width_agg.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.assetWidthData.push({ key: assetDimension[item.key], id: index, docCount: item.docCount });
    });

    data.asset_height_agg.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.assetHeightData.push({ key: assetDimension[item.key], id: index, docCount: item.docCount });
    });

    data.video_duration_agg.buckets.map((item: { key: string, docCount: number }, index: number) => {
      this.videoSizeData.push({ key: videoDurationDictionary[item.key], id: index, docCount: item.docCount });
    });

    data.sectors.buckets.map((item: { key: string }, index: number) => {
      this.sectors.push(item.key);
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

  // selectModifiedDate(value: string) {
  //   const mimeType = value;
  //   const index = this.modifiedDate['dc_modified_agg'].indexOf(mimeType);
  //   index > -1 ? this.modifiedDate['dc_modified_agg'].splice(index, 1) : this.modifiedDate['dc_modified_agg'].push(mimeType);

  //   this.modifiedDate['system_primaryType_agg']=this.searchCriteria['system_primaryType_agg'];

  //   this.emitData(this.modifiedDate);

  //   return;
  // }

  openNav() {
    document.getElementById("main-sidebar").style.width = "280px";
    document.getElementById("main").classList.toggle('shiftFilter');
    document.getElementById("main-sidebar").classList.toggle("closeBtn");




    // /* <!-- sprint12-fixes start --> */
    if (this.filterClosed) {
      $(".main").animate(
        {
          marginLeft: "280px"
        },
        300
      );
      $(".min-height").animate(
        {
          marginLeft: "300px"
        },
        300
      );

      $(".searchHeading").addClass('openDrawer');
      $(".masonry-item").addClass('masonryOpenDrawer');
      setTimeout(() => {
        this.sharedService.setSidebarToggle(true);
      }, 300);

      window.onresize = function(event) {

      };
    } else {
      $(".main, .min-height").animate(
        {
          marginLeft: "0px"
        },
        500
      );

      $(".searchHeading").removeClass('openDrawer');
      $(".masonry-item").removeClass('masonryOpenDrawer');
      setTimeout(() => {
        this.sharedService.setSidebarToggle(false);
      }, 300);
    }

    this.filterClosed = !this.filterClosed;
    return;
    // /* <!-- sprint12-fixes end --> */
  }

  resetFilter() {
    this.searchCriteria = {
      system_primaryType_agg: [],
      system_mimetype_agg: [],
      asset_width_agg: [],
      asset_height_agg: [],
      video_duration_agg: [],
      sectors: [],
      dc_modified_agg: []
    };
    this.resetFilterOuput.emit();
  }
}
