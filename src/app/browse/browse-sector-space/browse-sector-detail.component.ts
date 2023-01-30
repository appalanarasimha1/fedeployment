import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSET_TYPE, constants, PAGE_SIZE_1000, PAGE_SIZE_20, UNWANTED_WORKSPACES, WORKSPACE_ROOT } from 'src/app/common/constant';
import { IEntry, ISearchResponse } from 'src/app/common/interfaces';
import { DataTableComponent } from 'src/app/browse/data-table/data-table.component';
import { ApiService } from 'src/app/services/api.service';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';
import { fromEvent } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, tap } from "rxjs/operators";
import { apiRoutes } from 'src/app/common/config';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { AddUserModalComponent } from "src/app/add-user-modal/add-user-modal.component";
import { ManageAccessModalComponent } from "src/app/manage-access-modal/manage-access-modal.component";
import { Departments, Workspace } from "./../../config/sector.config";
import { NuxeoService } from "src/app/services/nuxeo.service";
import { UpdateModalComponent } from "../../update-modal/update-modal.component";
import { UploadModalComponent } from "src/app/upload-modal/upload-modal.component";
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-browse-sector-space',
  templateUrl: './browse-sector-detail.component.html',
  styleUrls: ['./browse-sector-detail.component.css']
})
export class BrowseSectorDetailComponent implements OnInit, AfterViewInit {

  loading: boolean = false;
  renameFolderName: boolean = false;
  folderNameRef = undefined;
  titleExists: boolean = false;
  folderDescriptionRef = undefined;
  folderDateRef = undefined;
  assetList: IEntry[] = [];
  isTrashView: boolean = false;
  searchInitialised: any;
  sectorName: string;
  folderId: string;
  currentWorkspace: IEntry;
  isExternalView: boolean = false;
  searchBarValue: string;
  showSearchbar: boolean = true;
  folderNotFound: boolean = false;
  showAssetPath: boolean = false;
  breadCrumb = [];
  breadcrrumb = `/${WORKSPACE_ROOT}`;
  isAdmin: boolean = false;
  user: any = null;
  onSectorLevel: boolean = false;
  listExternalUser: any[];
  listExternalUserGlobal: any[];
  copiedString: string;
  newTitle: string;
  VIEW_TYPE = {GRID: 0, LIST: 1};
  selectedMenu: number;
  loggedInUserSector: string;
  selectedAssetCount: number = 0;
  dropFilesNew = [];
  createFolderLoading: boolean = false;
  forInternalUse = [];
  isAware: boolean = false;
  downloadEnable: boolean = false;
  downloadErrorShow: boolean = false;
  copyRightItem: [];
  needPermissionToDownload: [];
  sizeExeeded: boolean = false;
  downloadArray:[]
  // dataTableComponent: DataTableComponent;
  folderStructure = {};
  showCreateFolderPopup: boolean = false;
  count:any;
  sortedData;
  selectedMoveListNew = {};
  canNotDelete=[]

  @ViewChild(DataTableComponent) dataTableComponent: DataTableComponent;
  @ViewChild("workspaceSearch") workspaceSearch: ElementRef;

  constructor(
    public sharedService: SharedService,
    private router: Router,
    // private dataService: DataService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    public matDialog: MatDialog,
    public nuxeo: NuxeoService,
  ) { 
    this.selectedMenu = this.VIEW_TYPE.LIST;
  }

  ngOnInit(): void {
    
    // this.dataTableComponent = new DataTableComponent(SharedService, ApiService, MatDialog, DataService, Router);
    this.fetchUserData();
    // this.dataService.fetchAssets$.subscribe(async (data) => {
    //   // await this.fetchAssets(data.sectorUid, data.checkCache, data.pageSize, data.pageIndex, data.offset);
    // });
    
    this.route.paramMap.subscribe( async paramMap => {
      this.sectorName = this.route.snapshot.paramMap.get('sectorName');
      this.folderId = this.route.snapshot.paramMap.get('folderId');
      if(!this.folderId) {
        this.fetchWorkspaceByName(this.sectorName);
        this.onSectorLevel = true;
      } else {
        this.getAssets(this.folderId);
        await this.fetchFolderById(this.folderId);
      }
    });
    const fetchAll = false;
    this.fetchExternalUserInfo(fetchAll);
  }

  ngAfterViewInit(): void {
    
  }
  
  async fetchExternalUserInfo(fetchAll = false) {
    await this.sharedService.fetchExternalUserInfo();
    this.listExternalUser = JSON.parse(localStorage.getItem("listExternalUser"));
    this.listExternalUserGlobal = JSON.parse(localStorage.getItem("listExternalUserGlobal"));
    if (!this.isExternalUser()) return;
    this.isExternalView = true;
    if (fetchAll) this.fetchAllPrivateWorkspaces();
  }
  
  isExternalUser() {
    return this.listExternalUser.includes(this.user) && !this.listExternalUserGlobal.includes(this.user);
  }
  
  async fetchAllPrivateWorkspaces() {
    const query = "SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:primaryType = 'Workspace' AND dc:isPrivate = 1";
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
      })
      .toPromise();

    this.assetList = result['entries'];
    // this.sortedData = this.searchList.slice();

    // this.handleSelectMenu(1, this.viewType || "LIST");
    localStorage.setItem('workspaceState', JSON.stringify({}));
    // this.selectedFolder = this.initSharedRoot();
    // this.selectedFolder2 = this.initSharedRoot();
    this.showSearchbar = true;
    // this.onSectorLevel = false;
    this.breadCrumb = [];
  }

  fetchWorkspaceByName(sectorName: string) {
    const url = `/path/${sectorName}/workspaces`;
    this.apiService.get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((workspace: any) => {
        this.currentWorkspace = workspace;
        if(workspace?.type === "WorkspaceRoot") {
          this.currentWorkspace.title = this.currentWorkspace?.properties?.["dc:sector"];
        }
        this.extractBreadcrumb();
        this.getAssets(workspace.uid);
      });
  }

  async fetchFolderById(id) {
    this.apiService.get(`/id/${id}`,
      {headers: { "fetch-document": "properties"}}).subscribe((workspace: any) => {
        this.currentWorkspace = workspace;
        this.extractBreadcrumb();
    });
  }

  fetchAssetsEvent(event: any) {
    this.getAssets(event.id, event.checkCache, event.pageSize, event.pageIndex, event.offset);
  }

  getAssets(folderUid: string, checkCache = true, pageSize = 20, pageIndex = 0, offset = 0): void {
    // this.selectedFile = [];
    // this.selectedFolder = { ...selected, uid: selected.id };
    this.showAssetPath = false;
    // let pageIndex = 1;
    // let offset = 0;
    // let pageSize = 0;

    this.sharedService.toTop();
    if(checkCache && this.folderStructure[folderUid]) return this.folderStructure[folderUid];
    // let url1 = `/search/pp/nxql_search/execute?currentPage=0&Index=0&offset=0&pageSize=${PAGE_SIZE_20}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${folderUid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    let url = `/search/pp/advanced_document_content/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&ecm_parentId=${folderUid}&ecm_trashed=false`;
    this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((docs: any) => {
        this.assetList = docs.entries.filter((sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
        let workSpaceIndex = this.assetList.findIndex((res) => res.title === "Workspaces");
        if (workSpaceIndex >= 0) {
          this.getAssets(this.assetList[workSpaceIndex].uid);
        } else {
          // this.sortedData = this.assetList.slice();
          // if (childIndex !== null && childIndex !== undefined) {
          //   this.folderStructure[index].children[childIndex].children = docs.entries;
          //   this.folderStructure[index].children[childIndex].isExpand = true;
          //   this.handleTest(selected);
          // } else {
            this.folderStructure[folderUid] = docs;
            this.folderStructure[folderUid].children = docs.entries;
            this.folderStructure = Object.assign({}, this.folderStructure);
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
                await this.getAssets(this.folderId, true);
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
    this.showAssetPath = true;
    // this.loading = true;
    let query;
    // if (!this.folderId) {
    //   query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:primaryType = 'Workspace' AND dc:isPrivate = 1 AND dc:title ILIKE '%${searchString}%'`;
    // } 
    // else {
      // const path = this.currentWorkspace.path; //this.folderId ? `${this.currentWorkspace.path}/` : `${this.currentWorkspace.path}/workspaces/`;
      query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:path STARTSWITH '${this.currentWorkspace.path}' AND dc:title ILIKE '%${searchString}%'`;
    // }
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

  extractBreadcrumb() {
      this.breadCrumb = this.currentWorkspace.contextParameters?.breadcrumb.entries.filter(
        (entry) => {
          return entry.type !== "WorkspaceRoot";
        }
      );
  }

  /**
   * This functions gets called from bread crumbs and sidebar
   * @param item
   * @param index
   * @param breadCrumbIndex
   * @returns null
   */
   async handleGotoBreadcrumb(item: IEntry, index: Number) {
    $("body").animate({ scrollTop: 0 }, "slow");
    if(!item) {
      this.router.navigateByUrl('workspace');
      return;
    }
    const sectorName = item.path.split("/")[1];
    let url = `workspace/${sectorName}`;
    if(index) {
      url = `${url}/${item.uid}`;
    }
    this.router.navigateByUrl(url);
   }
   
  checkShowManageAccessButton() {
    if (this.currentWorkspace?.properties?.['dc:isPrivate']) return false;
    const userData = localStorage.getItem("user");

    return this.currentWorkspace?.properties["dc:creator"].id === JSON.parse(userData).username
     || this.currentWorkspace?.properties["dc:creator"] === JSON.parse(userData).username;
  }
  
  isPrivateFolder(isButton = true, includeChild = false) {
    if (!this.hasInheritAcl() && !includeChild) return false;
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));

    const isPrivate = currentWorkspace?.properties && currentWorkspace?.properties["dc:isPrivate"];
    if (isButton) return isPrivate;
    const currentCollaborators = this.getFolderCollaborators();
    this.isAdmin = this.hasAdminPermission(currentCollaborators);
    return isPrivate && this.hasNoOtherCollaborators(currentCollaborators)
  }
  
  hasInheritAcl() {
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (currentWorkspace?.properties && currentWorkspace?.properties['isPrivateUpdated']) return true;
    if (!currentWorkspace?.contextParameters?.acls) return false;
    const inheritAcl = currentWorkspace.contextParameters.acls.find(acl => acl.name === 'local');
    if (!inheritAcl?.aces) return false;
    return true;
  }

  getFolderCollaborators() {
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (!currentWorkspace?.contextParameters?.acls) return [];
    const localAces = currentWorkspace.contextParameters.acls.find(acl => acl.name === 'local');
    if (!localAces?.aces) return;
    const folderCollaborators = {};
    localAces.aces.forEach(ace => {
      if (!ace.granted || ace.username.id === "Administrator" || ace.username.id === 'administrators') return;
      if (!ace.granted || ace.username === "Administrator" || ace.username === 'administrators') return;
      folderCollaborators[ace.username.id] = {
        user: ace.username,
        permission: ace.permission,
        externalUser: ace.externalUser,
        end: ace.end,
        id: ace.id,
      }
    });
    return folderCollaborators;
  }
  
  hasAdminPermission(currentCollaborators) {
    if (this.user === "Administrator") return true;
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (currentWorkspace?.properties && currentWorkspace?.properties['isPrivateUpdated']) return true;
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return false;
    const ace = currentCollaborators[this.user];
    if (!ace) return false;
    return ace.permission === 'Everything';
  }
  
  hasNoOtherCollaborators(currentCollaborators) {
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return true;
    const otherUser = Object.keys(currentCollaborators).find(id => this.user !== id);
    if (otherUser) return false;
    else return true;
  }
  
  getSelectedAssetsSize() {
    let size = 0;
    this.assetList?.forEach((doc) => {
      size += +doc.properties?.["file:content"]?.length || 0;
    });
    return this.humanFileSize(size);
  }

  humanFileSize(size) {
    if (!size) return "0 kB";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }
  
  getDateInFormat(date: string): string {
    return new Date(date).toDateString();
  }
  
  checkGeneralFolder(item){
    return item?.type?.toLowerCase() === constants.WORKSPACE && item?.title?.toLowerCase() === constants.GENERAL_FOLDER;
  }
  
  checkExternalUser() {
    return this.listExternalUser?.includes(this.user);
  }
  
  copyToClipboard(val: string) {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = `${window.location.origin}/workspace/${this.currentWorkspace?.properties?.['dc:sector']}/${this.currentWorkspace.uid}`;
    this.copiedString = selBox.value;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }
  
  renameFolder(title?: string, assetUid?: number) {
    let { newTitle, currentWorkspace } = this;
    if (newTitle?.trim() === currentWorkspace.title) return this.updateFolderAction();

    this.apiService
      .post(apiRoutes.DOCUMENT_UPDATE, {
        input: assetUid || currentWorkspace.uid,
        params: {
          properties: {
            "dc:title": title?.trim() || newTitle?.trim(),
          },
        },
      })
      .subscribe((updatedAsset: any) => {
        let msg;
        this.currentWorkspace = updatedAsset;
        this.extractBreadcrumb();
        if(!title && !assetUid) {
            this.updateFolderAction(updatedAsset);

            // this.handleTest(res);
            msg = 'Folder name has been updated';
        } else {
            msg = 'Asset name has been updated';
        }
        this.sharedService.showSnackbar(
          msg,
          6000,
          "top",
          "center",
          "snackBarMiddle"
        );
      });
  }
  
  updateFolderAction(folder = this.currentWorkspace) {
    this.renameFolderName = false;
    this.newTitle = folder.title;
  }
  
  renameFolderAction() {
    if (this.currentWorkspace.title === 'General') {
        this.sharedService.showSnackbar(
          "You do not have permission to update this folder",
          6000,
          "top",
          "center",
          "snackBarMiddle"
        );

    } else {
      this.newTitle =this.currentWorkspace.title;
      this.renameFolderName = true;
    }
  }
  
  async openAddUserModal() {
    if (!this.isAdmin) return;
    const folderCollaborators = this.getFolderCollaborators();
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "640px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const folder = this.currentWorkspace;// await this.fetchFolder(this.selectedFolder.uid);
    dialogConfig.data = {
      selectedFolder: this.currentWorkspace,
      folderId: this.currentWorkspace.uid,
      folderCollaborators
    }

    const modalDialog = this.matDialog.open(AddUserModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.saveState(result);
      }
    });
  }
  
  saveState({uid, title, path, properties, sectorId, type, contextParameters}, index?: number, breadCrumbIndex?: number) {
    const workspaceState = JSON.stringify({title, uid, path, properties, sectorId, type, contextParameters});
    localStorage.setItem('workspaceState', workspaceState);
    // this.navigateToWorkspaceFolder(uid, index, breadCrumbIndex);
    return;
  }
  
  async openManageAccessModal() {
    // this.loading = true;
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "550px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));
    dialogConfig.data = {
      selectedFolder: selectedFolder || this.currentWorkspace,
    }

    const modalDialog = this.matDialog.open(ManageAccessModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.currentWorkspace = result;
        if (result?.properties && result?.properties["dc:isPrivate"]) result.properties['isPrivateUpdated'] = true;
        this.saveState(result);
      }
    });
  }

  selectMenuView(viewType: number) {
    this.selectedMenu = viewType;
  }
  
  checkForDescription(): boolean {
    return !!this.currentWorkspace?.properties?.["dc:description"];
  }
  
  upadtePermission(breadcrumb: any) {
    let user: any;
    let checkAvailabity = Departments.hasOwnProperty(this.loggedInUserSector);
    if (checkAvailabity) {
      let ID = Departments[this.loggedInUserSector];
      user = Workspace[ID];
    }

    if (breadcrumb?.title?.toLowerCase() === user?.toLowerCase()) return true;
    return false;
  }
  
  async fetchUserData() {
    if (localStorage.getItem("user")) {
      this.user = JSON.parse(localStorage.getItem("user"))["username"];
      this.loggedInUserSector = JSON.parse(localStorage.getItem("user"))["sector"];
      if (this.user) return;
    }
    if (this.nuxeo.nuxeoClient) {
      const res = await this.nuxeo.nuxeoClient.connect();
      this.user = res.user.id;
      localStorage.setItem("user", JSON.stringify(res.user.properties));
    }
  }
  
  async openUpdateClassModal(breadCrumb: any) {
    if (!this.upadtePermission(breadCrumb) || this.assetList.length < 1) {
      return;
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px";
    dialogConfig.width = "650px";
    dialogConfig.disableClose = true; // NOTE: The user can't close the dialog by clicking outside its body
    const folder = this.currentWorkspace
    dialogConfig.data = {
      docs: this.assetList,
      folder
    };

    const modalDialog = this.matDialog.open(UpdateModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (!result) return;
      const updatedDocs = result.updatedDocs;
      const updatedFolder = result.currentWorkspace;
      // if (!this.currentWorkspace.properties) {
      //   this.currentWorkspace["properties"] = {};
      // }
      this.currentWorkspace.properties["dc:description"] = updatedFolder.description;
      this.currentWorkspace.properties["dc:start"] = updatedFolder.associatedDate;
      Object.keys(updatedDocs).forEach((key) => {
        this.assetList[key].contextParameters.acls = updatedDocs[key].contextParameters.acls;
        this.assetList[key].properties = {
          ...this.assetList[key].properties,
          ...updatedDocs[key].properties,
        };
        this.assetList = this.assetList.slice();
      });
      // this.showMoreButton = false;
    });
  }

  assetSelectedEvent(selectedAssetList: IEntry[]) {
    this.selectedAssetCount = Object.keys(selectedAssetList).length;
  }

  selectedCount(count:any){
    this.count = count
  }

  dragNDrop() {
    var lastTarget = null;
    var bool = false
    function isFile(evt) {
        var dt = evt.dataTransfer;

        for (var i = 0; i < dt.types.length; i++) {
            if (dt.types[i] === "Files") {
                return true;
            }
        }
        return false;
    }
    // this.openModal()
    let openM=(files)=> {
      this.dropFilesNew = files
      this.openModal()
    }

    window.addEventListener("dragenter", function (e) {
      const box = document.querySelector("#dropzone") as HTMLElement | null;
      const box1 = document.querySelector("#textnode") as HTMLElement | null;
      // if (box != null) {
        if (isFile(e)) {
            lastTarget = e.target;
            box.style.visibility = "";
            box.style.opacity = '1';
            box1.style.fontSize = "48px";
        }
      // }
    });

    window.addEventListener("dragleave", function (e) {
      const box = document.querySelector("#dropzone") as HTMLElement | null;
      const box1 = document.querySelector("#textnode") as HTMLElement | null;
        e.preventDefault();
        if (e.target === lastTarget || e.target === document) {
            box.style.visibility = "hidden";
            box.style.opacity = '0';
            box1.style.fontSize = "42px";
        }
    });

    window.addEventListener("dragover", function (e) {
        e.preventDefault();
    });

    window.addEventListener("drop", function (e) {
      const box = document.querySelector("#dropzone") as HTMLElement | null;
      const box1 = document.querySelector("#textnode") as HTMLElement | null;
        e.preventDefault();
        box.style.visibility = "hidden";
        box.style.opacity = '0';
        box1.style.fontSize = "42px";
        if(e.dataTransfer.files.length > 0) {
          openM(e.dataTransfer.files)

        }
    });
  }

  openModal(key?:boolean) {
    if(key) this.dropFilesNew=[]
    const dialogConfig = new MatDialogConfig();
   
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px";
    dialogConfig.width = "650px";
    dialogConfig.disableClose = true;  // NOTE: The user can't close the dialog by clicking outside its body
    // this.selectedFolder["sectorId"] = this.selectedFolder2.uid;
    dialogConfig.data = this.currentWorkspace;
    dialogConfig.data.isPrivate = this.isPrivateFolder();
    dialogConfig.data.dropFilesNew = this.dropFilesNew;
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
    modalDialog.afterClosed().subscribe((result) => {
      if (!result) return;
      // this.folderAssetsResult[this.breadCrumb[this.breadCrumb.length - 1].uid].entries.unshift(result);
      this.assetList.unshift(result);
      this.assetList = this.assetList.slice();
      // this.sortedData = this.searchList.slice();
      // this.showMoreButton = false;
    });
  }

  folderCreateEvent(asset: IEntry) {
    this.assetList.unshift(asset);
    this.assetList = this.assetList.slice()
    // this.showFolder = false;
    // if (!this.hasUpdatedChildren.includes(this.currentWorkspace.uid)) {
    //   this.hasUpdatedChildren.push(this.currentWorkspace.uid);
    // }
  }

  dataTableEvent(event: {eventName: string, data: any}) {
    if(event.eventName === 'forInternalUseListEvent') {
      this.forInternalUse = event.data;
    } else if(event.eventName === 'copyRightItemEvent') {
      this.copyRightItem = event.data;
    } else if(event.eventName === 'needPermissionToDownloadEvent') {
      this.needPermissionToDownload = event.data;
    } else if(event.eventName === 'sizeExeededEvent') {
      this.sizeExeeded = event.data;
    } else if(event.eventName === 'downloadArray') {
      this.downloadArray = event.data;
    }
  }
  
  onCheckboxChange(e: any) {
    if (e.target.checked) {
      this.downloadErrorShow = false;
      this.downloadEnable = true;
    } else {
      this.downloadEnable = false;
    }
  }
  
  getUser(item) {
    return item.properties["sa:downloadApprovalUsers"];
  }

  openMoveModal(move=true) {
    if(this.dataTableComponent){
    this.dataTableComponent.openMoveModal(move);
    }
   
    else return;
  }
  deleteFolders() {
    if(this.dataTableComponent){
    this.dataTableComponent.deleteFolders();
    }
   
    else return;
  }
  

  checkEnableMoveButton() {
    return Object.keys(this.selectedMoveListNew)?.length > 0;
  }
  checkEnableDeleteBtn() {
    if(this.dataTableComponent)
    return this.dataTableComponent.checkEnableDeleteBtn();
  }

  removeAssets() {
    if(this.dataTableComponent)
    this.dataTableComponent.removeAssets();
  }
  
  downloadClick() {
    if(this.dataTableComponent)
    this.dataTableComponent.downloadClick();
  }
  
  multiDownload() {
    if(this.dataTableComponent)
    this.dataTableComponent.multiDownload();
  }

  checkAssetType(e?:any) {
    if(this.dataTableComponent)
    return this.dataTableComponent.checkAssetType(e);
  }

  getIconByType(e?:any) {
    if(this.dataTableComponent)
    return this.dataTableComponent.getIconByType(e);
  }

  getAssetUrl(e:any,url:any,item:any) {
    if(this.dataTableComponent)
    return this.dataTableComponent.getAssetUrl(e,url,item);
  }
  downloadAssets(e?:any) {
    if(this.dataTableComponent)
    this.dataTableComponent.downloadAssets(e);
  }
  renameAsset(){
    let keySort = Object.keys(this.selectedMoveListNew)
    this.sortedData[keySort[0]].edit = !this.sortedData[keySort[0]]?.edit
    this.assetList = this.sortedData
  }
  selectedMoveList(e){
    this.selectedMoveListNew = e
  }
  canNotDeleteList(e){
    this.canNotDelete = e
  }
  sortedDataList(e){
    this.sortedData = e
  }
  checkAssetLength(){
    return Object.keys(this.selectedMoveListNew).length == 1
  }
}