import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "../../services/api.service";
import { PreviewPopupComponent } from "src/app/preview-popup/preview-popup.component";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxMasonryComponent } from "ngx-masonry";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { UpdateModalComponent } from "../../update-modal/update-modal.component";
import { SharedService } from "src/app/services/shared.service";
import { environment } from "../../../environments/environment";

import {
  ASSET_TYPE,
  constants,
  PAGE_SIZE_200,
  PAGE_SIZE_1000,
  PAGE_SIZE_20,
  WORKSPACE_ROOT,
  ROOT_ID,
  ORDERED_FOLDER,
  FOLDER_TYPE_WORKSPACE
} from "src/app/common/constant";
import { apiRoutes } from "src/app/common/config";
import { NuxeoService } from "src/app/services/nuxeo.service";
import { UNWANTED_WORKSPACES } from "../../upload-modal/constant";
import { UploadModalComponent } from "src/app/upload-modal/upload-modal.component";
import { Sort } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { DataService } from "src/app/services/data.service";
import { ManageAccessModalComponent } from "src/app/manage-access-modal/manage-access-modal.component";
import { AddUserModalComponent } from "src/app/add-user-modal/add-user-modal.component";
import { fromEvent } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, tap } from "rxjs/operators";
import { Departments, Workspace } from "./../../config/sector.config";
import { IEntry, ISearchResponse } from "src/app/common/interfaces";
import { MoveCopyAssetsComponent } from "src/app/move-copy-assets/move-copy-assets.component";

import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: "app-browse",
  // directives: [Search],
  templateUrl: "./browse.component.html",
  styleUrls: ["./browse.component.css"],
})
export class BrowseComponent implements OnInit, AfterViewInit {
  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  @ViewChild("previewModal") previewModal: PreviewPopupComponent;
  // @ViewChild('uploadModal') uploadModal: UploadModalComponent;
  @ViewChild("paginator") paginator: MatPaginator;
  @ViewChild("workspaceSearch") workspaceSearch: ElementRef;

  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;


  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    private apiService: ApiService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    public nuxeo: NuxeoService,
    public dataService: DataService,
  ) {}

  faCoffee = faCoffee;
  parentId = ROOT_ID;
  search = "/";
  folderType = "";
  title = "";
  description = "";
  startDate = "";
  check = false;
  error = null;
  type = null;
  searchList = null;
  subtypes = null;

  openDropdown = false;

  files: File[] = [];
  selectedFolder = null;
  newTitle;
  selectedFolder2 = null;
  sectorSelected = null;
  selectedMenu = 1;
  uploadSuccess = null;
  pathSuccess = null;
  items: any;
  loading = false;
  public myOptions = {
    gutter: 10,
    resize: true,
    // horizontalOrder: true
  };
  public updateMasonryLayout = false;
  sectorOpen = false;
  ind;
  callHandClick;
  callDomain;
  callFolder;
  viewType = "LIST";
  tableViewType = 0;
  showShadow = false;
  activeTabs = { comments: false, info: false, timeline: false };
  selectedFile: any;
  selectedFileUrl: string;
  tags = [];
  comments = [];
  inputTag = "";
  showTagInput = false;
  fileSelected = [];

  currentLevel = 0;
  folderAssetsResult: any = {};
  fetchFolderStatus: any = {};
  currentPageCount = 0;
  showMoreButton = true;
  copiedString: string;
  showLinkCopy = false;
  showSearchbar = false;
  searchBarValue = "";
  panelOpenState = false;
  breadCrumb = [];
  selectedFolderList: any = {};
  selectedMoveList: any = {};
  trashedList = null;
  deletedByMe: any;
  myDeletedCheck: boolean = true;
  user = null;
  userSector;
  isTrashView = false;
  needReloadWs = [];
  hasUpdatedChildren = [];
  sortedData = [];
  folderNotFound = false;
  renameFolderName: boolean = false;
  isShowDivIf: boolean = false;
  numberOfPages: number;
  sectorWorkspace;
  resultCount: number;
  defaultPageSize: number = 20;
  pageSizeOptions = [20, 50, 100];
  folderNameRef;
  folderDescriptionRef;
  folderDateRef;

  showError: boolean = false;
  isAware = false;
  downloadErrorShow: boolean = false;
  downloadEnable: boolean = false;

  checkboxIsPrivate: boolean = false;

  createFolderLoading = false;

  isAdmin = false;
  listExternalUser: string[] = [];
  listExternalUserGlobal: string[] = [];
  isExternalView = false;
  permissionChange:boolean=false

  completeLoadingMasonry(event: any) {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }

  folderStructure: any = [
    {
      uid: ROOT_ID,
      title: "All workspaces",
      menuId: ROOT_ID,
      parentMenuId: null,
      isExpand: false,
      path: "",
    },
  ];
  searchInitialised: any;

  routeParams = {
    sectorName: "",
    folderId: ""
  };
  breadcrrumb = `/${WORKSPACE_ROOT}`;
  showFolder = false;

  publishingAssets: boolean = true;
  publishingPrivateAssets: boolean = false;

  currentIndexPublished: any;
  currentIndexRightClick: any;

  async ngOnInit() {
    this.fetchUserData();
    let fetchAll = false;
    this.route.queryParams.subscribe(async (params) => {
    let sectorName = this.route.snapshot.paramMap.get('sectorName');
    let folderId = this.route.snapshot.paramMap.get('folderId');

      this.loading = true;
      this.searchInitialised = null;
      this.routeParams.sectorName = sectorName;

      await this.fetchAllSectors();
      const sectorDocument = this.folderAssetsResult[ROOT_ID]?.entries?.filter(item => item.title.toLowerCase() === sectorName?.toLowerCase());
      if(!this.route.snapshot.paramMap.get('folderId')) {
        folderId = sectorDocument[0]?.uid;
        if(!this.routeParams?.folderId) this.routeParams.folderId = folderId;
      }

      if (sectorName && folderId && folderId !== ROOT_ID) {

        await this.fetchBreadCrumbByAssetsUId(folderId);
        this.selectedFolder2 = this.breadCrumb[0];
        this.sectorSelected = this.breadCrumb[0];
        this.selectedFolder = this.breadCrumb[this.breadCrumb.length - 1];
        if (this.selectedFolder.isTrashed) {
          this.folderNotFound = true;
          this.loading = false;
          return;
        }
        // this.fetchCurrentFolderAssets(folderId);
        this.getWorkspaceFolders(folderId, 1);
        const folder: any = await this.fetchFolder(folderId);
        this.saveState(folder);
        this.loading = false;
        this.createDynamicSidebarScroll();
      // } else if(sectorName && !folderId ) {

      //   await this.fetchAllSectors();
      //   const sectorDocument = this.folderAssetsResult[ROOT_ID].entries.filter(item => item.title.toLowerCase() === sectorName.toLowerCase);

      //   this.selectedFolder2 = sectorDocument;
      //   this.sectorSelected = sectorDocument;
      //   this.selectedFolder = sectorDocument;
      } else {
        this.initialLoad = true;
        fetchAll = true;
        this.selectedFolder2 = this.folderStructure[0];
        this.sectorSelected = this.folderStructure[0];
        this.selectedFolder = this.folderStructure[0];
        await this.fetchAllSectors();
        this.loading = false;
      }
      if (window.location.href.includes(`${window.location.origin}/workspace`)) {
        this.initialLoad = false;
        setTimeout(() => {
          this.manageAccessPublished();
        }, 500);
      }

    });

    this.dataService.uploadedAssetData$.subscribe((result:any) => {
      if (!result?.length) return;
      result.map((asset:any)=>{
        this.searchList.unshift(asset);
      })

      this.sortedData = this.searchList.slice();
      this.folderAssetsResult[this.breadCrumb[this.breadCrumb.length - 1].uid].entries.unshift(result);

      this.showMoreButton = false;
    });

    $(".acnav__label").click(function () {
      var label = $(this);
      var parent = label.parent(".has-children");
      var list = label.siblings(".acnav__list");

      if (parent.hasClass("is-open")) {
        list.slideUp("fast");
        parent.removeClass("is-open");
      } else {
        list.slideDown("fast");
        parent.addClass("is-open");
      }
    });

    this.fetchExternalUserInfo(fetchAll);
    this.dragNDrop();
    // this.removeAssets()
  }

  ngAfterViewInit(): void {
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
                await this.getWorkspaceFolders(this.selectedFolder.uid, 1);
                this.handleSelectMenu(1, "LIST");
                this.loading = false;
                return;
              }
              this.searchFolders(this.workspaceSearch.nativeElement.value);
              this.handleSelectMenu(1, "LIST");
            })
        ).subscribe();
    }
  }

  datePickerDefaultAction() {
    $( ".createNew.flexible" ).focus(() => {
      // alert( "Handler for .focus() called." );
      setTimeout(() => {
        $('#autoFocusElement').focus();
      }, 500);
    });
    $(".buttonCreate").on("click", function (e) {
      // $(".dropdownCreate").toggle();
      $(".dropdownCreate").show();
      $(".buttonCreate").addClass("createNewFolderClick");
      setTimeout(() => {
        $('#autoFocusElement').focus();
      }, 500);
      e.stopPropagation();
    });
    $(".buttonCreate.createNewFolderClick").on("click", function (e) {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
      e.stopPropagation();
    });

    $(".dropdownCreate, .mat-datepicker-content").click(function (e) {
      e.stopPropagation();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });

    $(document).click(function () {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });

    $(".mat-icon-button").click(function () {
      $(".dropdownCreate, .mat-datepicker-content").click(function (e) {
        $(".buttonCreate").removeClass("createNewFolderClick");
        e.stopPropagation();
      });
    });

    $(".closeIcon").on("click", function (e) {
      $(".dropdownCreate").hide();
      e.stopPropagation();
    });
    this.getAllFolders(this.selectedFolder)
  }

  checkAssetType(assetType: string): boolean {
    const assetTypes = [
      constants.FILE_SMALL_CASE,
      constants.PICTURE_SMALL_CASE,
      constants.VIDEO_SMALL_CASE,
      constants.AUDIO_SMALL_CASE,
    ];
    if (assetTypes.indexOf(assetType.toLowerCase()) !== -1) return true;
    else return false;
  }

  checkAssetMimeTypes(document: any): string {
    return this.sharedService.checkMimeType(document);
  }

  closeOtherSectore(child, children) {
    this.createBreadCrumb(child.title, child.type, child.path);
    for (let i = 0; i < children.length; i++) {
      if (child.uid === children[i].uid) {
        child.isExpand = !child.isExpand;
      } else {
        children[i].isExpand = false;
      }
    }
    return;
  }

  checkWSType(assetType: string) {
    return assetType.toLowerCase() === ASSET_TYPE.WORKSPACE || assetType.toLowerCase() === ASSET_TYPE.ORDERED_FOLDER;
  }

  checkGeneralFolder(item){
    return item?.type?.toLowerCase() === constants.WORKSPACE && item?.title?.toLowerCase() === constants.GENERAL_FOLDER
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, { centered: true, backdrop: "static" });
  }

  async handleTest(item) {
    this.renameFolderName = false;
    this.folderNameRef = undefined;
    this.titleExists = false

    this.folderDescriptionRef = undefined;
    this.folderDateRef = undefined;

    this.saveState(item);
    this.searchBarValue = "";
    this.paginator?.firstPage();
    if (item.isTrashed) return;
    this.newTitle = item.title;
    this.showLinkCopy = true;
    this.showSearchbar = true;
    this.copiedString = "";
    this.selectedFolder = item;
    this.extractBreadcrumb();
    this.createBreadCrumb(item.title, item.type, item.path);

    this.loading = true;
    const { entries, numberOfPages, resultsCount } = await this.fetchAssets(item.uid, true);
    this.searchList = entries.filter((sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
    this.sortedData = this.searchList.slice(); //shallow copy
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.handleSelectMenu(1, "LIST");
    this.loading = false;
    this.sharedService.toTop();
    this.createDynamicSidebarScroll();
    // this.selectedFolder = item;
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if(document && this.checkAssetMimeTypes(document) === 'nopreview' && this.viewType ==="GRID") {
      return '../../../assets/images/no-preview.png';
    }
    if(document && this.checkAssetMimeTypes(document) === 'nopreview' && this.viewType ==="LIST") {
      return '../../../assets/images/no-preview-grid.svg';
    }
   return this.sharedService.getAssetUrl(event, url, type);
  }

  open(file, fileType?: string): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRenditionUrl;
    this.selectedFile = file;
    // if (!fileType) {
    switch (fileType.toLowerCase()) {
      case ASSET_TYPE.PICTURE:
        fileType = "image";
        break;
      case ASSET_TYPE.VIDEO:
        fileType = "video";
        break;
      default:
        fileType = "file";
        break;
    }
    // }
    this.sharedService.markRecentlyViewed(file);
    if (fileType === "image") {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
      fileRenditionUrl = url; // file.properties['file:content'].data;
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if (fileType === "video") {
      fileRenditionUrl = file.properties["vid:transcodedVideos"][0]?.content.data || file.properties['file:content'].data;
    } else if (fileType === "file") {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/pdf`;
      // fileRenditionUrl = `${this.getNuxeoPdfViewerURL()}${encodeURIComponent(url)}`;
      fileRenditionUrl = file.properties["file:content"].data;
      // fileRenditionUrl = url;
    }
    this.selectedFileUrl =
      fileType === "image"
        ? this.getAssetUrl(null, fileRenditionUrl)
        : fileRenditionUrl;
    // if(fileType === 'file') {
    //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
    // }

    this.previewModal.open();
  }

  // markRecentlyViewed(data: any) {
  //   let found = false;
  //   // tslint:disable-next-line:prefer-const
  //   let recentlyViewed =
  //     JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
  //   if (recentlyViewed.length) {
  //     recentlyViewed.map((item: any, index: number) => {
  //       if (item.uid === data.uid) {
  //         found = true;
  //         recentlyViewed[index] = data;
  //       }
  //     });
  //   }
  //   if (found) {
  //     localStorage.setItem(
  //       localStorageVars.RECENTLY_VIEWED,
  //       JSON.stringify(recentlyViewed)
  //     );
  //     return;
  //   }

  //   data["isSelected"] = false;
  //   recentlyViewed.push(data);
  //   localStorage.setItem(
  //     localStorageVars.RECENTLY_VIEWED,
  //     JSON.stringify(recentlyViewed)
  //   );
  //   return;
  // }

  // handleSelectFile(item, index) {
  //   this.selectedFile.push(item);
  //   this.searchList[index].isSelected = !this.searchList[index].isSelected;
  // }

  handleViewClick(item, index) {
    this.handleClickNew(item.uid);
    this.paginator.firstPage();
    this.searchBarValue = "";
  }

  createBreadCrumb(title: string, type: string, path?: string): void {
    if (!type) {
      this.breadcrrumb = `/${WORKSPACE_ROOT}`;
      return;
    }
    const sectorId = this.sortedData?.find((d) => d.title === title);
    if (type.toLowerCase() === ASSET_TYPE.DOMAIN) {
      this.breadcrrumb = `/${WORKSPACE_ROOT}/${title}`;
      const sectorId = this.sortedData?.find((d) => d.title === title);
      // this.navigateByUrl('');
    } else if (type.toLowerCase() === ASSET_TYPE.WORKSPACE) {
      const bread = this.breadcrrumb.split("/");
      const definedPath = path.split("/");
      this.breadcrrumb = `/${bread[1]}/${
        bread[2] === "undefined" || !bread[2] ? definedPath[1] : bread[2]
      }/${this.sharedService.stringShortener(title, 50)}`;
    }
    // this.breadcrrumb =  `/${WORKSPACE_ROOT}${path}`;
  }

  checkForChildren() {
    return true;
  }

  extractBreadcrumb(contextParameters = this.selectedFolder.contextParameters) {
    if (contextParameters) {
      this.breadCrumb = contextParameters?.breadcrumb.entries.filter(
        (entry) => {
          return entry.type !== "WorkspaceRoot";
        }
      );
    }
  }

  /**
   * This functions gets called from bread crumbs and sidebar
   * @param item
   * @param index
   * @param breadCrumbIndex
   * @returns null
   */
  async handleGotoBreadcrumb(item, index, breadCrumbIndex?: any) {
    $("body").animate({ scrollTop: 0 }, "slow");
      this.titleExists = false
      this.folderNameRef = undefined;
    this.folderDescriptionRef = undefined;
    this.folderDateRef = undefined;
    this.removeAssets()
    this.saveState(item, index, breadCrumbIndex);
    this.paginator?.firstPage();
    this.searchBarValue = "";
    // this.getAllFolders()
    // if (!isNaN(index) || breadCrumbIndex === 1) {
    //   this.showSearchbar = true;
    // }
    if (breadCrumbIndex === this.breadCrumb.length) return;
    if (breadCrumbIndex === 0) {
      // this.showSearchbar = false;
      this.selectedFolder2 = this.folderStructure[0];
      this.selectedFolder = this.selectedFolder2;
      this.sectorSelected = null;
      this.selectedMenu = 1;
      return;
    }
    this.isTrashView = false;
    if (index || breadCrumbIndex === 1) {
      console.log("inside if");

      const listView = 1;
      this.loading = true;
      await this.getWorkspaceFolders(item.uid, listView);
      this.loading = false;
    } else {
      console.log("inside else");
      // this.showSearchbar = false;
      await this.handleClickNew(item.uid);
    }
    this.loading = true;
    this.selectedFolder = await this.fetchFolder(item.uid);
    this.selectedFolder2 = this.selectedFolder;
    this.extractBreadcrumb();
    this.loading = false;
  }

  async fetchFolder(id) {
    const result = await this.apiService.get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended&depth=children`,
      {headers: { "fetch-document": "properties"}}).toPromise();
    return result;
  }

  async fetchAssets(id: string, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.currentPageCount = 0;
    this.showMoreButton = true;
    this.dataService.folderPermission$.subscribe(data=>this.permissionChange=data)
    if (checkCache && this.folderAssetsResult[id] && !this.permissionChange) {
      console.log("comming");

      return this.folderAssetsResult[id];
    }
    this.dataService.folderPermissionInit(false)
    let url = `/search/pp/advanced_document_content/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&ecm_parentId=${id}&ecm_trashed=false`;
    const result: any = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();
    // result.entries = result.entries.sort((a, b) =>
    //   this.compare(a.title, b.title, true)
    // );
    // result.entries = result.entries.sort((a, b) =>
    //   this.assetTypeCompare(a.type, b.type)
    // );

    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, true)
    );
    const folders = result.entries.filter(entry => [ASSET_TYPE.WORKSPACE_ROOT, ASSET_TYPE.DOMAIN, ASSET_TYPE.FOLDER, ASSET_TYPE.ORDERED_FOLDER, ASSET_TYPE.WORKSPACE].indexOf(entry.type.toLowerCase()) > -1);
    const assets = result.entries.filter(entry => [ASSET_TYPE.FILE, ASSET_TYPE.PICTURE, ASSET_TYPE.VIDEO].indexOf(entry.type.toLowerCase()) > -1);
    result.entries = folders.concat(assets);

    this.numberOfPages = result.numberOfPages;
    this.resultCount = result.resultsCount;
    const res = JSON.stringify(result);
    this.folderAssetsResult[id] = JSON.parse(res);
    delete this.fetchFolderStatus[id];
    return this.folderAssetsResult[id];
  }

  // async fetchAssetsByName(assetName: string) {
  //   this.currentPageCount = 0;
  //   this.showMoreButton = true;
  //   // if (this.folderAssetsResult[id]) {
  //   //   return this.folderAssetsResult[id];
  //   // }
  //   const url = `/path/Ground%20X/workspaces/L1/L2/L3/L4`;
  //   const result: any = await this.apiService.get(url).toPromise();
  //   console.log(JSON.stringify(result));
  //   return result.uid;
  // }

  async fetchBreadCrumbByAssetsUId(assetUid: string) {
    this.currentPageCount = 0;
    this.showMoreButton = true;
    // if (this.folderAssetsResult[id]) {
    //   return this.folderAssetsResult[id];
    // }
    const url = `/id/${assetUid}?fetch-acls=username%2Ccreator%2Cextended&depth=children`;
    const { contextParameters }: any = await this.apiService
      .get(url)
      .toPromise();
    this.extractBreadcrumb(contextParameters);
    return;
  }

  // async showMore(id: string) {
  //   if (
  //     this.searchList.length <
  //     this.selectedFolder.contextParameters.folderAssetsCount
  //   ) {
  //     this.currentPageCount++;
  //     const url = `/search/pp/advanced_document_content/execute?currentPageIndex=${this.currentPageCount}&offset=0&pageSize=${PAGE_SIZE_40}&ecm_parentId=${id}&ecm_trashed=false`;
  //     const result: any = await this.apiService.get(url).toPromise();
  //     this.searchList = this.searchList.concat(result.entries);
  //     this.sortedData = this.searchList.slice();
  //     return;
  //   }
  //   this.showMoreButton = false;
  // }

  handleChangeClick(item, index, selected: any, childIndex?: any) {
    // this.selectedFile = [];
    this.selectedFolder = { ...selected, uid: selected.id };
    this.sharedService.toTop();
    let url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=${PAGE_SIZE_1000}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((docs: any) => {
        this.searchList = docs.entries.filter((sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
        let workSpaceIndex = this.searchList.findIndex((res) => res.title === "Workspaces");
        if (workSpaceIndex >= 0) {
          this.handleChangeClick(this.searchList[workSpaceIndex], index, selected, childIndex);
        } else {
          this.sortedData = this.searchList.slice();
          if (childIndex !== null && childIndex !== undefined) {
            this.folderStructure[index].children[childIndex].children = docs.entries;
            this.folderStructure[index].children[childIndex].isExpand = true;
            this.handleTest(selected);
          } else {
            this.folderStructure[index].children = docs.entries;
            this.folderStructure[index].isExpand = true;
          }
        }
      });
  }

  handleSelectMenu(index, type) {
    this.removeAssets()
    this.selectedMenu = index;
    this.viewType = type;
  }

  checkShowUpdateBtn() {
    return (this.searchList?.length > 0 && this.selectedFolder?.type.toLowerCase() === ASSET_TYPE.WORKSPACE);
  }

  async openUpdateClassModal(breadCrumb: any) {
    // NOTE: uncomment below code
    if (!this.upadtePermission(breadCrumb) || this.sortedData.length < 1) {
      return;
    }
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px";
    dialogConfig.width = "650px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const folder = await this.fetchFolder(this.selectedFolder.uid);
    dialogConfig.data = {
      docs: this.searchList,
      folder,
    };

    const modalDialog = this.matDialog.open(UpdateModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (!result) return;
      const updatedDocs = result.updatedDocs;
      const updatedFolder = result.selectedFolder;
      if (!this.selectedFolder.properties) {
        this.selectedFolder["properties"] = {};
      }
      this.selectedFolder.properties["dc:description"] = updatedFolder.description;
      this.selectedFolder.properties["dc:start"] = updatedFolder.associatedDate;
      Object.keys(updatedDocs).forEach((key) => {
        this.searchList[key].contextParameters.acls = updatedDocs[key].contextParameters.acls;
        this.sortedData[key].contextParameters.acls = updatedDocs[key].contextParameters.acls;
        this.searchList[key].properties = {
          ...this.searchList[key].properties,
          ...updatedDocs[key].properties,
        };
        this.sortedData[key].properties = {
          ...this.sortedData[key].properties,
          ...updatedDocs[key].properties,
        };
      });
      this.showMoreButton = false;
    });
  }

  markFavourite(data, favouriteValue) {
    // this.favourite = !this.favourite;
    if (data.contextParameters.favorites.isFavorite) {
      this.unmarkFavourite(data, favouriteValue);
      return;
    }
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    this.loading = true;
    this.apiService
      .post(apiRoutes.MARK_FAVOURITE, body)
      .subscribe((docs: any) => {
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
        this.loading = false;
      });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    this.loading = true;
    this.apiService
      .post(apiRoutes.UNMARK_FAVOURITE, body)
      .subscribe((docs: any) => {
        // data.contextParameters.favorites.isFavorite = this.favourite;
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
        this.loading = false;
      });
  }

  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
    this.selectAsset(event, file, index);
    if (event.checked || event.target?.checked) {
      this.fileSelected.push(file);
    } else {
      if (this.fileSelected.length) {
        let i = -1;
        this.fileSelected.forEach((item, ind) => {
          if (item.uid === file.uid) {
            i = ind;
          }
        });
        if (i !== -1) {
          this.fileSelected.splice(i, 1); // remove the file from selected files
        }
      }
    }
  }

  getFolderInfo(item) {
    if (item.isTrashed) return item.properties["dc:creator"].id;
    const count = item.contextParameters?.folderAssetsCount || 0;
    return `${count} assets curated by ${item.properties["dc:creator"].id}`;
  }

  copyToClipboard(val: string) {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    // const { uid, sectorName } = this.getSectorUidByName(val);
    // selBox.value = `${window.location.origin}/workspace?sector=${uid}&folder=${encodeURIComponent(this.selectedFolder.title)}`;
    selBox.value = `${window.location.origin}/workspace/${this.sectorSelected.title}/${this.selectedFolder.uid}`;
    this.copiedString = selBox.value;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  getSectorUidByName(breadcrumb: string) {
    const result = this.folderStructure[0].children.find((item) =>
      breadcrumb.includes(item.path)
    );
    return { uid: result.uid, sectorName: result.title };
  }

  toggleDisplayDivIf() {
    this.isShowDivIf = !this.isShowDivIf;
  }

  getSearchPlaceholder(): string {
    if (this.isTrashView) {
      return `Search for folder in trash`;
    }
    return `Search in ${this.sharedService.stringShortener(this.selectedFolder?.title, 19)}`;
  }

  getDateInFormat(date: string): string {
    return new Date(date).toDateString();
  }

  getIconByType(type: string): string {
    switch (type.toLowerCase()) {
      case ASSET_TYPE.WORKSPACE:
        return "../../../assets/images/folder-table-list.svg";
      case ASSET_TYPE.PICTURE:
        return "../../../assets/images/list-viewImg.svg";
      case ASSET_TYPE.VIDEO:
        return "../../../assets/images/list-viewVideo.svg";
      case ASSET_TYPE.FILE:
        return "../../../assets/images/Doc.svg";
      default:
        return "../../../assets/images/folder-table-list.svg";
    }
  }

  showGridListButton() {
    return this.selectedFolder.uid === ROOT_ID;
  }

  deleteModal(listDocs) {
    let deletedFolders = this.searchList.filter((item) =>
      listDocs.includes(item["uid"])
    );
    this.sharedService.showSnackbar(
      "The deleted items will be retained for 180 days in",
      6000,
      "top",
      "center",
      "snackBarMiddle",
      "Deleted items",
      this.getTrashedWS.bind(this)
    );
    this.searchList = this.searchList.filter(
      (item) => !listDocs.includes(item["uid"])
    );
    this.sortedData = this.searchList.slice();
    this.hasUpdatedChildren.push(this.selectedFolder.uid);
    this.selectedFolderList = {};
    deletedFolders.forEach((item) => {
      if (this.folderAssetsResult[item.parentRef]) {
        const index = this.folderAssetsResult[item.parentRef].entries.findIndex(
          (entry) => entry.uid === item.uid
        );
        this.folderAssetsResult[item.parentRef].entries.splice(index, 1);
      }
    });
  }

  deleteModalFailed() {
    this.sharedService.showSnackbar(
      "You can't delete a folder contains assets uploaded by other users",
      6000,
      "top",
      "center",
      "snackBarMiddle",
    );
  }

  moveModalFailed() {
    this.sharedService.showSnackbar(
      "You can't move/copy this asset",
      6000,
      "top",
      "center",
      "snackBarMiddle",
    );
  }

  recoverModal(listDocs) {
    let recoveredFolders = this.trashedList.filter((item) =>
      listDocs.includes(item["uid"])
    );
    this.sharedService.showSnackbar(
      "Successfully recovered.",
      3000,
      "top",
      "center",
      "snackBarMiddleRecover"
    );
    this.trashedList = this.trashedList.filter(
      (item) => !listDocs.includes(item["uid"])
    );
    this.searchList = this.trashedList;
    this.sortedData = this.searchList.slice();
    // this.hasUpdatedChildren.push(this.selectedFolder.uid);
    this.selectedFolderList = {};
    recoveredFolders.forEach(
      (item) =>
        this.folderAssetsResult[item.parentRef] &&
        this.folderAssetsResult[item.parentRef].entries.push(item)
    );
  }

  selectFolder($event, item, i, updateCount = true) {
    if ($event.target?.checked || $event.checked) {
      if (updateCount) this.count = this.count + 1;
      this.selectedFolderList[i] = item;
      this.selectedMoveList[i] = item;
    } else {
      if (updateCount) this.count = this.count - 1;
      delete this.selectedFolderList[i];
      delete this.selectedMoveList[i];
    }
  }

  async deleteFolders() {
    if (Object.keys(this.selectedFolderList).length == 0) return;
    this.loading = true;

    const listDocs = Object.entries(this.selectedFolderList)
    .filter(([key, item]) => this.checkCanDelete(item)).map(function (
      [key, item],
      index
    ) {
      return item["uid"];
    });
    await this.apiService
      .post(apiRoutes.TRASH_DOC, { input: `docs:${listDocs.join()}` })
      .subscribe((docs: any) => {
        this.loading = false;
        this.deleteModal(listDocs);
        this.removeAssets()
      }, (err => {
        this.loading = false;
        this.deleteModalFailed();
      }));
  }

  async unTrashFolders() {
    console.log("selectedFolderList",this.selectedFolderList);
    
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

  checkEnableDeleteBtn() {
    return Object.keys(this.selectedFolderList).length > 0;
  }


  getTrashedWS(pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.initialLoad = false;
    this.showSearchbar = true;
    this.searchBarValue = "";
    offset || this.paginator?.firstPage();
    if (this.folderNotFound) {
      this.folderNotFound = false;
      this.selectedFolder = {};
    }
    this.loading = true;
    const url =this.myDeletedCheck ?
     `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 1 AND dc:creator = '${this.user}' `:
     `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 1'`
     this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .subscribe((docs: any) => {
        this.numberOfPages = docs.numberOfPages;
        this.resultCount = docs.resultsCount;
        this.trashedList = docs.entries.filter((sector) => {
          if (UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1) {
            --this.resultCount;
            return true;
          } else {
            return false;
          }
        });
        // if (!this.myDeletedCheck) {
        //   this.searchList = this.trashedList;
        //   this.sortedData = this.searchList.slice();
        // } else {
        //   this.deletedByMeFilter().then(() => {
        //     this.searchList = this.deletedByMe;
        //     this.sortedData = this.searchList.slice();
        //   });
        // }
        this.searchList = this.trashedList;
        this.sortedData = this.searchList.slice();
        this.isTrashView = true;
        this.handleSelectMenu(1,"LIST");
        this.showMoreButton = false;
        this.loading = false;
        // this.deletedByMeFilter();
      });
  }

  async deletedByMeFilter() {
    let userData = localStorage.getItem("user");
    // console.log("userData", JSON.parse(userData));
    this.deletedByMe = this.trashedList.filter(
      (m) => m.properties["dc:creator"].id === JSON.parse(userData).username
    );
  }

  myDeleted(e) {
    // if (e.target.checked) {
      this.myDeletedCheck = e.target.checked;
      this.getTrashedWS()
      // this.searchList = this.deletedByMe;

  }

  checkCanDelete(item) {
    return this.user === item.properties["dc:creator"]?.id || this.user === item.properties["dc:creator"];
  }

  async fetchUserData() {
    if (localStorage.getItem("user")) {
      this.user = JSON.parse(localStorage.getItem("user"))["username"];
      this.userSector = JSON.parse(localStorage.getItem("user"))["sector"];
      if (this.user) return;
    }
    if (this.nuxeo.nuxeoClient) {
      const res = await this.nuxeo.nuxeoClient.connect();
      this.user = res.user.id;
      localStorage.setItem("user", JSON.stringify(res.user.properties));
    }
  }

  checkShowNoTrashItem() {
    return !this.isTrashView && this.searchList && this.searchList.length === 0;
  }
  dropFilesNew=[];
  openModal(key?:boolean) {
    if(key) this.dropFilesNew=[]
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "100%";
    dialogConfig.maxHeight = "92vh"
    dialogConfig.width = "80vw";
    dialogConfig.disableClose = true;
    this.selectedFolder["sectorId"] = this.selectedFolder2.uid;
    dialogConfig.data = this.selectedFolder;
    dialogConfig.data.isPrivate = this.isPrivateFolder();
    dialogConfig.data.dropFilesNew = this.dropFilesNew;
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
    modalDialog.afterClosed().subscribe((result) => {
      if (!result) return;
      this.folderAssetsResult[
        this.breadCrumb[this.breadCrumb.length - 1].uid
      ].entries.unshift(result);
      this.searchList.unshift(result);
      this.sortedData = this.searchList.slice();
      this.showMoreButton = false;
    });
  }

  openNewFolderDiv() {
    this.showFolder = !this.showFolder;
  }

  titleExists:boolean=false
  async createFolder(folderName: string, date?: string, description?: string) {

    if (!this.folderNameRef) {
      this.showError = true;
    } else {
      let checkTitle = this.CheckTitleAlreadyExits(folderName)
      if(checkTitle) {
        // this.showFolder = false
        // this.showMoreButton = false;
        // this.checkboxIsPrivate = false;
        // // $(".dropdownCreate").hide();
        // $(".buttonCreate").removeClass("createNewFolderClick");
        return this.titleExists = true
      }
      this.createFolderLoading = true;
      const backupPath = this.selectedFolder.path;
      let url = `/path${this.selectedFolder.path}`;
      if (this.selectedFolder.type.toLowerCase() === "domain") {
        url = `/path${this.selectedFolder.path}/workspaces`;
        this.selectedFolder.path = `${this.selectedFolder.path}/workspaces/null`;
        this.selectedFolder.childType = FOLDER_TYPE_WORKSPACE;
      } else {
        this.selectedFolder.childType = ORDERED_FOLDER;
      }

      const payload = await this.sharedService.getCreateFolderPayload(
        folderName?.trim(),
        this.selectedFolder2.title,
        this.selectedFolder,
        description,
        date,
        this.checkboxIsPrivate
      );
      this.selectedFolder.path = backupPath;
      const res = await this.apiService.post(url, payload, {headers: { "fetch-document": "properties"}}).toPromise();
      this.createFolderLoading = false;
      if (!res && !res["uid"]) return;

      this.searchList.unshift(res);
      this.sortedData = this.searchList.slice();
      this.folderAssetsResult[this.selectedFolder.uid].entries.unshift(res);
      this.showMoreButton = false;
      this.checkboxIsPrivate = false;
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
      this.sharedService.showSnackbar(
        `${folderName} folder successfully created.`,
        3000,
        "top",
        "center",
        "snackBarMiddle"
      );
      this.showFolder = false;
      if (!this.hasUpdatedChildren.includes(this.selectedFolder.uid)) {
        this.hasUpdatedChildren.push(this.selectedFolder.uid);
      }

      this.folderNameRef = undefined;
      this.titleExists = false
      this.folderDescriptionRef = undefined;
      this.folderDateRef = undefined;

      return {
        id: res["uid"],
        title: res["title"],
        type: res["type"],
        path: res["path"],
      };
    }
  }

  checkShowCreateFolder() {
    return this.selectedFolder?.type === "Domain";
  }

  // showHideCreateFolder() {
  //   // $(document).ready(function(){
  //   // })
  // }

  sortData(sort: Sort) {
    const data = this.searchList.slice();
    if (!sort.active || sort.direction === "") {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "title":
          return this.compare(a.title, b.title, isAsc);
        case "dc:creator":
          return this.compare(
            a.properties["dc:creator"].properties?.firstName || a.properties["dc:creator"].id,
            b.properties["dc:creator"].properties?.firstName || b.properties["dc:creator"].id,
            isAsc
          );
        case "dc:created":
          return this.compare(
            a.properties["dc:created"],
            b.properties["dc:created"],
            isAsc
          );
        case "dc:start":
          return this.compare(
            a.properties["dc:start"],
            b.properties["dc:start"],
            isAsc
          );
        case "dc:sector":
          return this.compare(
            a.properties["dc:sector"],
            b.properties["dc:sector"],
            isAsc
          );
        case "dc:modified":
          return this.compare(
            a.properties["dc:modified"],
            b.properties["dc:modified"],
            isAsc
          );
          case "file:content":
          return this.compare(
            a.properties["file:content"],
            b.properties["file:content"],
            isAsc
          );
        default:
          return 0;
      }
    });
    this.sortedData.sort(this.assetTypeCompare);
  }

  /**
   * brings folder to top position and then assets
   */
  assetTypeCompare(a: string , b: string): number {
    return [ASSET_TYPE.WORKSPACE, ASSET_TYPE.FOLDER, ASSET_TYPE.ORDERED_FOLDER].indexOf(a.toLowerCase()) > -1? -1 : 1;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  renameFolderAction() {
    if (this.selectedFolder.title==='General') {
        this.sharedService.showSnackbar(
          "You do not have permission to update this folder",
          6000,
          "top",
          "center",
          "snackBarMiddle"
          // "Updated folder",
          // this.getTrashedWS.bind(this)
        );

    }else{
      // this.fetchFolder(this.selectedFolder.uid).then((res:any)=>{
      //   console.log("resssssss",res);
      //   let realPath = res.path.split("/")
      //   realPath.pop()
      //   let path =  realPath.join("/")
      //   console.log("path",path, realPath);

      //   this.getAllFolders({uid:res.parentRef,path})
      // })
      this.newTitle =this.selectedFolder.title;
      this.renameFolderName = true;
    }
  }

  updateFolderAction() {
    this.renameFolderName = false;
    this.newTitle =this.selectedFolder.title
  }

  renameFolder(title?: string, assetUid?: number) {
    let { newTitle, selectedFolder } = this;
    if (newTitle?.trim() ===selectedFolder.title) return this.updateFolderAction();

    this.apiService
      .post(apiRoutes.DOCUMENT_UPDATE, {
        input: assetUid || selectedFolder.uid,
        params: {
          properties: {
            "dc:title": title?.trim() || newTitle?.trim(),
          },
        },
      })
      .subscribe((res: any) => {
        let msg;
        if(!title && !assetUid) {
            this.updateFolderAction();

            this.handleTest(res);
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
          // "Updated folder",
          // this.getTrashedWS.bind(this)
        );
      });
  }

  checkForDescription(): boolean {
    return !!this.selectedFolder?.properties?.["dc:description"];
  }

  getSelectedAssetsSize() {
    let size = 0;
    this.sortedData.forEach((doc) => {
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

  async handleClickNew(folderUid: string) {
    this.selectedFolderList = {};
    this.count = 0;
    this.loading = true;
    this.isTrashView = false;
    await this.fetchCurrentFolderAssets(folderUid);
    this.loading = false;
  }
  initialLoad:Boolean= true
  async getWorkspaceFolders(sectorUid: string, viewType = 1) {
    console.log("getWorkspaceFolders");

    this.showSearchbar = true;
    // this.loading = true;
    let { entries, numberOfPages, resultsCount } = await this.fetchAssets(sectorUid);
    let workSpaceIndex: number;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    if (!entries?.length) {
      this.sortedData = [];
      this.searchList = [];
      this.showLinkCopy = true;
      // this.loading = false;
      return;
    }
    workSpaceIndex = entries.findIndex((res) => res.title === "Workspaces");
    if (workSpaceIndex !== -1) {
      this.sectorWorkspace = entries[workSpaceIndex];
    }
    if (workSpaceIndex === -1) {
      this.sortedData = entries;
      this.searchList = entries;
      this.showLinkCopy = true;
      // this.loading = false;
      return;
    }
    ({ entries, numberOfPages, resultsCount } = await this.fetchAssets(
      entries[workSpaceIndex].uid
    ));
    this.sortedData = entries;
    this.searchList = entries;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.showLinkCopy = false;
    this.selectedMenu = viewType;
    // this.showSearchbar = true;
    this.extractBreadcrumb();
    // this.loading = false;
  }

  async fetchAllSectors(isExpand = false) {
    this.showSearchbar = false;
    // this.loading = true;
    this.isTrashView = false;
    this.sectorSelected = null;
    this.sharedService.toTop();
    const { entries } = await this.fetchAssets(ROOT_ID, true, PAGE_SIZE_200);
    this.folderStructure[0]["children"] = entries;
    this.folderStructure[0].isExpand = !isExpand;
    this.searchList = entries;
    this.selectedMenu = 1;
    this.createDynamicSidebarScroll();
    return;
    // this.loading = false;
  }

  async fetchCurrentFolderAssets(sectorUid: string, showLinkCopy = true, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.loading = true;
    const { entries, numberOfPages, resultsCount } = await this.fetchAssets(
      sectorUid,
      checkCache,
      pageSize,
      pageIndex,
      offset
    );
    this.sortedData = entries;
    this.searchList = entries;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.extractBreadcrumb();
    this.showLinkCopy = showLinkCopy;
    this.showSearchbar = true;
    this.loading = false;
  }

  createDynamicSidebarScroll() {
    setTimeout(() => {
      var storeHeight = $(".main-content").outerHeight();
      $(".leftPanel.insideScroll").css("height", storeHeight - 80);
    }, 0);
  }

  upadtePermission(breadcrumb: any) {
    let user: any;
    let checkAvailabity = Departments.hasOwnProperty(this.userSector);
    if (checkAvailabity) {
      let ID = Departments[this.userSector];
      user = Workspace[ID];
    }

    if (breadcrumb?.title?.toLowerCase() === user?.toLowerCase()) return true;
    return false;
  }

  /**
   * @param event = {previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 100};
   */
  paginatorEvent(event: PageEvent) {
    const offset = event.pageIndex * event.pageSize;
    if (!this.isTrashView) {
      let uid = this.selectedFolder.uid;
      let showLinkCopy = true;
      if (this.selectedFolder.type.toLowerCase() === "domain") {
        uid = this.sectorWorkspace.uid;
        showLinkCopy = false;
      }
      this.fetchCurrentFolderAssets(
        uid,
        showLinkCopy,
        false,
        event.pageSize,
        event.pageIndex,
        offset
      );
    } else {
      this.getTrashedWS(event.pageSize, event.pageIndex, offset);
    }
  }

  async searchFolders(searchString: string) {
    // this.loading = true;
    let query;
    if (this.isExternalView && !this.selectedFolder.uid && !this.selectedFolder.path) {
      query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:primaryType = 'Workspace' AND dc:isPrivate = 1 AND dc:title ILIKE '%${searchString}%'`;
    } else {
      const path = this.sectorSelected.uid === this.selectedFolder.uid ?
      `/${this.sectorSelected.title}/workspaces/` :
      `${this.selectedFolder.path}/`;
      query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0  AND ecm:path STARTSWITH '${path.replace(/(["'])/g, "\\$1")}' AND dc:title ILIKE '%${searchString}%'`;
    }
    query = encodeURIComponent(query);
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
        ASSET_TYPE.WORKSPACE].indexOf(entry.type.toLowerCase()) > -1
        );
    const assets = result.entries.filter(entry => [ASSET_TYPE.FILE, ASSET_TYPE.PICTURE, ASSET_TYPE.VIDEO].indexOf(entry.type.toLowerCase()) > -1);
    result.entries = folders.concat(assets);
    // result.entries = result.entries.sort((a, b) =>
    //   this.assetTypeCompare(a.type, b.type)
    // );
    this.numberOfPages = result.numberOfPages;
    this.resultCount = result.resultsCount;
    this.sortedData = result.entries;
    this.searchList = result.entries;
    // this.loading = false;
  }

  navigateToWorkspaceFolder(uid: string, index?: number, breadCrumbIndex?: number) {
    if(this.routeParams.folderId === uid) {
      return;
    }
    const path = this.sectorSelected?.path.split("/");
    // NOTE: todo, refactor if-else
    if(breadCrumbIndex === 0) {
      this.router.navigate([ASSET_TYPE.WORKSPACE]);
    } else  if(breadCrumbIndex === 1) {
      this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title]);
    } else if(!isNaN(index)) {
      this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title, uid]);
    } else {
      this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title, uid]);
      // else this.router.navigate([ASSET_TYPE.WORKSPACE, this.sectorSelected.title]);
    }
  }

  saveState({uid, title, path, properties, sectorId, type, contextParameters}, index?: number, breadCrumbIndex?: number) {
    // let breadcrumb;
    // if(contextParameters) {
    //   ({breadcrumb} = contextParameters);
    //   contextParameters = { breadcrumb };
    // }
    const workspaceState = JSON.stringify({title, uid, path, properties, sectorId, type, contextParameters});
    localStorage.setItem('workspaceState', workspaceState);
    this.navigateToWorkspaceFolder(uid, index, breadCrumbIndex);
    return;
  }

  inputChange() {
    if (!this.folderNameRef) {
      this.showError = true;
    } else {
      this.showError = false;
      this.titleExists = false
    }
  }

  getCreatorName(item) {
    const creatorName = item.properties["dc:creator"]?.properties?.firstName +
      " " + item.properties["dc:creator"]?.properties?.lastName;

      if(item.properties["dc:creator"]?.properties?.firstName) {
        return creatorName;
      } else if(item.properties["dc:creator"]?.id) {
        return item.properties["dc:creator"]?.id;
      } else {
        return item.properties["dc:creator"];
      }
  }

  multiDownload() {
    if (
      this.downloadArray.length > 0 &&
      this.copyRightItem.length < 1 &&
      !this.sizeExeeded &&
      this.forInternalUse.length < 1 &&
      this.needPermissionToDownload.length < 1
    ) {
      this.downloadAssets();
    } else {
      $(".downloadFileWorkspace").on("click", function (e) {
        // $(".dropdownCreate").toggle();
        $(".multiDownloadBlock").show();
        $(".downloadFileWorkspace").addClass("multiDownlodClick");
        e.stopPropagation();
      });
      $(".downloadFileWorkspace.multiDownlodClick").on("click", function (e) {
        $(".multiDownloadBlock").hide();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
        e.stopPropagation();
      });

      $(".multiDownloadBlock").click(function (e) {
        e.stopPropagation();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
      });

      $(document).click(function () {
        $(".multiDownloadBlock").hide();
        $(".downloadFileWorkspace").removeClass("multiDownlodClick");
      });
    }
  }

  downloadClick() {
    if (!this.downloadEnable) {
      this.downloadErrorShow = true;
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

  forInternalUse: any = [];
  downloadArray: any = [];
  sizeExeeded: boolean = false;
  forInternaCheck: boolean = false;
  downloadFullItem: any = [];
  needPermissionToDownload: any = [];
  count: number = 0;
  copyRightItem: any = [];
  canNotDelete: any = [];

  selectAsset($event, item, i) {
    let canDelete = this.checkCanDelete(item)
    if(canDelete){
      this.selectFolder($event, item, i, false);
    }
    if ($event.target?.checked || $event.checked) {
      if ($event.from !== "rightClick") {
        this.count = this.count + 1;
      }
      
      this.selectedMoveList[i] = item;
      if (!canDelete) {
        this.canNotDelete.push(item)
      }
       if (
         item.properties['sa:copyrightName'] !== null &&
         item.properties['sa:copyrightName'] !== ""
       ) {
         this.copyRightItem.push(item.uid);
       }
      if (item.properties["sa:downloadApprovalUsers"].length > 0) {
        this.needPermissionToDownload.push(item);
      } else {
        if (item.properties["sa:access"] === "Internal access only") {
          this.forInternalUse.push(item.uid);
        }
        this.downloadArray.push(item.uid);
        this.downloadFullItem.push(item);
      }
    } else {
      //  if (!$event.target?.checked || !$event.checked) {
      this.forInternalUse = this.forInternalUse.filter((m) => m !== item.uid);
      this.downloadArray = this.downloadArray.filter((m) => m !== item.uid);
      this.copyRightItem = this.copyRightItem.filter((m) => m !== item.uid);
      this.downloadFullItem = this.downloadFullItem.filter(
        (m) => m.uid !== item.uid
      );
      this.needPermissionToDownload = this.needPermissionToDownload.filter(
        (m) => m.uid !== item.uid
      );
      this.canNotDelete = this.canNotDelete.filter(
        (m) => m.uid !== item.uid
      );
      delete this.selectedMoveList[i];
      this.count = this.count - 1;
      //  }
    }
    this.getdownloadAssetsSize();
  }

  getUser(item) {
    return item.properties["sa:downloadApprovalUsers"];
  }

  getdownloadAssetsSize() {
    let size = 0;
    if (this.downloadArray.length > 0) {
      this.downloadFullItem.forEach((doc) => {
        size = size + parseInt(doc.properties["file:content"]?.length);
      });
      let sizeInGB = size / 1024 / 1024 / 1024;

      if (sizeInGB > 1) {
        this.sizeExeeded = true;
      } else {
        this.sizeExeeded = false;
      }
    } else {
      this.sizeExeeded = false;
    }
  }

  downloadAssets(e?:any) {
    // this.uncheckAll1()
    if (!this.downloadEnable && this.forInternalUse.length > 0) {
      return;
    } else {
      if (this.downloadArray.length > 0) {
        $(".multiDownloadBlock").hide();
        let r = Math.random().toString().substring(7);
        let input = "docs:" + JSON.parse(JSON.stringify(this.downloadArray));
        let uid: any;
        let data = this.apiService
          .downloaPost("/automation/Blob.BulkDownload/@async", {
            params: {
              filename: `selection-${r}.zip`,
            },
            context: {},
            input,
          })
          .subscribe((res: any) => {
            let splittedLocation = res.headers.get("location").split("/");
            let newUID = splittedLocation[splittedLocation.length - 2];
            uid = newUID;
            // setTimeout(() => {
            //   window.open(
            //     environment.apiServiceBaseUrl +
            //       "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
            //       uid
            //   );
            //   this.removeAssets();
            // }, 10000);
            let counter = 0
            let checkZipCompleted=(newUID) =>{
                  this.loading = true
                  this.apiService
                .downloadGet("/automation/Blob.BulkDownload/@async/" + newUID)
                .toPromise().then((resp: any) => {
                }).catch(e=>{
                  console.error("2222222222222",e)
                  counter += 1

                  if (e.status ==404) {
                     checkZipCompleted(newUID)
                  }else{
                    this.loading = false
                    window.open(
                      environment.apiServiceBaseUrl +
                        "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
                        uid
                    );
                    this.removeAssets();
                  }
                 
                });
              
            }
            checkZipCompleted(uid)
          });
      }
    }
  }

  removeAssets() {
    this.forInternalUse = [];
    this.downloadArray = [];
    this.sizeExeeded = false;
    this.forInternaCheck = false;
    this.downloadFullItem = [];
    this.needPermissionToDownload = [];
    this.count = 0;
    this.fileSelected = [];
    this.copyRightItem = []
    this.canNotDelete=[]
    this.selectedFolderList={}
    this.selectedMoveList={}
    // this.isAware=false
    // $(".vh").prop("checked", false);
    this.sortedData.forEach((e) => (e.isSelected = false));
  }

  cancelDownloadClick(e) {
    e.stopPropagation();
    $(".multiDownloadBlock").hide();
  }

  uncheckAll1() {
    $(".uncheckAfterSuccess").click(function () {
      $("input:checkbox").removeAttr("checked");
    });
  }


  async openManageAccessModal() {
    // this.loading = true;
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "550px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    // const folder = await this.fetchFolder(this.selectedFolder.uid);
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));
    dialogConfig.data = {
      selectedFolder: selectedFolder || this.selectedFolder,
    }

    const modalDialog = this.matDialog.open(ManageAccessModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedFolder = result;
        if (result?.properties && result?.properties["dc:isPrivate"]) result.properties['isPrivateUpdated'] = true;
        this.saveState(result);
      }
      // this.loading = false;
    });
  }

  async openAddUserModal() {
    if (!this.isAdmin) return;
    const folderCollaborators = this.getFolderCollaborators();
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "640px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const folder = await this.fetchFolder(this.selectedFolder.uid);
    dialogConfig.data = {
      selectedFolder: this.selectedFolder,
      folderId: this.selectedFolder.uid,
      folderCollaborators
    }

    const modalDialog = this.matDialog.open(AddUserModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.saveState(result);
      }
    });
  }

  canSetAsPrivate() {
    return !this.isPrivateFolder();
  }

  isPrivateFolder(isButton = true, includeChild = false) {
    if (!this.hasInheritAcl() && !includeChild) return false;
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));

    const isPrivate = selectedFolder?.properties && selectedFolder?.properties["dc:isPrivate"];
    if (isButton) return isPrivate;
    const currentCollaborators = this.getFolderCollaborators();
    this.isAdmin = this.hasAdminPermission(currentCollaborators);
    return isPrivate && this.hasNoOtherCollaborators(currentCollaborators)
  }

  hasNoOtherCollaborators(currentCollaborators) {
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return true;
    const otherUser = Object.keys(currentCollaborators).find(id => this.user !== id);
    if (otherUser) return false;
    else return true;
  }

  hasAdminPermission(currentCollaborators) {
    if (this.user === "Administrator") return true;
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));
    if (selectedFolder?.properties && selectedFolder?.properties['isPrivateUpdated']) return true;
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return false;
    const ace = currentCollaborators[this.user];
    if (!ace) return false;
    return ace.permission === 'Everything';
  }

  hasInheritAcl() {
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));
    if (selectedFolder?.properties && selectedFolder?.properties['isPrivateUpdated']) return true;
    if (!selectedFolder?.contextParameters?.acls) return false;
    const inheritAcl = selectedFolder.contextParameters.acls.find(acl => acl.name === 'local');
    if (!inheritAcl?.aces) return false;
    return true;
  }

  getFolderCollaborators() {
    const selectedFolder = JSON.parse(localStorage.getItem('workspaceState'));
    if (!selectedFolder?.contextParameters?.acls) return [];
    const localAces = selectedFolder.contextParameters.acls.find(acl => acl.name === 'local');
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

  removeWorkspacesFromString(data: string, title: string): string {

    let dataWithoutWorkspace = this.sharedService.stringShortener(this.sharedService.removeWorkspacesFromString(data), 35);
    return dataWithoutWorkspace.replace('/'+title, '');
  }

  CheckTitleAlreadyExits(name){
    let titles = this.allFolders.map((m:any)=>m.title.toLowerCase().trim())
    if(titles.indexOf(name?.toLowerCase().trim()) !== -1) return true
    return false
  }

  initSharedRoot() {
    return {
      title: "Shared Folders",
    }
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

    this.searchList = result['entries'];
    this.sortedData = this.searchList.slice();

    this.handleSelectMenu(1, this.viewType || "LIST");
    localStorage.setItem('workspaceState', JSON.stringify({}));
    this.selectedFolder = this.initSharedRoot();
    this.selectedFolder2 = this.initSharedRoot();
    this.showSearchbar = true;
    this.showLinkCopy = false;
    this.breadCrumb = [];
  }

  isExternalUser() {
    return this.listExternalUser.includes(this.user) && !this.listExternalUserGlobal.includes(this.user);
  }

  checkExternalUser() {
    return this.listExternalUser.includes(this.user);
  }

  async fetchExternalUserInfo(fetchAll = false) {
    await this.sharedService.fetchExternalUserInfo();
    this.listExternalUser = JSON.parse(localStorage.getItem("listExternalUser"));
    this.listExternalUserGlobal = JSON.parse(localStorage.getItem("listExternalUserGlobal"));
    if (!this.isExternalUser()) return;
    this.isExternalView = true;
    if (fetchAll) this.fetchAllPrivateWorkspaces();
  }

  copyLink(asset: IEntry, assetType: string) {
    asset.copy = this.sharedService.copyLink(asset.uid, assetType, asset.properties['dc:sector']);
  }

  editableAsset() {
    const index = this.sortedData.findIndex(item => item.uid === this.downloadArray[0]); //NOTE: downloadArray will have only 1 item when editing asset name
    this.sortedData[index]['edit'] = !this.sortedData[index]['edit'];
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

  allFolders:[]
  async getAllFolders(folder?:any){
    let currentState = this.folderAssetsResult[folder.uid]?.entries?.filter(r => r.title == "Workspaces")
    if(currentState.length){
      const path = folder.path?.replace(/(["'])/g, "\\$1");
      let url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=${PAGE_SIZE_1000}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${currentState[0]?.uid}' AND ecm:mixinType = 'Folderish' AND ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:path STARTSWITH '${encodeURIComponent(path)}'`;
      const result: any = await this.apiService
          .get(url, { headers: { "fetch-document": "properties" } })
          .toPromise();

     this.allFolders = result?.entries
    }else{
      let currentState1 = this.folderAssetsResult[folder.uid]?.entries?.filter(r => r.type == "OrderedFolder")
      this.allFolders = currentState1
    }
  }

  folderNameChange(){
    console.log("this.titleExists",this.titleExists);

    return this.titleExists = false
  }

  checkShowManageAccessButton() {
    if (this.selectedFolder.properties['dc:isPrivate']) return false;
    const userData = localStorage.getItem("user");

    return this.selectedFolder.properties["dc:creator"].id === JSON.parse(userData).username
     || this.selectedFolder.properties["dc:creator"] === JSON.parse(userData).username;
  }

  handleChange(event, name: string) {
    if (event.checked || event.target?.checked) {
      if(name == 'published') {
        this.publishingAssets = true;
        this.publishingPrivateAssets = false;
        this.checkboxIsPrivate = false
      }
      if(name == 'private') {
        this.publishingAssets = false;
        this.publishingPrivateAssets = true;
        this.checkboxIsPrivate = true

      }
    }
  }

  checkCanMove(m){
      return  ["workspace", "folder", "orderedfolder"].indexOf(m.type.toLowerCase()) !== -1
  }

  async openMoveModal() {
    const listDocs = Object.values(this.selectedMoveList)
    .filter( item => !this.checkDownloadPermission(item))
   console.log("listDocslistDocs",listDocs);

    if (!listDocs.length) return this.moveModalFailed()
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "660px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    dialogConfig.data = {
      selectedList: this.selectedMoveList,
      parentId: this.sectorSelected.uid,
      sectorList: this.folderStructure[0]?.children || [],
      user:this.user
    }

    const modalDialog = this.matDialog.open(MoveCopyAssetsComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        delete this.folderAssetsResult[result.uid];
        delete this.folderAssetsResult[this.selectedFolder.uid];
        this.removeAssets();
        this.loading = true;
        setTimeout(() => {
          if (this.selectedFolder.type === 'Domain') window.location.reload();
          else this.handleClickNew(this.selectedFolder.uid);
        }, 1000);
      }
    });
  }

  checkDownloadPermission(item){
    if (item.properties["sa:downloadApprovalUsers"]?.length >0 || item.properties["dc:isPrivate"]) return true;
    return false
  }

  checkEnableMoveButton() {
    let processAble = []
    if (Object.keys(this.selectedMoveList).length) {
       for (const key in this.selectedMoveList) {
        if(!this.checkDownloadPermission(this.selectedMoveList[key])){
          processAble.push(true)
        }
      }
    }
    return processAble.length>0 
  }

  checkEnableMoveButton1() {
    if (Object.keys(this.selectedMoveList)?.length > 0) {
      if (this.selectedFolder.properties["dc:isPrivate"]) return false;
    }
    return Object.keys(this.selectedMoveList)?.length > 0;
  }
  markIsPrivate(data: IEntry) {
    this.sortedData.forEach(item => {
      if(item.uid === data.uid) {
        item.properties['dc:isPrivate'] = data.properties['dc:isPrivate'];
      }
    });

  }

  manageAccessPublished() {
    $(".publishedOpen").on("click", function (e) {
      $(".manageAccessPopup").show();
      $(".publishedOpen").addClass("publishedClick");
      e.stopPropagation();
    });
    $(".publishedOpen.publishedClick").on("click", function (e) {
      $(".manageAccessPopup").hide();
      $(".publishedOpen").removeClass("publishedClick");
      e.stopPropagation();
    });

    $(".mouseHoverInfo.manageAccessPopup").click(function (e) {
      e.stopPropagation();
      $(".manageAccessPopup").show();
      $(".publishedOpen").removeClass("publishedClick");
    });

    $(document).click(function (e) {
      if (!$(e.target).hasClass("publishedOpen") && $(e.target).parents(".manageAccessPopup").length === 0) {
        $(".manageAccessPopup").hide();
        $(".publishedOpen").removeClass("publishedClick");
      }
    });
  }

  rightClickedItem:any =null;
  rightClickedIndex:number;
  rightDownload:boolean=false;
  onRightClick(item?:any,i?:number) {
    this.rightClickedItem = item ? item : this.rightClickedItem
    this.rightClickedIndex = i

   
    $(document).click(function (e) {
      if (!$(e.target).hasClass("groupFolder") && $(e.target).parents(".availableActions").length === 0) {
        $(".availableActions").hide();
      } else {
        $(".availableActions").show();
      }
    });
    if(this.count == 0){
      this.removeAssets()
      this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
    }
    return false;
  }


  rightClickDownload(){
    if (this.count >0) return this.multiDownload();
    // this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
    this.multiDownload();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
  }

  rightClickMove(){
    if (this.count >0) return this.openMoveModal();
    // this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
     this.openMoveModal();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
    }

  rightClickDelete(){
     if (this.count >0) return this.deleteFolders();
    // this.selectFolder({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
    this.deleteFolders();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
  }
  rightClickRename(item){
    if (this.count < 2) {
      return item.edit =!item.edit
    }
    
  }

  contextMenuPosition = { x: '0px', y: '0px' };

  onContextMenu(event: MouseEvent, item: any) {
    if(!this.checkGeneralFolder(item) && !this.isTrashView) {
      console.log('contextMenu', item);
      event.preventDefault();
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      this.contextMenu.menuData = { 'item': item };
      this.contextMenu.menu.focusFirstItem('mouse');
      this.contextMenu.openMenu();

      $(document).click( (e)=> {
        if (!$(e.target).hasClass("groupFolder") && $(e.target).parents(".availableActions").length === 0 && this.count == 0) {
          // $(".availableActions").hide();
          this.removeAssets()
        }
      });

      this.rightClickedItem = item ? item : this.rightClickedItem
      if(this.count == 0){
        this.removeAssets()
        this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem, '')
      }
    }
  }
  checkFolderContains(){
    return Object.values(this.selectedFolderList).length <1
  }
}
