import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ASSET_TYPE, constants } from '../common/constant';
import { IBrowseSidebar, IEntry } from '../common/interfaces';
import { PreviewPopupComponent } from '../preview-popup/preview-popup.component';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-masonry-view',
  templateUrl: './masonry-view.component.html',
  styleUrls: ['./masonry-view.component.css']
})
export class MasonryViewComponent implements OnInit, OnChanges {

  @Input() searchList: IEntry[] = [];
  @Input() isTrashView: boolean = false;
  @Input() trashedList: IEntry[] = [];
  @Input() searchBarValue;
  @Input() showAssetPath: boolean = false;
  @Input() currentWorkspace: IEntry;
  @Input() breadCrumb = [];
  @Input() folderStructure: IBrowseSidebar[] = [];

  @Output() clickHandle: EventEmitter<any> = new EventEmitter();
  @Output() fetchAssets: EventEmitter<any> = new EventEmitter();
  @Output() selectedAssetList: EventEmitter<any> = new EventEmitter();

  @ViewChild("previewModal") previewModal: PreviewPopupComponent;
  @ViewChild("paginator") paginator: MatPaginator;

  fileSelected: IEntry[] = [];
  activeTabs = { comments: false, info: false, timeline: false };
  fileToPreview: IEntry;
  fileToPreviewUrl: string;
  lastIndexClicked: number;
  currentIndexClicked: number;
  numberOfPages: number= 0;
  resultCount: number = 0;
  currentPageCount: number = 0;
  defaultPageSize: number = 20;
  pageSizeOptions = [20, 50, 100];

  constructor(
    public sharedService: SharedService,
    private router: Router,
  ) { }

  ngOnInit(): void {
  }
  
  ngOnChanges(changes: SimpleChanges) {
    this.searchList = this.searchList?.slice();
    this.numberOfPages = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.numberOfPages;
    this.resultCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.resultsCount;
    this.currentPageCount = changes?.folderStructure?.currentValue[this.currentWorkspace?.uid]?.currentPageSize;
  }

  markFavourite(item: IEntry): void {

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

  
  selectImage(event: any, file: any, index: number, isRecent?: boolean): void {
    // this.selectAsset(event, file, index);
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

  open(file, fileType?: string): void {
    // this.showShadow = false;
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
  
  getFolderInfo(item) {
    if (item.isTrashed) return item.properties["dc:creator"].id;
    const count = item.contextParameters?.folderAssetsCount || 0;
    return `${count} assets curated by ${item.properties["dc:creator"].id}`;
  }
  
  checkWSType(assetType: string) {
    return assetType.toLowerCase() === ASSET_TYPE.WORKSPACE || assetType.toLowerCase() === ASSET_TYPE.ORDERED_FOLDER;
  }
  
  shiftkeyUp($event,item,i){
    let sortedNumber = [this.lastIndexClicked,this.currentIndexClicked].sort()
    this.searchList.forEach((ele:any,i)=>{
         if (i >=sortedNumber[0] && i <=sortedNumber[1] && !this.checkGeneralFolder(ele)) {
          if( !ele.isSelected) {
            ele.isSelected = true
            // this.selectAsset({checked:true,update:true}, ele, i)
          }
         }
      })
  }
  
  checkGeneralFolder(item){
    return item?.type?.toLowerCase() === constants.WORKSPACE && item?.title?.toLowerCase() === constants.GENERAL_FOLDER;
  }

  openFolder(item: IEntry) {
    this.router.navigate([window.location.pathname.split('/').splice(1,2).join('/'), item.uid]);
  }

}
