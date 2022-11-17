import { Component, OnInit, ViewChild, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { ApiService } from '../services/api.service';
import { apiRoutes } from '../common/config';
import { IBrowseSidebar, IEntry, ISearchResponse } from '../common/interfaces';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MoveCopyAssetsComponent } from "src/app/move-copy-assets/move-copy-assets.component";
import { ASSET_TYPE, constants, PAGE_SIZE_20, UNWANTED_WORKSPACES } from '../common/constant';
import { Sort } from "@angular/material/sort";
import { DataService } from '../services/data.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { environment } from 'src/environments/environment';
import { PreviewPopupComponent } from '../preview-popup/preview-popup.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() searchList: IEntry[] = [];
  @Input() isTrashView: boolean = false;
  @Input() trashedList: IEntry[] = [];
  @Input() searchBarValue;
  @Input() showAssetPath: boolean = false;
  @Input() currentWorkspace: IEntry;
  @Input() breadCrumb = [];

  // @Input() currentWorkspace: IEntry = null;
  @Input() folderStructure: IBrowseSidebar[] = [];
  // @Input() folderAssetsResult: {[key: string]: ISearchResponse} = {};
  // @Input() fetchFolderStatus = {};
  

  @Output() clickHandle: EventEmitter<any> = new EventEmitter();
  @Output() fetchAssets: EventEmitter<any> = new EventEmitter();
  @Output() selectedAssetList: EventEmitter<any> = new EventEmitter();
  
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
  @ViewChild("paginator") paginator: MatPaginator;
  @ViewChild("previewModal") previewModal: PreviewPopupComponent;

  count: number = 0;
  loading: boolean = false;
  forInternalUse = [];
  downloadArray = [];
  sizeExeeded = false;
  forInternaCheck = false;
  downloadFullItem = [];
  needPermissionToDownload = [];
  fileSelected = [];
  copyRightItem = []
  canNotDelete=[]
  selectedFolderList={}
  selectedMoveList={};
  user = null;
  sortedData: IEntry[] = [];
  hasUpdatedChildren;
  numberOfPages: number= 0;
  resultCount: number = 0;
  showLinkCopy: boolean = false;
  currentPageCount: number = 0;
  permissionChange:boolean = false;
  initialLoad: boolean = false;
  myDeletedCheck: boolean = true;
  folderNotFound: boolean = false;
  contextMenuPosition = { x: '0px', y: '0px' };
  rightClickedItem:any =null;
  downloadEnable: boolean = false;
  currentIndexPublished: any;
  currentIndexRightClick: any;
  activeTabs = { comments: false, info: false, timeline: false };
  showShadow = false;
  renameFolderName: boolean = false;
  newTitle: string;
  fileToPreview: IEntry;
  fileToPreviewUrl: string;
  downloadErrorShow: boolean = false;
  defaultPageSize: number = 20;
  pageSizeOptions = [20, 50, 100];

  constructor(
    public sharedService: SharedService,
    private apiService: ApiService,
    public matDialog: MatDialog,
    public dataService: DataService,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.sortedData = this.searchList?.slice();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.sortedData = this.searchList?.slice();
    // this.pageSize = changes.currentValue[this.currentWorkspace.uid].pageSize;
    this.numberOfPages = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.numberOfPages;
    this.resultCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.resultsCount;
    this.currentPageCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.currentPageSize;
  }
  
  /**
   * @param event = {previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 100};
   */
   paginatorEvent(event: PageEvent) {
    const offset = event.pageIndex * event.pageSize;
    // if (!this.isTrashView) {
      let uid = this.currentWorkspace.uid;
      // let showLinkCopy = true;
      // if (this.currentWorkspace.type.toLowerCase() === "domain") {
      //   uid = this.sectorWorkspace.uid;
      //   showLinkCopy = false;
      // }
      const data = {
        id: uid,
        checkCache: false,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex,
        offset
      }; 
      this.fetchAssets.emit(data);
      // this.fetchCurrentFolderAssets(
      //   uid,
      //   false,
      //   event.pageSize,
      //   event.pageIndex,
      //   offset
      // );
    // } 
    // else {
    //   this.getTrashedWS(event.pageSize, event.pageIndex, offset);
    // }
  }
  
  async fetchCurrentFolderAssets(sectorUid: string, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.loading = true;
    // const { entries, numberOfPages, resultsCount } = await this.fetchAssets(
    //   sectorUid,
    //   checkCache,
    //   pageSize,
    //   pageIndex,
    //   offset
    // );
    // this.sortedData = entries;
    // this.searchList = entries;
    // this.numberOfPages = numberOfPages;
    // this.resultCount = resultsCount;
    // this.extractBreadcrumb();
    // this.showLinkCopy = showLinkCopy;
    // this.showSearchbar = true;
    // this.loading = false;
  }

  getDateInFormat(date: string): string {
    return new Date(date).toDateString();
  }

  rightClickMove(){
    if (this.count > 0) return this.openMoveModal();
     this.openMoveModal();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
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

  checkCanMove(m){
    return  ["workspace", "folder", "orderedfolder"].indexOf(m.type.toLowerCase()) !== -1
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
    return processAble.length > 0; 
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
            this.apiService
              .downloadGet("/automation/Blob.BulkDownload/@async/" + newUID)
              .subscribe((resp: any) => {
                let locationForDownload = resp.headers.get("location");
              });

            setTimeout(() => {
              window.open(
                environment.apiServiceBaseUrl +
                  "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
                  uid
              );
              this.removeAssets();
            }, 1000);
          });
      }
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

  rightClickDownload(){
    if (this.count > 0) return this.multiDownload();
    // this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
    this.multiDownload();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
  }

  rightClickDelete(){
     if (this.count > 0) return this.deleteFolders();
    this.deleteFolders();
    this.removeAssets()
    this.contextMenu.closeMenu();
    return $(".availableActions").hide();
  }

  checkEnableDeleteBtn() {
    return Object.keys(this.selectedFolderList).length > 0;
  }

  rightClickRename(item){
    if (this.count == 0) {
      return item.edit =!item.edit
    }
  }

  async deleteFolders() {
    if (Object.keys(this.selectedFolderList).length == 0) return;
    this.loading = true;

    const listDocs = Object.entries(this.selectedFolderList)
    .filter(([key, item]) => this.checkCanDelete(item)).map(([key, item],index) => item["uid"]);
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
  
  checkWSType(assetType: string) {
    return assetType.toLowerCase() === ASSET_TYPE.WORKSPACE || assetType.toLowerCase() === ASSET_TYPE.ORDERED_FOLDER;
  }

  checkCanDelete(item) {
    return this.user === item.properties["dc:creator"]?.id || this.user === item.properties["dc:creator"];
  }

  checkGeneralFolder(item){
    return item?.type?.toLowerCase() === constants.WORKSPACE && item?.title?.toLowerCase() === constants.GENERAL_FOLDER
  }

  onContextMenu(event: MouseEvent, item: any) {
    if(!this.checkGeneralFolder(item)) {
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

      this.rightClickedItem = item ? item : this.rightClickedItem;
      if(this.count == 0){
        this.removeAssets()
        this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem, '')
      }
    }
  }

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
    this.clickHandle.emit({eventName: 'forInternalUseListEvent', data: this.forInternalUse});
    this.clickHandle.emit({eventName: 'copyRightItemEvent', data: this.copyRightItem});
    this.clickHandle.emit({eventName: 'needPermissionToDownloadEvent', data: this.needPermissionToDownload});
    this.getdownloadAssetsSize();
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
    this.clickHandle.emit({eventName: 'sizeExeededEvent', data: this.sizeExeeded});
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
    this.selectedAssetList.emit(this.selectedMoveList);
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
  
  removeWorkspacesFromString(data: string, title: string): string {
    let dataWithoutWorkspace = this.sharedService.stringShortener(this.sharedService.removeWorkspacesFromString(data), 35);
    return dataWithoutWorkspace.replace('/'+title, '');
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
    this.selectedMoveList={};
    
    this.clickHandle.emit({eventName: 'forInternalUseList', data: this.forInternalUse});
    this.clickHandle.emit({eventName: 'copyRightItemEvent', data: this.copyRightItem});
    this.clickHandle.emit({eventName: 'needPermissionToDownloadEvent', data: this.needPermissionToDownload});
    this.sortedData.forEach((e) => (e.isSelected = false));
  }

  checkDownloadPermission(item){
    if (item.properties["sa:downloadApprovalUsers"]?.length >0 || item.properties["dc:isPrivate"]) return true;
    return false
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
      parentId: this.currentWorkspace.uid,
      sectorList: [], //  this.folderStructure[0]?.children ||
      user:this.user
    }

    const modalDialog = this.matDialog.open(MoveCopyAssetsComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        // delete this.folderAssetsResult[result.uid];
        // delete this.folderAssetsResult[this.currentWorkspace.uid];

        this.loading = true;
        setTimeout(() => {
          if (this.currentWorkspace.type === 'Domain') window.location.reload();
          else {
            // this.handleClickNew(this.currentWorkspace.uid);
          }
        }, 1000);
      }
    });
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
    this.hasUpdatedChildren.push(this.currentWorkspace.uid);
    this.selectedFolderList = {};
    deletedFolders.forEach((item) => {
      // if (this.folderAssetsResult[item.parentRef]) {
      //   const index = this.folderAssetsResult[item.parentRef].entries.findIndex(
      //     (entry) => entry.uid === item.uid
      //   );
      //   this.folderAssetsResult[item.parentRef].entries.splice(index, 1);
      // }
    });
  }

  renameFolder(title?: string, assetUid?: number) {
    let { newTitle, currentWorkspace } = this;
    if (newTitle?.trim() ===currentWorkspace.title) return this.updateFolderAction();

    this.apiService
      .post(apiRoutes.DOCUMENT_UPDATE, {
        input: assetUid || currentWorkspace.uid,
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
          // "Updated folder",
          // this.getTrashedWS.bind(this)
        );
      });
  }
  
  copyLink(asset: IEntry, assetType: string) {
    asset.copy = this.sharedService.copyLink(asset.uid, assetType, asset.properties['dc:sector']);
  }
  
  updateFolderAction() {
    this.renameFolderName = false;
    this.newTitle =this.currentWorkspace.title
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

  open(file, fileType?: string): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    let fileRenditionUrl;
    this.fileToPreview = file;
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
    this.fileToPreviewUrl = fileType === "image"
        ? this.getAssetUrl(null, fileRenditionUrl)
        : fileRenditionUrl;
    if(fileType === 'file') {
      this.getAssetUrl(true, this.fileToPreviewUrl, 'file');
    }

    this.previewModal.open();
  }
  
  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
      return '../../../assets/images/no-preview.png';
    }
    if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
      return '../../../assets/images/no-preview-grid.svg';
    }
   return this.sharedService.getAssetUrl(event, url, type);
  }

  checkAssetMimeTypes(document: any): string {
    return this.sharedService.checkMimeType(document);
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
    // this.hasUpdatedChildren.push(this.currentWorkspace.uid);
    this.selectedFolderList = {};
    recoveredFolders.forEach((item) => {
        // this.folderAssetsResult[item.parentRef] &&
        // this.folderAssetsResult[item.parentRef].entries.push(item)
    });
  }

  sortData(sort: Sort) {
    const data = this.searchList.slice();
    if (!sort.active || sort.direction === "") {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a: IEntry, b: IEntry) => {
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
        // case "file:content":
        //   return this.compare(
        //     a.properties["file:content"],
        //     b.properties["file:content"],
        //     isAsc
        //   );
        default:
          return 0;
      }
    });
    this.sortedData.sort(this.assetTypeCompare);
  }

  /**
  * brings folder to top position and then assets
  */
  assetTypeCompare(a: IEntry , b: IEntry): number {
    return [ASSET_TYPE.WORKSPACE, ASSET_TYPE.FOLDER, ASSET_TYPE.ORDERED_FOLDER].indexOf(a.type.toLowerCase()) > -1? -1 : 1;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  clickHandleChild(item) {
    this.clickHandle.emit(item);
  }

  // NOTE: move to trash component
  getTrashedWS(pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
    this.initialLoad = false;
    // this.showSearchbar = true; //TODO: to detail controller
    // this.searchBarValue = ""; //TODO: to detail controller
    offset || this.paginator?.firstPage();
    if (this.folderNotFound) {
      this.folderNotFound = false;
      this.currentWorkspace = {};
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
        this.searchList = this.trashedList;
        this.sortedData = this.searchList.slice();
        this.isTrashView = true;
        // this.handleSelectMenu(1,"LIST");
        // this.showMoreButton = false;
        this.loading = false;
      });
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

  openFolder(item: IEntry) {
    this.router.navigate([window.location.pathname.split('/').splice(1,2).join('/'), item.uid]);
  }

  
  cancelDownloadClick(e) {
    e.stopPropagation();
    $(".multiDownloadBlock").hide();
  }

  downloadClick() {
    if (!this.downloadEnable) {
      this.downloadErrorShow = true;
    }
  }

}
