import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSET_TYPE, PAGE_SIZE_1000, PAGE_SIZE_20, UNWANTED_WORKSPACES } from 'src/app/common/constant';
import { IEntry, ISearchResponse } from 'src/app/common/interfaces';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';
import { fromEvent } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, tap } from "rxjs/operators";
import { apiRoutes } from 'src/app/common/config';

@Component({
  selector: 'app-browse-sector-space',
  templateUrl: './browse-sector-detail.component.html',
  styleUrls: ['./browse-sector-detail.component.css']
})
export class BrowseSectorDetailComponent implements OnInit {

  loading: boolean = false;
  renameFolderName: boolean = false;
  folderNameRef = undefined;
  titleExists: boolean = false;
  folderDescriptionRef = undefined;
  folderDateRef = undefined;
  assetList: IEntry[];
  isTrashView: boolean = false;
  searchInitialised: any;
  sectorName: string;
  folderId: string;
  currentWorkspace: IEntry;
  isExternalView: boolean = false;
  selectedFolder: boolean = false;
  searchBarValue: string;
  showSearchbar: boolean = true;
  folderNotFound: boolean = false;

  @ViewChild("DataTableComponent") dataTableComponent: DataTableComponent;
  @ViewChild("workspaceSearch") workspaceSearch: ElementRef;

  constructor(
    private sharedService: SharedService,
    private router: Router,
    private dataService: DataService,
    private apiService: ApiService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    
    this.searchInitialised = null;
    this.dataService.fetchAssets$.subscribe(async (data) => {
      // await this.fetchAssets(data.sectorUid, data.checkCache, data.pageSize, data.pageIndex, data.offset);
    });
    
    this.route.paramMap.subscribe( async paramMap => {
      this.sectorName = this.route.snapshot.paramMap.get('sectorName');
      this.folderId = this.route.snapshot.paramMap.get('folderId');
      if(!this.folderId) {
        this.fetchWorkspaceByName(this.sectorName);
      } else {
        this.getAssets(this.folderId);
        this.currentWorkspace = await this.fetchFolderById(this.folderId);
      }
    });
  }

  fetchWorkspaceByName(sectorName: string) {
    const url = `/path/${sectorName}/workspaces`;
    this.apiService.get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((workspace: any) => {
        this.currentWorkspace = workspace;
        this.getAssets(workspace.uid);
      });
  }

  async fetchFolderById(id) {
    this.apiService.get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended&depth=children`,
      {headers: { "fetch-document": "properties"}}).subscribe((workspace: any) => {
        this.currentWorkspace = workspace;
    });
  }

  getAssets(folderUid: string, index?: number, selected?: IEntry, childIndex?: number): void {
    // this.selectedFile = [];
    // this.selectedFolder = { ...selected, uid: selected.id };
    let pageIndex = 1;
    let offset = 0;
    let pageSize = 0;

    this.sharedService.toTop();
    // let url1 = `/search/pp/nxql_search/execute?currentPage=0&Index=0&offset=0&pageSize=${PAGE_SIZE_20}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${folderUid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    let url = `/search/pp/advanced_document_content/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&ecm_parentId=${folderUid}&ecm_trashed=false`;
    this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((docs: any) => {
        this.assetList = docs.entries.filter((sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
        let workSpaceIndex = this.assetList.findIndex((res) => res.title === "Workspaces");
        if (workSpaceIndex >= 0) {
          this.getAssets(this.assetList[workSpaceIndex].uid, index, selected, childIndex);
        } else {
          // this.sortedData = this.assetList.slice();
          // if (childIndex !== null && childIndex !== undefined) {
          //   this.folderStructure[index].children[childIndex].children = docs.entries;
          //   this.folderStructure[index].children[childIndex].isExpand = true;
          //   this.handleTest(selected);
          // } else {
          //   this.folderStructure[index].children = docs.entries;
          //   this.folderStructure[index].isExpand = true;
          // }
        }
      });
  }

  initWorkspaceSearch(initialiseViews?: boolean): void {
    if(!this.searchInitialised) {
      this.searchInitialised = fromEvent(this.workspaceSearch.nativeElement,'keyup')
        .pipe(
            filter(Boolean),
            debounceTime(250),
            distinctUntilChanged(),
            tap(async (text: Event) => {
              if(!this.workspaceSearch.nativeElement.value) {
                this.loading = true;
                await this.getAssets(this.folderId);
                // todo: uncomment when apply tile view this.handleSelectMenu(1, "LIST");
                this.loading = false;
                return;
              }
              this.searchFolders(this.searchBarValue);
              // todo: uncomment when apply tile view this.handleSelectMenu(1, "LIST");
            })
        ).subscribe();
    }
  }

  async searchFolders(searchString: string) {
    // this.loading = true;
    let query;
    if (!this.folderId) {
      query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:primaryType = 'Workspace' AND dc:isPrivate = 1 AND dc:title ILIKE '%${searchString}%'`;
    } 
    else {
      const path = this.currentWorkspace.path; //this.folderId ? `${this.currentWorkspace.path}/` : `${this.currentWorkspace.path}/workspaces/`;
      query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:path STARTSWITH '${path}' AND dc:title ILIKE '%${searchString}%'`;
    }
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 20,
      queryParams: query,
    };
    const result: any = await this.apiService
      .get(apiRoutes.NXQL_SEARCH, {
        params,
        headers: { "fetch-document": "properties" },
      }).toPromise();

    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, false)
    );
    const folders = result.entries.filter(entry =>
      [ASSET_TYPE.WORKSPACE_ROOT,
        ASSET_TYPE.DOMAIN, ASSET_TYPE.FOLDER,
        ASSET_TYPE.ORDERED_FOLDER,
        ASSET_TYPE.WORKSPACE].indexOf(entry.type.toLowerCase()) > -1);
    const assets = result.entries.filter(entry => [ASSET_TYPE.FILE, ASSET_TYPE.PICTURE, ASSET_TYPE.VIDEO].indexOf(entry.type.toLowerCase()) > -1);
    result.entries = folders.concat(assets);
    // result.entries = result.entries.sort((a, b) =>
    //   this.assetTypeCompare(a.type, b.type)
    // );
    // this.numberOfPages = result.numberOfPages;
    // this.resultCount = result.resultsCount;
    // this.sortedData = result.entries;
    this.assetList = result.entries;
    // this.loading = false;
  }

  assetTypeCompare(a: string , b: string): number {
    return [ASSET_TYPE.WORKSPACE, ASSET_TYPE.FOLDER, ASSET_TYPE.ORDERED_FOLDER].indexOf(a.toLowerCase()) > -1? -1 : 1;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getSearchPlaceholder(): string {
    if (this.isTrashView) {
      return `Search for folder in trash`;
    }
    return `Search in ${this.sharedService.stringShortener(this.currentWorkspace?.title, 19)}`;
  }
  
  myDeleted(e) {
      // this.myDeletedCheck = e.target.checked;
      // this.getTrashedWS();

  }

  // async handleTest(item) {
  //   this.renameFolderName = false;
  //   this.folderNameRef = undefined;
  //   this.titleExists = false

  //   this.folderDescriptionRef = undefined;
  //   this.folderDateRef = undefined;

  //   this.saveState(item);
  //   this.searchBarValue = "";
  //   // this.paginator?.firstPage();
  //   if (item.isTrashed) return;
  //   this.newTitle = item.title;
  //   this.showLinkCopy = true;
  //   this.showSearchbar = true;
  //   this.copiedString = "";
  //   this.selectedFolder = item;
  //   this.extractBreadcrumb();
  //   this.createBreadCrumb(item.title, item.type, item.path);

  //   this.loading = true;
  //   const { entries, numberOfPages, resultsCount } = await this.fetchAssets(item.uid, true);
  //   this.searchList = entries.filter((sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
  //   this.sortedData = this.searchList.slice(); //shallow copy
  //   this.numberOfPages = numberOfPages;
  //   this.resultCount = resultsCount;
  //   this.handleSelectMenu(1, "LIST");
  //   this.loading = false;
  //   this.sharedService.toTop();
  //   this.createDynamicSidebarScroll();
  //   // this.selectedFolder = item;
  // }

  // saveState({uid, title, path, properties, sectorId, type, contextParameters}, index?: number, breadCrumbIndex?: number) {
  //   // let breadcrumb;
  //   // if(contextParameters) {
  //   //   ({breadcrumb} = contextParameters);
  //   //   contextParameters = { breadcrumb };
  //   // }
  //   const workspaceState = JSON.stringify({title, uid, path, properties, sectorId, type, contextParameters});
  //   localStorage.setItem('workspaceState', workspaceState);
  //   this.navigateToWorkspaceFolder(uid, index, breadCrumbIndex);
  //   return;
  // }

  // navigateToWorkspaceFolder(uid: string, index?: number, breadCrumbIndex?: number) {
  //   if(this.routeParams.folderId === uid) {
  //     return;
  //   }
  //   const path = this.sectorSelected?.path.split("/");
  //   // NOTE: todo, refactor if-else
  //   if(breadCrumbIndex === 0) {
  //     this.router.navigate([ASSET_TYPE.WORKSPACE]);
  //   } else  if(breadCrumbIndex === 1) {
  //     this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title]);
  //   } else if(!isNaN(index)) {
  //     this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title, uid]);
  //   } else {
  //     this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title, uid]);
  //     // else this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title]);
  //   }
  // }

  // handleSelectMenu(index, type) {
  //   this.removeAssets()
  //   this.selectedMenu = index;
  //   this.viewType = type;
  // }

  // removeAssets() {
  //   this.forInternalUse = [];
  //   this.downloadArray = [];
  //   this.sizeExeeded = false;
  //   this.forInternaCheck = false;
  //   this.downloadFullItem = [];
  //   this.needPermissionToDownload = [];
  //   this.count = 0;
  //   this.fileSelected = [];
  //   this.copyRightItem = []
  //   this.canNotDelete=[]
  //   this.selectedFolderList={}
  //   this.selectedMoveList={}
  //   // this.isAware=false
  //   // $(".vh").prop("checked", false);
  //   this.sortedData.forEach((e) => (e.isSelected = false));
  // }

  // async fetchAssets(id: string, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
  //   this.currentPageCount = 0;
  //   // this.showMoreButton = true;
  //   this.dataService.folderPermission$.subscribe(data=>this.permissionChange=data)
  //   if (checkCache && this.folderAssetsResult[id] && !this.permissionChange) {
  //     console.log("comming");

  //     return this.folderAssetsResult[id];
  //   }
  //   this.dataService.folderPermissionInit(false)
  //   let url = `/search/pp/advanced_document_content/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&ecm_parentId=${id}&ecm_trashed=false`;
  //   const result: any = await this.apiService
  //     .get(url, { headers: { "fetch-document": "properties" } })
  //     .toPromise();
  //   // result.entries = result.entries.sort((a, b) =>
  //   //   this.compare(a.title, b.title, true)
  //   // );
  //   // result.entries = result.entries.sort((a, b) =>
  //   //   this.assetTypeCompare(a.type, b.type)
  //   // );

  //   result.entries = result.entries.sort((a, b) =>
  //     this.compare(a.title, b.title, true)
  //   );
  //   const folders = result.entries.filter(entry => [ASSET_TYPE.WORKSPACE_ROOT, ASSET_TYPE.DOMAIN, ASSET_TYPE.FOLDER, ASSET_TYPE.ORDERED_FOLDER, ASSET_TYPE.WORKSPACE].indexOf(entry.type.toLowerCase()) > -1);
  //   const assets = result.entries.filter(entry => [ASSET_TYPE.FILE, ASSET_TYPE.PICTURE, ASSET_TYPE.VIDEO].indexOf(entry.type.toLowerCase()) > -1);
  //   result.entries = folders.concat(assets);

  //   this.numberOfPages = result.numberOfPages;
  //   this.resultCount = result.resultsCount;
  //   const res = JSON.stringify(result);
  //   this.folderAssetsResult[id] = JSON.parse(res);
  //   delete this.fetchFolderStatus[id];
  //   return this.folderAssetsResult[id];
  // }

  // compare(a: number | string, b: number | string, isAsc: boolean) {
  //   return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  // }

}
