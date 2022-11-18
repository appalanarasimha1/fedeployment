import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { apiRoutes } from 'src/app/common/config';
import { ASSET_TYPE, PAGE_SIZE_20, UNWANTED_WORKSPACES } from 'src/app/common/constant';
import { IEntry } from 'src/app/common/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-trash-view',
  templateUrl: './trash-view.component.html',
  styleUrls: ['./trash-view.component.css']
})
export class TrashViewComponent implements OnInit {
  @ViewChild("workspaceSearch") workspaceSearch: ElementRef;

  assetList: IEntry[] = [];
  VIEW_TYPE = {GRID: 0, LIST: 1};
  selectedMenu: number;
  selectedFolderList: IEntry = {};
  selectedMoveList: IEntry[] = [];
  canNotDelete: IEntry[] = [];
  loading: boolean = false;
  folderNotFound: boolean = false;
  selectedFolder = {};
  myDeletedCheck: boolean = true;
  userName: string;
  folderAssetsResult;
  isTrashView: boolean = true;
  searchInitialised: any;
  searchBarValue: string = "";
  showAssetPath: boolean = false;

  constructor(
    private apiService: ApiService,
    public sharedService: SharedService,
  ) {
    this.selectedMenu = this.VIEW_TYPE.LIST;
  }

  ngOnInit(): void {
    this.searchInitialised = null;
    this.userName = JSON.parse(localStorage.getItem("user"))["username"];
    this.getTrashedWS();
  }
  
  selectMenuView(viewType: number) {
    this.selectedMenu = viewType;
  }
  
  myDeleted(e) {
    this.myDeletedCheck = e.target.checked;
    this.getTrashedWS();

}
  
  checkEnableDeleteBtn() {
    return Object.keys(this.selectedFolderList).length > 0  || Object.keys(this.selectedMoveList).length > this.canNotDelete.length;
  }

  getTrashedWS(pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.searchBarValue = "";
    // offset || this.paginator?.firstPage();
    if (this.folderNotFound) {
      this.folderNotFound = false;
      this.selectedFolder = {};
    }
    this.loading = true;
    const url = this.myDeletedCheck ?
     `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 1 AND dc:creator = '${this.userName}' `:
     `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 1'`
     this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((docs: any) => {
        // this.numberOfPages = docs.numberOfPages;
        // this.resultCount = docs.resultsCount;
        this.assetList = docs.entries.filter((sector) => {
          if (UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1) {
            // --this.resultCount;
            return true;
          } else {
            return false;
          }
        });
        if(!this.assetList?.length) this.folderNotFound = true;
        // if (!this.myDeletedCheck) {
        //   this.searchList = this.assetList;
        //   this.sortedData = this.searchList.slice();
        // } else {
        //   this.deletedByMeFilter().then(() => {
        //     this.searchList = this.deletedByMe;
        //     this.sortedData = this.searchList.slice();
        //   });
        // }
        // this.assetList = this.assetList;
        // this.sortedData = this.searchList.slice();
        // this.isTrashView = true;
        // this.handleSelectMenu(1,"LIST");
        // this.showMoreButton = false;
        this.loading = false;
        // this.deletedByMeFilter();
      });
  }
  
  async searchFolders(searchString: string) {
    this.showAssetPath = true;
    // this.loading = true;
    const query = this.myDeletedCheck ?
      `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 1 AND dc:title ILIKE '%${searchString}%' AND dc:creator = '${this.userName}'` :
      `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 1 AND dc:title ILIKE '%${searchString}%'`;
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
    this.assetList = result.entries;
    // this.loading = false;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  async unTrashFolders() {

    if (Object.keys(this.selectedFolderList).length == 0) return;
    this.loading = true;

    const listDocs = Object.entries(this.selectedFolderList).map(
      ([key, item], index) => {
        return item["uid"];
      }
    );
    await this.apiService
      .post(apiRoutes.UN_TRASH_DOC, { input: `docs:${listDocs.join()}` })
      .subscribe((docs: any) => {
        this.loading = false;
        this.recoverModal(listDocs);
      });
  }
  
  recoverModal(listDocs) {
    let recoveredFolders = this.assetList.filter((item) =>
      listDocs.includes(item["uid"])
    );
    this.sharedService.showSnackbar(
      "Successfully recovered.",
      3000,
      "top",
      "center",
      "snackBarMiddleRecover"
    );
    this.assetList = this.assetList.filter(
      (item) => !listDocs.includes(item["uid"])
    );
    // this.searchList = this.assetList;
    // this.sortedData = this.searchList.slice();
    // this.hasUpdatedChildren.push(this.selectedFolder.uid);
    this.selectedFolderList = {};
    recoveredFolders.forEach(
      (item) =>
        this.folderAssetsResult[item.parentRef] &&
        this.folderAssetsResult[item.parentRef].entries.push(item)
    );
  }

  dataTableEvent(event) {}

  assetSelected(event) {}

  fetchAssetsEvent(event) {}
  
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
                await this.getTrashedWS();
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

}
