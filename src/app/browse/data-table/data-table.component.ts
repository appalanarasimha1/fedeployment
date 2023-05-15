import { Component, OnInit, ViewChild, Input, SimpleChanges, OnChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { ApiService } from '../../services/api.service';
import { apiRoutes } from '../../common/config';
import { IBrowseSidebar, IEntry, ISearchResponse, IArrow } from '../../common/interfaces';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MoveCopyAssetsComponent } from "src/app/move-copy-assets/move-copy-assets.component";
import { ASSET_TYPE, constants, PAGE_SIZE_20, UNWANTED_WORKSPACES } from '../../common/constant';
import { Sort } from "@angular/material/sort";
import { DataService } from '../../services/data.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { environment } from 'src/environments/environment';
import { PreviewPopupComponent } from '../../preview-popup/preview-popup.component';
import { ManageAccessModalComponent } from '../../manage-access-modal/manage-access-modal.component';
import { Router } from '@angular/router';
import { NuxeoService } from 'src/app/services/nuxeo.service';
import * as moment from 'moment';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  
  @Input() breadCrumb = [];
  @Input() currentWorkspace: IEntry;
  @Input() isTrashView: boolean = false;
  @Input() folderStructure: IBrowseSidebar[] = [];
  @Input() trashedList: IEntry[] = [];
  @Input() searchBarValue;
  @Input() showAssetPath: boolean = false;
  @Input() searchList: IEntry[] = [];

  @Output() canNotDeleteList: EventEmitter<any> = new EventEmitter();
  @Output() clickHandle: EventEmitter<any> = new EventEmitter();
  @Output() fetchAssets: EventEmitter<any> = new EventEmitter();
  @Output() selectedAssetList: EventEmitter<any> = new EventEmitter();
  @Output() sortedDataList: EventEmitter<any> = new EventEmitter();
  @Output() selectedCount: EventEmitter<any> = new EventEmitter();
  @Output() selectedAssetMoveList: EventEmitter<any> = new EventEmitter();
  
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;
  @ViewChild("paginator") paginator: MatPaginator;
  @ViewChild("previewModal") previewModal: PreviewPopupComponent;

  assetCount: number = 0;
  assetCanDelete:any=[]
  activeTabs = { comments: false, info: false, timeline: false };

  count: number = 0;
  copyRightItem = []
  canNotDelete=[]
  currentPageCount: number = 0;
  contextMenuPosition = { x: '0px', y: '0px' };
  currentIndexPublished: any;
  currentIndexRightClick: any;
  currentIndexClicked:number

  downloadArray = [];
  downloadEnable: boolean = false;
  downloadErrorShow: boolean = false;
  defaultPageSize: number = 20;
  downloadFullItem = [];
  
  forInternaCheck = false;
  forInternalUse = [];
  fileSelected = [];
  fileToPreview: IEntry;
  fileToPreviewUrl: string;
  folderNotFound: boolean = false;
  
  hasUpdatedChildren;
  
  increaseWidth = false;
  initialLoad: boolean = false;

  loading: boolean = false;
  lastIndexClicked:number;

  needPermissionToDownload = [];
  newTitle: string;
  numberOfPages: number= 0;

  myDeletedCheck: boolean = true;

  selectedFolderList={}
  selectedMoveList={};
  sizeExeeded = false;
  sortedData: IEntry[] = [];
  arrowisAsc: IArrow = { "title": true, "fileType": true, "dc:creator": true, "dc:created": true, "dc:modified": true, "dc:sector": true };
  hoverArrow: IArrow = { "title": false, "fileType": false, "dc:creator": false, "dc:created": false, "dc:modified": false, "dc:sector": false };
  showLinkCopy: boolean = false;
  showShadow = false;
  selectedMoveListNew: any = {};
  selectAllClicked: boolean = false;

  user = null;

  pageSizeOptions = [20, 50, 100];
  permissionChange:boolean = false;
  
  rightClickedItem:any =null;
  renameFolderName: boolean = false;
  resultCount: number = 0;

  selectedFile: any;
  selectedFileUrl: string;
  openGetNoPreview: boolean = false;

  // @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    const ESCAPE_KEYCODE = 27;
    if (event.keyCode === ESCAPE_KEYCODE) {
      this.contextMenu.closeMenu();
    }
  }
  
  constructor(
    public sharedService: SharedService,
    private apiService: ApiService,
    public matDialog: MatDialog,
    public dataService: DataService,
    public nuxeo: NuxeoService,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.sortedData = this.searchList?.slice();
    this.sortedDataList.emit(this.sortedData)
    this.fetchUserData();
    this.createDynamicSidebarScroll();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.sortedData = this.searchList?.slice();
    this.sortedDataList.emit(this.sortedData)
    if(this.isTrashView) {
      this.selectedFolderList = {};
      this.numberOfPages = changes?.folderStructure?.currentValue?.numberOfPages;
      this.resultCount = changes?.folderStructure?.currentValue?.resultsCount;
      this.currentPageCount = changes?.folderStructure?.currentValue?.currentPageSize;
      return;
    }

    this.numberOfPages = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.numberOfPages;
    this.resultCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.resultsCount;
    this.currentPageCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.currentPageSize;
  }
  
  /**
   * @param event = {previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 100};
   */
   paginatorEvent(event: PageEvent) {
    const offset = event.pageIndex * event.pageSize;
      let uid = this.currentWorkspace.uid;
      const data = {
        id: uid,
        checkCache: false,
        pageSize: event.pageSize,
        pageIndex: event.pageIndex,
        offset
      }; 
      this.fetchAssets.emit(data);
  }
  async fetchUserData() {
    if (localStorage.getItem("user")) {
      this.user = JSON.parse(localStorage.getItem("user"))["username"];
      if (this.user) return;
    }
    if (this.nuxeo.nuxeoClient) {
      const res = await this.nuxeo.nuxeoClient.connect();
      this.user = res.user.id;
      localStorage.setItem("user", JSON.stringify(res.user.properties));
    }
  }

  // async fetchCurrentFolderAssets(sectorUid: string, checkCache = true, pageSize = PAGE_SIZE_20, pageIndex = 0, offset = 0) {
  //   this.loading = true;
  //   // const { entries, numberOfPages, resultsCount } = await this.fetchAssets(
  //   //   sectorUid,
  //   //   checkCache,
  //   //   pageSize,
  //   //   pageIndex,
  //   //   offset
  //   // );
  //   // this.sortedData = entries;
  //   // this.searchList = entries;
  //   // this.numberOfPages = numberOfPages;
  //   // this.resultCount = resultsCount;
  //   // this.extractBreadcrumb();
  //   // this.showLinkCopy = showLinkCopy;
  //   // this.showSearchbar = true;
  //   this.loading = false;
  // }

  getDateInFormat(date: string): string {
    return new Date(date).toDateString();
  }

  rightClickMove(move=true){
    if (this.count >0) return this.openMoveModal(move);
    // this.selectAsset({checked:true , from:"rightClick"}, this.rightClickedItem,  this.rightClickedIndex)
    this.openMoveModal(move);
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
    this.sortedDataList.emit(this.sortedData)
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
    return Object.keys(this.selectedMoveList)?.length > 0;
  }
  
  getFileContent(doc) {
    return this.sharedService.getAssetUrl(null, doc?.properties["file:content"]?.data || "");
  }

  async downloadAssets(e?:any) {
    if (!this.downloadEnable && this.forInternalUse.length > 0) {
      return;
    } else {
      let newDownloadArray = []
      let newDownloadArrayFullItem = []
      for (let i = 0; i < this.downloadFullItem.length; i++) {
        if (this.downloadFullItem[i].type==='Video') {
          window.open(this.getFileContent(this.downloadFullItem[i]));
          
        }else{
          newDownloadArray.push(this.downloadFullItem[i].uid)
          newDownloadArrayFullItem.push(this.downloadFullItem[i])
        }
        
      }
      if (newDownloadArray.length == 1 && newDownloadArrayFullItem[0].type !=="OrderedFolder") {
        window.location.href =this.getFileContent(newDownloadArrayFullItem[0])
        this.removeAssets()
      }
      else {
        this.sharedService.showSnackbar(
          "Your download is being prepared do not close your browser",
          0,
          "top",
          "center",
          "snackBarMiddle",
          "Close"
        );
        $(".multiDownloadBlock").hide();
        let randomString = Math.random().toString().substring(7);
        let input = "docs:" + JSON.parse(JSON.stringify(newDownloadArray));
        let uid: any;
        this.downloadAsZip(input, uid, randomString)
      }
    }
  }

  //TODO: this function not getting used as of now, 
  //will be used for multi download in future once the client clarification comes.
  async downloadAsZip(input, uid, randomString: string) {
    new Promise((resolve, reject) => {
      this.apiService.downloaPost("/automation/Blob.BulkDownload/@async", {
        params: {
          filename: `selection-${randomString}.zip`,
        },
        context: {},
        input,
      })
      .subscribe((res: any) => {
        let splittedLocation = res.headers.get("location").split("/");
        let newUID = splittedLocation[splittedLocation.length - 2];
        uid = newUID;
        let checkZipCompleted=(newUID) =>{
              this.loading = true
              this.apiService
            .downloadGet("/automation/Blob.BulkDownload/@async/" + newUID +"/status")
            .toPromise().then((resp: any) => {
              if(resp.status === 200){
                setTimeout(() => {
                  checkZipCompleted(newUID)
                }, 1000);
                
              }else{
                this.loading = false
                window.open(
                  environment.apiServiceBaseUrl +
                    "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
                    uid
                );
                this.removeAssets();
              }
            }).catch(e=>{
              this.removeAssets();
              // if (e.status ==404) {
              //   //  checkZipCompleted(newUID)
              // }else{
              //   // this.loading = false
              //   // window.open(
              //   //   environment.apiServiceBaseUrl +
              //   //     "/nuxeo/site/api/v1/automation/Blob.BulkDownload/@async/" +
              //   //     uid
              //   // );
              //   this.removeAssets();
              // }

            });

        }
        checkZipCompleted(uid)
      });
    })
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
    return Object.keys(this.selectedFolderList).length > 0  || Object.keys(this.selectedMoveList).length >this.canNotDelete.length;
  }

  rightClickRename(item){
    if (this.count == 0) {
      return item.edit =!item.edit
    }
  }

  async deleteFolders() {
    // if (Object.keys(this.selectedFolderList).length == 0 ) return;
    this.loading = true;
    let data = Object.values(this.selectedFolderList)
    let dataToParse =  data.concat(this.assetCanDelete)
    const listDocs = [... new Set(dataToParse.filter((item) => this.checkCanDelete(item)).map(item => item["uid"]))];
    await this.apiService
      .post(apiRoutes.TRASH_DOC, { input: `docs:${listDocs.join()}`})
      .subscribe((docs: any) => {
        this.loading = false;
        this.assetCanDelete = [];
        this.deleteModal(listDocs);
        this.removeAssets();
        this.fetchAssets.emit({id: this.currentWorkspace.uid});
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
    if(this.checkCanMove(item)){
      return this.selectFolder($event, item, i, $event?.update == undefined ? false : true);
    }
    if ($event.target?.checked || $event.checked) {
      if ($event.from !== "rightClick") {
        this.count = this.count + 1;
        this.assetCount = this.assetCount + 1;
        this.selectedCount.emit({allCount:this.count,assetCount:this.assetCount})
      }
      if (this.lastIndexClicked ==undefined) {
        this.currentIndexClicked = i
        this.lastIndexClicked = i
      }else{
        this.lastIndexClicked = this.currentIndexClicked
        this.currentIndexClicked = i
      }
      this.selectedMoveListNew[i] = item;
      this.selectedAssetMoveList.emit(this.selectedMoveListNew)
      this.selectedMoveList[i] = item;
      if (!canDelete) {
        this.canNotDelete.push(item)
        this.canNotDeleteList.emit(this.canNotDelete)
      }else{
        this.selectedFolderList[i] = item;
        this.assetCanDelete.push(item)
      }
       if (
         item.properties['sa:copyrightName'] !== null &&
         item.properties['sa:copyrightName'] !== ""
       ) {
         this.copyRightItem.push(item.uid);
       }
      if (item.properties["sa:downloadApprovalUsers"]?.length > 0) {
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
      this.canNotDeleteList.emit(this.canNotDelete)
      delete this.selectedMoveList[i];
      delete this.selectedMoveListNew[i];
      delete this.selectedFolderList[i];
      this.selectedAssetMoveList.emit(this.selectedMoveListNew)

      if ($event.from !== "rightClick") {
        this.count = this.count - 1;
        this.assetCount = this.assetCount - 1;
        this.selectedCount.emit({allCount:this.count,assetCount:this.assetCount})
      }

      if (this.count==0) {
        this.currentIndexClicked = undefined
        this.lastIndexClicked = undefined
        this.selectAllClicked = false
      }else{
        this.lastIndexClicked = this.currentIndexClicked
        this.currentIndexClicked = undefined
      }
      //  }
    }
    this.clickHandle.emit({eventName: 'forInternalUseListEvent', data: this.forInternalUse});
    this.clickHandle.emit({eventName: 'copyRightItemEvent', data: this.copyRightItem});
    this.clickHandle.emit({eventName: 'needPermissionToDownloadEvent', data: this.needPermissionToDownload});
    this.clickHandle.emit({eventName: 'downloadArray', data: this.downloadArray});
    this.selectedAssetList.emit(this.selectedFolderList);
    this.getdownloadAssetsSize();
  }

  shiftkeyDown(e,item,i){
    // console.log("e",this.lastIndexClicked,this.currentIndexClicked,this.sortedData);
    // let sortedNumber = [this.lastIndexClicked,this.currentIndexClicked].sort()
    // let slicedData = this.sortedData.slice(sortedNumber[0],sortedNumber[1]+1)
    // console.log("sliccesdData", slicedData);

      // this.sortedData.forEach((ele:any,i)=>{
        //  if (i >=sortedNumber[0] && i <=sortedNumber[1]) {
        //     ele.isSelected = true
        //     this.selectAsset({checked:true,update:false}, ele, i)
        //  }
        // })
      // })

  }

  shiftkeyUp($event,item,i){
    let sortedNumber = [this.lastIndexClicked,this.currentIndexClicked].sort()
    this.sortedData.forEach((ele:any,i)=>{
         if (i >=sortedNumber[0] && i <=sortedNumber[1] && !this.checkGeneralFolder(ele)) {
          if( !ele.isSelected) {
            ele.isSelected = true
            this.selectAsset({checked:true,update:true}, ele, i)
          }
         }
      })
      this.sortedDataList.emit(this.sortedData)
  }
  
  rightClickSelectAll(){
    this.removeAssets()
    this.sortedData.forEach((e,i) => {
      if(!this.checkGeneralFolder(e)){
        e.isSelected = true
        this.selectAllClicked = true
        this.selectAsset({checked:true , update:true}, e, i)
      }
    });
    this.sortedDataList.emit(this.sortedData)
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
    if(this.selectAllClicked) updateCount = true
    if ($event.target?.checked || $event.checked) {
      if (this.lastIndexClicked ==undefined) {
        this.currentIndexClicked = i
        this.lastIndexClicked = i

      }else{
        this.lastIndexClicked = this.currentIndexClicked
        this.currentIndexClicked = i
      }
      if (updateCount) {
        this.count = this.count + 1
        this.selectedCount.emit({allCount:this.count,assetCount:this.assetCount})

      };
      this.downloadArray.push(item.uid);
        this.downloadFullItem.push(item);
      this.selectedFolderList[i] = item;
      this.selectedMoveList[i] = item;
    } else {
      if (updateCount){
         this.count = this.count - 1;
         this.selectedCount.emit({allCount:this.count,assetCount:this.assetCount})

        }
        this.downloadArray = this.downloadArray.filter((m) => m !== item.uid);
        this.downloadFullItem = this.downloadFullItem.filter(
          (m) => m.uid !== item.uid
        );
      delete this.selectedFolderList[i];
      delete this.selectedMoveList[i];
        if (this.count==0) {
          this.currentIndexClicked = undefined
          this.lastIndexClicked = undefined
          this.selectAllClicked = false

        }else{
          this.lastIndexClicked = this.currentIndexClicked
          this.currentIndexClicked = undefined
        }
    }
    this.clickHandle.emit({eventName: 'downloadArray', data: this.downloadArray});
    this.selectedAssetList.emit(this.selectedFolderList);
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
    this.assetCount = 0;
    this.selectedCount.emit({allCount:this.count,assetCount:this.assetCount});
    this.fileSelected = [];
    this.copyRightItem = [];
    this.canNotDelete=[];
    this.selectedFolderList={};
    this.selectedMoveList={};
    this.selectedMoveListNew = {};
    this.selectAllClicked =false;
    this.selectedAssetMoveList.emit(this.selectedMoveListNew);
    this.canNotDeleteList.emit(this.canNotDelete);
    this.clickHandle.emit({eventName: 'forInternalUseList', data: this.forInternalUse});
    this.clickHandle.emit({eventName: 'copyRightItemEvent', data: this.copyRightItem});
    this.clickHandle.emit({eventName: 'needPermissionToDownloadEvent', data: this.needPermissionToDownload});
    this.clickHandle.emit({eventName: 'downloadArray', data: this.downloadArray});
    this.selectedAssetList.emit(this.selectedFolderList);
    this.removeSelection();
  }

  checkDownloadPermission(item) {
    if (item.properties["sa:downloadApprovalUsers"]?.length >0 || item.properties["dc:isPrivate"]) return true;
    return false
  }

  // async openMoveModal(move) {
  // //   const listDocs = Object.values(this.selectedMoveList)
  // //   .filter( item => !this.checkDownloadPermission(item))
  // //  console.log("listDocslistDocs",listDocs);
    
  //   // if (!listDocs.length) return this.moveModalFailed()
  //   const dialogConfig = new MatDialogConfig();
  //   // The user can't close the dialog by clicking outside its body
  //   dialogConfig.id = "modal-component";
  //   dialogConfig.width = "660px";
  //   dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
  //   dialogConfig.data = {
  //     selectedList: this.selectedMoveList,
  //     parentId: this.currentWorkspace.uid,
  //     sectorList: [], //  this.folderStructure[0]?.children ||
  //     user:this.user,
  //     move
  //   }

  //   const modalDialog = this.matDialog.open(MoveCopyAssetsComponent, dialogConfig);

  //   modalDialog.afterClosed().subscribe((result) => {
  //     if (result) {
  //       // delete this.folderAssetsResult[result.uid];
  //       // delete this.folderAssetsResult[this.currentWorkspace.uid];

  //       this.loading = true;
  //       setTimeout(() => {
  //         if (this.currentWorkspace.type === 'Domain') window.location.reload();
  //         else {
  //           // this.handleClickNew(this.currentWorkspace.uid);
  //         }
  //       }, 1000);
  //     }
  //   });
  // }
  async openMoveModal(move=true) {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "660px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    dialogConfig.data = {
      selectedList: this.selectedMoveList,
      parentId: this.breadCrumb[0]?.uid,
      sectorList: this.folderStructure[0]?.children || [],
      user:this.user,
      move,
    }

    const modalDialog = this.matDialog.open(MoveCopyAssetsComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        // delete this.folderAssetsResult[result.uid];
        // delete this.folderAssetsResult[this.selectedFolder.uid];
        this.removeAssets();
        this.loading = true;
        setTimeout(() => {
          // if (this.selectedFolder.type === 'Domain') window.location.reload();
          // else this.handleClickNew(this.selectedFolder.uid);
        }, 1000);
      }
    });
  }

  navigateToTrash() {
    this.router.navigate(['workspace', 'trash']);
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
      this.navigateToTrash.bind(this)
    );
    this.searchList = this.searchList.filter(
      (item) => !listDocs.includes(item["uid"])
    );
    this.sortedData = this.searchList.slice();
    this.sortedDataList.emit(this.sortedData)
    // this.hasUpdatedChildren.push(this.currentWorkspace.uid); // Note* this variable may be use for children folders
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
      this.removeAssets()
  }
  
  copyLink(asset: IEntry, assetType: string) {
    this.increaseWidth = true;
    asset.copy = this.sharedService.copyLink(asset.uid, assetType, asset.properties['dc:sector']);

    this.sharedService.showSnackbar(
      "Link copied",
      4000,
      "top",
      "center",
      "snackBarMiddle"
    );
    // setTimeout(() => {
    //   asset.copy = null;
    //   this.increaseWidth = false;
    // }, 4000);
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
    if(this.checkAssetMimeTypes(file) == 'nopreview') {
      this.openGetNoPreview = true;
    } else {
      this.openGetNoPreview = false;
    }
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
      this.getAssetUrl(true, this.fileToPreviewUrl, file);
    }

    this.previewModal.open();
    this.openGetNoPreview = false;
  }
  
  // getAssetUrl(event: any, url: string, document?: any, type?: string): string {
  //   if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
  //     return this.sharedService.getNoPreview(document);
  //     // return '../../../assets/images/no-preview.png';
  //   }
  //   if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
  //     return this.sharedService.getNoPreview(document);
  //     // return '../../../assets/images/no-preview-grid.svg';
  //   }
  //  return this.sharedService.getAssetUrl(event, url, type);
  // }

  
  // open(file, fileType?: string): void {
  //   // console.log('item', this.checkAssetMimeTypes(file));
  //   if(this.checkAssetMimeTypes(file) == 'nopreview') {
  //     this.openGetNoPreview = true;
  //   } else {
  //     this.openGetNoPreview = false;
  //   }

  //   this.showShadow = false;
  //   this.activeTabs.comments = false;
  //   this.activeTabs.timeline = false;
  //   this.activeTabs.info = false;
  //   let fileRenditionUrl;
  //   this.selectedFile = file;
  //   // if (!fileType) {
  //   switch (fileType.toLowerCase()) {
  //     case ASSET_TYPE.PICTURE:
  //       fileType = "image";
  //       break;
  //     case ASSET_TYPE.VIDEO:
  //       fileType = "video";
  //       break;
  //     default:
  //       fileType = "file";
  //       break;
  //   }
  //   // }
  //   this.sharedService.markRecentlyViewed(file);
  //   if (fileType === "image") {
  //     const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
  //     fileRenditionUrl = url; // file.properties['file:content'].data;
  //     // this.favourite = file.contextParameters.favorites.isFavorite;
  //   } else if (fileType === "video") {
  //     fileRenditionUrl = file.properties["vid:transcodedVideos"][0]?.content.data || file.properties['file:content'].data;
  //   } else if (fileType === "file") {
  //     const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/pdf`;
  //     // fileRenditionUrl = `${this.getNuxeoPdfViewerURL()}${encodeURIComponent(url)}`;
  //     fileRenditionUrl = file.properties["file:content"].data;
  //     // fileRenditionUrl = url;
  //   }
  //   this.selectedFileUrl =
  //     // fileType === "image"?
  //       this.getAssetUrl(null, fileRenditionUrl, {...file, update:true } )
  //       // : fileRenditionUrl;
  //   // if(fileType === 'file') {
  //   //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
  //   // }

  //   this.previewModal.open();
  //   this.openGetNoPreview = false;
  // }

  getAssetUrl(event: any, url: string, document?: IEntry, type?: string): string {
    const mimeType = document?.properties?.['file:content']?.['mime-type'];
    if(mimeType?.includes('pdf') && !document?.update)
      return '../../../assets/images/pdf-updateIcon.svg';

    if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
      // return '../../../assets/images/no-preview-grid.svg';
      return this.getNoPreview(document);
    }
    if(type =="thumbnail" ){
      let thumbNailUrl = url ? url :document.properties['file:content'].data
      return this.sharedService.getAssetUrl(event, thumbNailUrl, document, type);
    }
   return this.sharedService.getAssetUrl(event, url, document, type);
  }

  getNoPreview(item) {
    const splitedData = item?.title?.split('.');
    const mimeType = splitedData?.[splitedData?.length - 1];
    const lowercaseMime = mimeType?.toLowerCase();

    if(this.openGetNoPreview){
      return '../../../assets/images/no-preview-big.png';
    } else {
      if(lowercaseMime == 'doc' || lowercaseMime == 'docx'){
        return '../../../assets/images/doc-updateIcon.svg';
      }
      if(lowercaseMime == 'ppt' || lowercaseMime == 'pptx'){
        return '../../../assets/images/ppt-updateIcon.svg';
      }
      if(item.update) {
        // return '../../../assets/images/no-preview.png';
        return '../../../assets/images/no-preview-big.png';
      }

      return '../../../assets/images/no-preview-grid.svg';
    }
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

  sortData(sort: { active: string; direction: string}) {
    const data = this.searchList.slice();
    if (!sort.active || sort.direction === "") {
      this.sortedData = data;
      this.sortedDataList.emit(this.sortedData)
      return;
    }

    this.sortedData = data.sort((a: IEntry, b: IEntry) => {
      const isAsc = sort.direction === "asc";
      this.arrowisAsc[sort.active] = !isAsc;
      switch (sort.active) {
        case "title":
          return this.compare(a.title.toLowerCase(), b.title.toLowerCase(), isAsc);
        case "dc:creator":
          return this.compare(
            this.getCreatorName(a).toLowerCase(),
            this.getCreatorName(b).toLowerCase(),
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
            a.properties["dc:sector"].toLowerCase(),
            b.properties["dc:sector"].toLowerCase(),
            isAsc
          );
        case "dc:modified":
          return this.compare(
            a.properties["dc:modified"],
            b.properties["dc:modified"],
            isAsc
          );
        case "fileType":
          return this.compare(
            this.getFileType(a),
            this.getFileType(b),
            isAsc
          );
        default:
          return 0;
      }
    });
    this.sortedData.sort(this.assetTypeCompare);
    this.sortedDataList.emit(this.sortedData);
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
  
  selectAllToggle(e) {
    if(e.target.checked) {
      this.rightClickSelectAll();
      this.selectAllClicked = true;
    } else {
      this.removeAssets();
      this.selectAllClicked = false;
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

  getFileType(item) {
    // console.log(item);
    if(item.type === 'Workspace' || item.type === 'Folder' || item.type === 'OrderedFolder') {
      return '';  
    }
    const splittedData = item.title.substring(item.title.length - 4);
    // console.log(splittedData);
    var number = 0;
    
    if (splittedData[0] === '.') {
      number = 1;
    }
    else if(splittedData[1] === '.') {
      number = 2;
    }
    else if(splittedData[2] === '.') {
      number = 3;
    }

    return splittedData.substring(number).toLowerCase();
  }


  openFolder(item: IEntry) {
    this.removeAssets();
    this.router.navigate([window.location.pathname.split('/').splice(1,2).join('/'), item.uid]);
  }

  removeSelection() {
    this.sortedData.forEach((item) => {
      item['isSelected'] = false;
      item['edit'] = false;
    });
    this.sortedDataList.emit(this.sortedData);
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

  unSelectEnable(){
    let checkGen = false
    for (let i = 0; i < this.sortedData.length; i++) {
      if(this.checkGeneralFolder( this.sortedData[i])) {
        checkGen=true
        break;
      }
    }

    if (checkGen) return this.count ==this.sortedData.length-1
    return this.count ==this.sortedData.length
  }

  createDynamicSidebarScroll() {
    setTimeout(() => {
      var storeHeight = $(".main-content").outerHeight();
      $(".leftPanel.insideScroll").css("height", storeHeight - 80);

      var getWidth1 = $('.getWidth1').outerWidth();
      var getWidth2 = $('.getWidth2').outerWidth();
      var getWidth3 = $('.getWidth3').outerWidth();
      var totalWidth = getWidth1 + getWidth2 + getWidth3;
      console.log('getWidth2', getWidth2);
      $('.chkbox.width1600').css("width", totalWidth - 60);

      // $('.itemTitleContent').css("width", getWidth2 - 30 )
    }, 0);
  }

  getDateInFormat1(date: string): string {
    return moment(date).format("DD/MM/YYYY")
  }

  checkShowNoTrashItem() {
    return !this.isTrashView && this.searchList && this.searchList.length === 0;
  }

  selectedFoldersLength(): number {
    return Object.keys(this.selectedFolderList).length;
  }

  /**
   * checks if an asset is selected and edit is true then no other row can be selected
   */
  checkForAssetSelectCondition(): boolean {
    for(let key in this.selectedFolderList) {
      if(this.selectedFolderList[key].edit) {
        return true;
      }
    }
    return false;
  }

  async fetchFolder(id) {
    const result: any = await this.apiService
      .get(`/id/${id}?fetch-acls=username%2Ccreator%2Cextended`, {
        headers: { "fetch-document": "properties" },
      })
      .toPromise();
    return result;
  }

  async openManageAccessModal(folderId) {
    // this.loading = true;
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.panelClass = "custom-modalbox";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body
    const folder = (await this.fetchFolder(folderId)) as any;
    if (!this.checkHasAdminPermission(folder)) return;

    dialogConfig.data = {
      selectedFolder: folder
    };

    const modalDialog = this.matDialog.open(
      ManageAccessModalComponent,
      dialogConfig
    );

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.currentWorkspace = result;
        if (result?.properties && result?.properties["dc:isPrivate"]) {
          result.properties["isPrivateUpdated"] = true;
        }
        // this.saveState(result);
        this.sortedData.forEach((item: IEntry) => {
          if(result.uid === item.uid) {
            item.properties["dc:isPrivate"] = result?.properties?.["dc:isPrivate"];
          }
        });
      }
      this.sortedData = this.sortedData.slice();
      this.removeAssets();
    });
  }

  checkHasAdminPermission(folder) {
    const currentCollaborators = this.sharedService.getFolderCollaborators(folder);
    return this.hasAdminPermission(currentCollaborators, folder);
  }

  hasAdminPermission(currentCollaborators, folder) {
    if (localStorage.getItem("user")) {
      this.user = JSON.parse(localStorage.getItem("user"))["username"];
    }
    // console.log('currentCollaborators', currentCollaborators, this.user)
    if (this.user === "Administrator") return true;
    const currentWorkspace = folder ? folder : JSON.parse(localStorage.getItem("workspaceState"));
    if (
      currentWorkspace?.properties &&
      currentWorkspace?.properties["isPrivateUpdated"]
    )
      return true;
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0)
      return false;
    const ace = currentCollaborators[this.user];
    if (!ace) return false;
    return ace.permission.includes("Everything");
  }

}
