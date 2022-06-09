import { HttpClient } from "@angular/common/http";
import { Component, OnInit, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ApiService } from "../../services/api.service";
import { PreviewPopupComponent } from "src/app/preview-popup/preview-popup.component";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxMasonryComponent } from "ngx-masonry";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { UpdateModalComponent } from "../../update-modal/update-modal.component";
import { SharedService } from "src/app/services/shared.service";
import {
  ASSET_TYPE,
  constants,
  localStorageVars,
  PAGE_SIZE_200,
  PAGE_SIZE_1000,
  PAGE_SIZE_40,
  PAGE_SIZE_20,
  WORKSPACE_ROOT,
  ROOT_ID,
  ORDERED_FOLDER,
} from "src/app/common/constant";
import { apiRoutes } from "src/app/common/config";
import { NuxeoService } from "src/app/services/nuxeo.service";
import { UNWANTED_WORKSPACES } from "../../upload-modal/constant";
import { UploadModalComponent } from "src/app/upload-modal/upload-modal.component";
import { Sort } from "@angular/material/sort";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { DataService } from "src/app/services/data.service";

@Component({
  selector: "app-browse",
  // directives: [Search],
  templateUrl: "./browse.component.html",
  styleUrls: ["./browse.component.css"],
})
export class BrowseComponent implements OnInit {
  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  @ViewChild("previewModal") previewModal: PreviewPopupComponent;
  // @ViewChild('uploadModal') uploadModal: UploadModalComponent;
  @ViewChild("paginator") paginator: MatPaginator;

  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    private apiService: ApiService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    public nuxeo: NuxeoService,
    public dataService: DataService
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
  selectedMenu = 0;
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
  viewType = "GRID";
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
  trashedList = null;
  deletedByMe: any;
  myDeletedCheck: boolean = true;
  user = null;
  userSector;
  isTrashView = false;
  needReloadWs = [];
  hasUpdatedChildren = [];
  sortedData;
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

  // routeParams = {
  //   sector: "",
  //   folder: "",
  // };
  breadcrrumb = `/${WORKSPACE_ROOT}`;
  showFolder = false;

  ngOnInit(): void {
    this.fetchUserData();
    this.route.queryParams.subscribe(async (params) => {
      this.loading = true;
      // this.routeParams.folder = params.folder;

      if (params.folder && params.folder !== ROOT_ID) {
        this.fetchAllSectors();
        await this.fetchBreadCrumbByAssetsUId(params.folder);
        this.selectedFolder2 = this.breadCrumb[0];
        this.sectorSelected = this.breadCrumb[0];
        this.selectedFolder = this.breadCrumb[this.breadCrumb.length - 1];
        if(this.selectedFolder.isTrashed) {
          this.folderNotFound = true;
          this.loading = false;
          return;
        }
        // this.fetchCurrentFolderAssets(params.folder);
        this.getWorkspaceFolders(params.folder, 1);
        const folder: any = await this.fetchFolder(params.folder);
        this.saveState(folder);
        this.loading = false;
      } else {
        this.selectedFolder2 = this.folderStructure[0];
        this.sectorSelected = this.folderStructure[0];
        this.selectedFolder = this.folderStructure[0];
        await this.fetchAllSectors();
        this.loading = false;
      }
    });

    this.dataService.uploadedAssetData$.subscribe((result) => {
      if (!result) return;
      this.folderAssetsResult[
        this.breadCrumb[this.breadCrumb.length - 1].uid
      ].entries.unshift(result);
      this.searchList.unshift(result);
      this.sortedData = this.searchList.slice();
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
  }

  datePickerDefaultAction() {
    $(".buttonCreate").on("click", function (e) {
      // $(".dropdownCreate").toggle();
      $(".dropdownCreate").show();
      $(".buttonCreate").addClass("createNewFolderClick");
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
    return assetType === "Workspace" || assetType === "OrderedFolder";
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, { centered: true, backdrop: "static" });
  }

  async handleTest(item) {
    this.folderNameRef = undefined;
    this.folderDescriptionRef = undefined;
    this.folderDateRef = undefined;
    
    this.saveState(item);
    this.searchBarValue = "";
    this.paginator.firstPage();
    if (item.isTrashed) return;
    this.newTitle = item.title;
    this.showLinkCopy = true;
    this.showSearchbar = false;
    this.copiedString = "";
    this.selectedFolder = item;
    this.extractBreadcrumb();
    this.createBreadCrumb(item.title, item.type, item.path);
    this.loading = true;
    const { entries, numberOfPages, resultsCount} = await this.fetchAssets(item.uid, true);
    this.searchList = entries.filter(
      (sector) => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1
    );
    this.sortedData = this.searchList.slice(); //shallow copy
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.handleSelectMenu(0, "GRID");
    this.loading = false;
    this.sharedService.toTop();
    this.createDynamicSidebarScroll();
    // this.selectedFolder = item;
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    if (!url) return "";
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split("/nuxeo/")[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${
      url.split("/nuxeo/")[1]
    }`;
    this.loading = true;
    fetch(updatedUrl, {
      headers: { "X-Authentication-Token": localStorage.getItem("token") },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          this.router.navigate(["login"]);
          this.loading = false;
          return;
        }
        return r.blob();
      })
      .then((d) => {
        event.target.src = window.URL.createObjectURL(d);
        this.loading = false;
        // event.target.src = new Blob(d);
      })
      .catch((e) => {
        // TODO: add toastr with message 'Invalid token, please login again'
        this.loading = false;
        console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }
      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }

  open(file, fileType?: string): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRenditionUrl;
    this.selectedFile = file;
    // if (!fileType) {
    switch (fileType) {
      case "Picture":
        fileType = "image";
        break;
      case "Video":
        fileType = "video";
        break;
      default:
        fileType = "file";
        break;
    }
    // }
    if (fileType === "image") {
      this.markRecentlyViewed(file);

      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
      fileRenditionUrl = url; // file.properties['file:content'].data;
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if (fileType === "video") {
      fileRenditionUrl =
        file.properties["vid:transcodedVideos"][0]?.content.data || "";
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

  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed =
      JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed[index] = data;
        }
      });
    }
    if (found) {
      localStorage.setItem(
        localStorageVars.RECENTLY_VIEWED,
        JSON.stringify(recentlyViewed)
      );
      return;
    }

    data["isSelected"] = false;
    recentlyViewed.push(data);
    localStorage.setItem(
      localStorageVars.RECENTLY_VIEWED,
      JSON.stringify(recentlyViewed)
    );
    return;
  }

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
    this.folderNameRef = undefined;
    this.folderDescriptionRef = undefined;
    this.folderDateRef = undefined;
    
    this.saveState(item);
    this.paginator?.firstPage();
    this.searchBarValue = "";
    // if (!isNaN(index) || breadCrumbIndex === 1) {
    //   this.showSearchbar = true;
    // }
    if (breadCrumbIndex === this.breadCrumb.length) return;
    if (breadCrumbIndex === 0) {
      this.showSearchbar = false;
      this.selectedFolder2 = this.folderStructure[0];
      this.selectedFolder = this.selectedFolder2;
      this.sectorSelected = null;
      this.selectedMenu = 0;
      return;
    }
    this.isTrashView = false;
    if (index || breadCrumbIndex === 1) {
      const listView = 1;
      await this.getWorkspaceFolders(item.uid, listView);
    } else {
      this.showSearchbar = false;
      await this.handleClickNew(item.uid);
    }
    this.loading = true;
    this.selectedFolder = await this.fetchFolder(item.uid);
    this.selectedFolder2 = this.selectedFolder;
    this.extractBreadcrumb();
    this.loading = false;
  }

  async fetchFolder(id) {
    const result = await this.apiService.get(`/id/${id}`, {headers: { "fetch-document": "properties"}}).toPromise();
    return result;
  }

  async fetchAssets(id: string, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.currentPageCount = 0;
    this.showMoreButton = true;
    if (checkCache && this.folderAssetsResult[id]) {
      return this.folderAssetsResult[id];
    }
    const url = `/search/pp/advanced_document_content/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&ecm_parentId=${id}&ecm_trashed=false`;
    const result: any = await this.apiService.get(url, {headers: { "fetch-document": "properties"}}).toPromise();
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, true)
    );
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.type, b.type, true)
    );
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
    const url = `/id/${assetUid}`;
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
    const url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=${PAGE_SIZE_1000}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    this.apiService.get(url, {headers: { "fetch-document": "properties"}}).subscribe((docs: any) => {
      this.searchList = docs.entries.filter(
        (sector) =>
          UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1
      );
      let workSpaceIndex = this.searchList.findIndex(
        (res) => res.title === "Workspaces"
      );
      if (workSpaceIndex >= 0) {
        this.handleChangeClick(
          this.searchList[workSpaceIndex],
          index,
          selected,
          childIndex
        );
      } else {
        this.sortedData = this.searchList.slice();
        if (childIndex !== null && childIndex !== undefined) {
          this.folderStructure[index].children[childIndex].children =
            docs.entries;
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
    this.selectedMenu = index;
    this.viewType = type;
  }

  checkShowUpdateBtn() {
    return (
      this.searchList?.length > 0 && this.selectedFolder?.type === "Workspace"
    );
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
      folder
    };

    const modalDialog = this.matDialog.open(UpdateModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (!result) return;
      const updatedDocs = result.updatedDocs;
      const updatedFolder = result.selectedFolder;
      if(!this.selectedFolder.properties) {
        this.selectedFolder['properties'] = {};
      }
      this.selectedFolder.properties["dc:description"] = updatedFolder.description;
      this.selectedFolder.properties["dc:start"] = updatedFolder.associatedDate;
      Object.keys(updatedDocs).forEach((key) => {
        this.searchList[key].contextParameters.acls =
          updatedDocs[key].contextParameters.acls;
        this.sortedData[key].contextParameters.acls =
          updatedDocs[key].contextParameters.acls;
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
          this.markRecentlyViewed(data);
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
          this.markRecentlyViewed(data);
        }
        this.loading = false;
      });
  }

  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
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
    selBox.value = `${window.location.origin}/workspace?folder=${this.selectedFolder.uid}`;
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
    return `Search for folder in ${this.sharedService.stringShortener(
      this.selectedFolder?.title,
      19
    )} workspace`;
  }

  getDateInFormat(date: string): string {
    return new Date(date).toDateString();
  }

  getIconByType(type: string): string {
    switch (type.toLowerCase()) {
      case "workspace":
        return "../../../assets/images/folderBlack.png";
      case "picture":
        return "../../../assets/images/list-viewImg.svg";
      case "video":
        return "../../../assets/images/list-viewVideo.svg";
      case "file":
        return "../../../assets/images/Doc.svg";
      default:
        return "../../../assets/images/folderBlack.png";
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

  selectFolder($event, item, i) {
    if (!$event.target.checked && this.selectedFolderList[i]) {
      delete this.selectedFolderList[i];
    } else if ($event.target.checked) {
      this.selectedFolderList[i] = item;
    }
  }

  async deleteFolders() {
    if (Object.keys(this.selectedFolderList).length == 0) return;
    this.loading = true;

    const listDocs = Object.entries(this.selectedFolderList).map(function (
      [key, item],
      index
    ) {
      return item["uid"];
    });
    await this.apiService
      .post(apiRoutes.TRASH_DOC, { input: `docs:${listDocs.join()}` })
      .subscribe((docs: any) => {
        this.loading = false;
      });
    this.deleteModal(listDocs);
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

  checkEnableDeleteBtn() {
    return Object.keys(this.selectedFolderList).length > 0;
  }

  getTrashedWS(pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.showSearchbar = true;
    this.searchBarValue = "";
    offset || this.paginator.firstPage();
    if (this.folderNotFound) {
      this.folderNotFound = false;
      this.selectedFolder = {};
    }
    this.loading = true;
    const url = `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 1 AND ecm:primaryType = 'Workspace' OR ecm:primaryType = 'OrderedFolder'`;
    this.apiService.get(url, {headers: { "fetch-document": "properties"}}).subscribe((docs: any) => {
      this.numberOfPages = docs.numberOfPages;
      this.resultCount = docs.resultsCount;
      this.trashedList = docs.entries.filter(
        (sector) => {
          if(UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1) {
            --this.resultCount;
            return true;
          } else {
            return false;
          }
        }
      );
      if (!this.myDeletedCheck) {
        this.searchList = this.trashedList;
        this.sortedData = this.searchList.slice();
      } else {
        this.deletedByMeFilter().then(() => {
          this.searchList = this.deletedByMe;
          this.sortedData = this.searchList.slice();
        });
      }
      this.isTrashView = true;
      this.handleSelectMenu(1, this.viewType || "LIST");
      this.showMoreButton = false;
      this.loading = false;
      this.deletedByMeFilter();
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
    if (e.target.checked) {
      this.myDeletedCheck = true;
      this.searchList = this.deletedByMe;
    } else {
      this.myDeletedCheck = false;
      this.searchList = this.trashedList;
    }
    this.sortedData = this.searchList.slice();
  }

  checkCanDelete(item) {
    return this.user === item.properties["dc:creator"]?.id;
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

  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px";
    dialogConfig.width = "650px";
    dialogConfig.disableClose = true;
    this.selectedFolder["sectorId"] = this.selectedFolder2.uid;
    dialogConfig.data = this.selectedFolder;
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

  async createFolder(folderName: string, date?: string, description?: string) {
    if(!this.folderNameRef) {
      this.showError = true;
    } else {
      let url = `/path${this.selectedFolder.path}`;
      if (this.selectedFolder.type.toLowerCase() === "domain") {
        url = `/path${this.selectedFolder.path}/workspaces`;
        this.selectedFolder.path = `${this.selectedFolder.path}/workspaces/null`;
        this.selectedFolder.type = "Workspace";
      } else {
        this.selectedFolder.type = ORDERED_FOLDER;
      }

      const payload = await this.sharedService.getCreateFolderPayload(
        folderName,
        this.selectedFolder2.title,
        this.selectedFolder,
        description,
        date
      );
      const res = await this.apiService.post(url, payload, {headers: { "fetch-document": "properties"}}).toPromise();
      if (!res && !res["uid"]) return;

      this.searchList.unshift(res);
      this.sortedData = this.searchList.slice();
      this.folderAssetsResult[this.selectedFolder.uid].entries.unshift(res);
      this.showMoreButton = false;
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
            (a.properties["dc:creator"].properties?.firstName || a.properties["dc:creator"].id),
            (b.properties["dc:creator"].properties?.firstName || b.properties["dc:creator"].id),
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
        default:
          return 0;
      }
    });
   this.sortedData.sort(this.assetTypeCompare);
  }

  /**
   * brings folder to top position and then assets
   */
  assetTypeCompare(a: {type: string}, b: {type: string}): number {
    return a.type.toLowerCase() === 'orderedfolder' ? -1 : 1;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  renameFolderAction() {
    this.renameFolderName = true;
  }

  updateFolderAction() {
    this.renameFolderName = false;
  }

  renameFolder() {
    let { newTitle, selectedFolder } = this;
    // console.log({ Nuewwerty: this.newTitle, selectedFolder: this.selectedFolder });
    this.apiService
      .post(apiRoutes.DOCUMENT_UPDATE, {
        input: selectedFolder.uid,
        params: {
          properties: {
            "dc:title": newTitle,
          },
        },
      })
      .subscribe((res: any) => {
        console.log({ res });
        this.updateFolderAction();
        this.sharedService.showSnackbar(
          "Folder name is updated",
          6000,
          "top",
          "center",
          "snackBarMiddle"
          // "Updated folder",
          // this.getTrashedWS.bind(this)
        );
        this.handleTest(res);
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
    this.loading = true;
    this.isTrashView = false;
    await this.fetchCurrentFolderAssets(folderUid);
    this.loading = false;
  }

  async getWorkspaceFolders(sectorUid: string, viewType = 0) {
    // this.loading = true;
    let { entries, numberOfPages, resultsCount } = await this.fetchAssets(sectorUid);
    let workSpaceIndex: number;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.showSearchbar = false;
    if (!entries?.length) {
      this.sortedData = [];
      this.searchList = [];
      this.showLinkCopy = true;
      // this.loading = false;
      return;
    }
    workSpaceIndex = entries.findIndex((res) => res.title === "Workspaces");
    if(workSpaceIndex !== -1) {
      this.sectorWorkspace = entries[workSpaceIndex];
    }
    if(workSpaceIndex === -1) {
      this.sortedData = entries;
      this.searchList = entries;
      this.showLinkCopy = true;
      // this.loading = false;
      return;
    }
    ({ entries, numberOfPages, resultsCount } = await this.fetchAssets(entries[workSpaceIndex].uid));
    this.sortedData = entries;
    this.searchList = entries;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.showLinkCopy = false;
    this.selectedMenu = viewType;
    this.showSearchbar = true;
    this.extractBreadcrumb();
    // this.loading = false;
  }

  async fetchAllSectors(isExpand = false) {
    // this.loading = true;
    this.isTrashView = false;
    this.sectorSelected = null;
    this.sharedService.toTop();
    const { entries } = await this.fetchAssets(ROOT_ID, true, PAGE_SIZE_200);
    this.folderStructure[0]["children"] = entries;
    this.folderStructure[0].isExpand = !isExpand;
    this.searchList = entries;
    this.selectedMenu = 0;
    this.showSearchbar = false;
    this.createDynamicSidebarScroll();
    // this.loading = false;
  }

  async fetchCurrentFolderAssets(sectorUid: string, showLinkCopy = true, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.loading = true;
    const { entries, numberOfPages, resultsCount } = await this.fetchAssets(sectorUid, checkCache, pageSize, pageIndex, offset);
    this.sortedData = entries;
    this.searchList = entries;
    this.numberOfPages = numberOfPages;
    this.resultCount = resultsCount;
    this.extractBreadcrumb();
    this.showLinkCopy = showLinkCopy;
    this.showSearchbar = !showLinkCopy;
    this.loading = false;
  }

  createDynamicSidebarScroll() {
    setTimeout(() => {
      var storeHeight = $(".main-content").outerHeight();
      $(".leftPanel.insideScroll").css("height", storeHeight - 80);
    }, 0);
  }

  upadtePermission(breadcrumb: any) {
    let user = this.userSector?.split("-")[0].trim().toLowerCase();
    if (breadcrumb?.title?.toLowerCase() === user) return true;
    return false;
  }

  /**
   * @param event = {previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 100};
   */
  paginatorEvent(event: PageEvent) {
    const offset = event.pageIndex * event.pageSize;
    if(!this.isTrashView) {
      let uid = this.selectedFolder.uid;
      let showLinkCopy = true;
      if(this.selectedFolder.type.toLowerCase() === 'domain') {
        uid = this.sectorWorkspace.uid;
        showLinkCopy = false;
      }
      this.fetchCurrentFolderAssets(uid, showLinkCopy, false, event.pageSize, event.pageIndex, offset);
    } else {
      this.getTrashedWS(event.pageSize, event.pageIndex, offset);
    }
  }

  async searchFolders(searchString: string) {
    // this.loading = true;
    const query = `SELECT * FROM Document WHERE ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:mixinType = 'Folderish' AND ecm:path STARTSWITH '/${this.selectedFolder.title}/workspaces/' AND dc:title ILIKE '%${searchString}%'`;
    const params = {
      currentPageIndex: 0,
      offset: 0,
      pageSize: 20,
      queryParams: query,
    };
    const result: any = await this.apiService
    .get(apiRoutes.NXQL_SEARCH, { params, headers: { "fetch-document": "properties"} })
    .toPromise();
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, true)
    );
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.type, b.type, true)
    );
    this.numberOfPages = result.numberOfPages;
    this.resultCount = result.resultsCount;
    this.sortedData = result.entries;
    this.searchList = result.entries;
    // this.loading = false;
  }

  navigateToWorkspaceFolder(uid: string) {
    this.router.navigate(['workspace'], {queryParams: {folder: uid}});
  }

  saveState({uid, title, path, properties, sectorId, type, contextParameters}) {
    let breadcrumb;
    if(contextParameters) {
      ({breadcrumb} = contextParameters);
      contextParameters = { breadcrumb };
    }
    const workspaceState = JSON.stringify({title, uid, path, properties, sectorId, type, contextParameters});
    localStorage.setItem('workspaceState', workspaceState);
    this.navigateToWorkspaceFolder(uid);
    return;
  }

  inputChange() {
    if(!this.folderNameRef) {
      this.showError = true;
    } else {
      this.showError = false;
    }
  }

  getCreatorName(item) {
    const creatorName = item.properties['dc:creator']?.properties?.firstName + " " + item.properties['dc:creator']?.properties?.lastName;
    return item.properties['dc:creator']?.properties?.firstName ? creatorName : item.properties['dc:creator']?.id;
  }
}
