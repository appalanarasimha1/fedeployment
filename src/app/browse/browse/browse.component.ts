import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { PreviewPopupComponent } from 'src/app/preview-popup/preview-popup.component';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxMasonryComponent } from 'ngx-masonry';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpdateModalComponent } from '../../update-modal/update-modal.component';
import { SharedService } from 'src/app/services/shared.service';
import { ASSET_TYPE, constants, localStorageVars, WORKSPACE_ROOT } from 'src/app/common/constant';
import { apiRoutes } from 'src/app/common/config';
import { NuxeoService } from 'src/app/services/nuxeo.service';
import { UNWANTED_WORKSPACES } from '../../upload-modal/constant';

@Component({
  selector: 'app-browse',
  // directives: [Search],
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent implements OnInit {


  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;
  @ViewChild('previewModal') previewModal: PreviewPopupComponent;

  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    private http: HttpClient,
    private apiService: ApiService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    public nuxeo: NuxeoService,) { }

  faCoffee = faCoffee;
  parentId = "00000000-0000-0000-0000-000000000000";
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
  viewType = 'GRID';
  showShadow = false;
  activeTabs = { comments: false, info: false, timeline: false };
  selectedFile: any;
  selectedFileUrl: string;
  tags = [];
  comments = [];
  inputTag = '';
  showTagInput = false;
  fileSelected = [];

  currentLevel = 0;
  folderAssetsResult: any = {};
  fetchFolderStatus: any = {};

  completeLoadingMasonry(event: any) {
    this.masonry?.reloadItems();
    this.masonry?.layout();
  }

  folderStructure: any = [{
    uid: '00000000-0000-0000-0000-000000000000',
    title: 'All sectors',
    menuId: '00000000-0000-0000-0000-000000000000',
    parentMenuId: null,
    isExpand: false,
    path: ''
  }]

  routeParams = {
    sector: '',
    folder: ''
  };
  breadcrrumb = `/${WORKSPACE_ROOT}`;

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
        console.log(params); // { orderby: "price" }
        this.routeParams.sector = params.sector;
        this.routeParams.folder = params.folder; // price
        // if(params.sector && params.folder) {
        //   // this.selectedFolder = {uid: params.sector};
        //   // this.handleClick(this.selectedFile, 0, null);
        //   return;

        // }
        this.selectedFolder = this.folderStructure[0];
        this.handleClick(this.folderStructure[0], 0, null);
      }
    );

    $('.acnav__label').click(function () {
      var label = $(this);
      var parent = label.parent('.has-children');
      var list = label.siblings('.acnav__list');
    
      if ( parent.hasClass('is-open') ) {
        list.slideUp('fast');
        parent.removeClass('is-open');
      }
      else {
        list.slideDown('fast');
        parent.addClass('is-open');
      }
    });
  }

  checkAssetType(assetType: string): boolean {
    const assetTypes = [constants.FILE_SMALL_CASE, constants.PICTURE_SMALL_CASE, constants.VIDEO_SMALL_CASE, constants.AUDIO_SMALL_CASE ];
    if(assetTypes.indexOf(assetType.toLowerCase()) !== -1) return true;
    else return false;
  }

  closeOtherSectore(child, children) {
    this.createBreadCrumb(child.title, child.type, child.path);
    for(let i = 0; i < children.length; i++) {
      if(child.uid === children[i].uid) {
        child.isExpand = !child.isExpand;
      } else {
        children[i].isExpand = false;
      }
    }
    return;
  }

  checkWSType(assetType: string) {
    return assetType === "Workspace";
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, { centered: true });
  }

  async handleTest(item) {
    // this.selectedFolder = item;
    // this.selectedFile = [];
    // this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    // .subscribe((docs: any) => {
    //   this.searchList = docs.entries;
    // });
    this.selectedFolder = item;
    this.createBreadCrumb(item.title, item.type, item.path);
    // this.breadcrrumb = `${this.breadcrrumb.split(`/`)[0]}/${this.breadcrrumb.split(`/`)[1]}/${this.breadcrrumb.split(`/`)[2]}/${item.title}`
    // this.selectedFile = [];
    // this.apiService.get(`/search/pp/advanced_document_content/execute?currentPageIndex=0&offset=0&pageSize=40&ecm_parentId=${item.uid}&ecm_trashed=false`)
    // .subscribe((docs: any) => {
    //   this.searchList = docs.entries;
    // });
    const docs = await this.fetchAssets(item.uid);
    this.searchList = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    if(!url) return '';
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    this.loading = true;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);
          this.loading = false;
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);
        this.loading = false;
        // event.target.src = new Blob(d);
      }
      ).catch(e => {
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
        case 'Picture':
          fileType = 'image';
          break;
        case 'Video':
          fileType = 'video';
          break;
        default:
          fileType = 'file';
          break;
      }
    // }
    if(fileType === 'image') {
      this.markRecentlyViewed(file);

      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/Medium`;
      fileRenditionUrl = url; // file.properties['file:content'].data;
      // this.favourite = file.contextParameters.favorites.isFavorite;
    } else if(fileType === 'video') {
      fileRenditionUrl = file.properties['vid:transcodedVideos'][0]?.content.data || "";
    } else if (fileType === 'file') {
      const url = `/nuxeo/api/v1/id/${file.uid}/@rendition/pdf`;
      // fileRenditionUrl = `${this.getNuxeoPdfViewerURL()}${encodeURIComponent(url)}`;
      fileRenditionUrl = file.properties['file:content'].data;
      // fileRenditionUrl = url;
    }
    this.selectedFileUrl = fileType === 'image' ? this.getAssetUrl(null, fileRenditionUrl) : fileRenditionUrl;
    // if(fileType === 'file') {
    //   this.getAssetUrl(true, this.selectedFileUrl, 'file');
    // }

    this.previewModal.open();
  }

  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed = JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed[index] = data;
        }
      });
    }
    if (found) {
      localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
      return;
    }

    data['isSelected'] = false;
    recentlyViewed.push(data);
    localStorage.setItem(localStorageVars.RECENTLY_VIEWED, JSON.stringify(recentlyViewed));
    return;
  }

  // handleSelectFile(item, index) {
  //   this.selectedFile.push(item);
  //   this.searchList[index].isSelected = !this.searchList[index].isSelected;
  // }

  handleViewClick(item, index) {
    if (this.currentLevel < 1) {
      this.handleClick(item, this.currentLevel, index);
    } else {
      this.handleTest(item);
    }
  }

  createBreadCrumb(title: string, type: string, path?: string): void {
    if(!type) {
      this.breadcrrumb = `/${WORKSPACE_ROOT}`;
      return;
    }
    if(type.toLowerCase() === ASSET_TYPE.DOMAIN) {
      this.breadcrrumb = `/${WORKSPACE_ROOT}/${title}`;
    } else if(type.toLowerCase() === ASSET_TYPE.WORKSPACE) {
      const bread = this.breadcrrumb.split('/');
      const definedPath = path.split('/');
      this.breadcrrumb = `/${bread[1]}/${(bread[2] === 'undefined' || !bread[2]) ? definedPath[1] : bread[2]}/${this.sharedService.stringShortener(title, 50)}`;
    }
    // this.breadcrrumb =  `/${WORKSPACE_ROOT}${path}`;
  }

  removeWrokspaceFromBreadcrumb(): string {
    return this.breadcrrumb.replace(/\/workspaces/gi, '');
  }

  handleClick(item, index, childIndex?: any) {
    this.currentLevel = index;

    this.createBreadCrumb(item.title, item.type, item.path);
    // if(this.breadcrrumb.includes(item.title)) {
    //   this.breadcrrumb = this.breadcrrumb.split(`/${item.title}`)[0]
    // }
    // this.breadcrrumb = `${this.breadcrrumb}/${item.title}`
    // this.selectedFile = [];
    this.loading = true;
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
      let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
      if(workSpaceIndex >= 0) {
        this.loading = false;
        return this.handleClick(this.searchList[workSpaceIndex],index, childIndex);
        // this.fetchAssets(this.searchList[workSpaceIndex],index, childIndex);
      } else {
        if(childIndex !== null && childIndex !== undefined) {
          this.loading = false;
          this.folderStructure[index].children[childIndex].children = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
          this.folderStructure[index].children[childIndex].isExpand = true;

          if(!this.callFolder && this.routeParams.folder) {
            this.folderStructure[index].children[this.ind].children = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
            let lastChild = this.folderStructure[index].children[this.ind].children.find((item, i) => {
              if(item.title.toLowerCase() === this.routeParams.folder.toLowerCase()) {
                this.ind = i;
                // this.folderStructure[index].children[this.ind].children[i].isExpand = true;
                console.log(this.callHandClick)
                this.breadcrrumb = `/All sectors/${this.callHandClick.title}/${item.title}`
                return item;
              }
            });
            this.selectedFolder = lastChild;
            if(lastChild) {
              this.handleTest(lastChild);
            }

          }
        } else {
          this.loading = false;
          if(!this.sectorOpen) {
            this.folderStructure[index].children = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1); // index = parent index in folder structure
            console.log(docs)
            this.folderStructure[index].isExpand = !this.folderStructure[index].isExpand;
            this.callHandClick = this.folderStructure[index].children.find((item, i) => {
              if(item.uid === this.routeParams.sector) {
                this.ind = i;
                this.folderStructure[index].children[this.ind].isExpand = true;
                return item;
              }
            });
            this.sectorOpen = true;
            this.callDomain
          }

          if(!this.callDomain && this.routeParams.sector) {
            this.callDomain = true;
            this.callHandClick = this.folderStructure[index].children.find((item, i) => {
              if(item.uid === this.routeParams.sector) {
                this.ind = i;
                this.folderStructure[index].children[this.ind].isExpand = true;
                return item;
              }
            });
            if(this.callHandClick) {
              this.selectedFolder = this.callHandClick;

              this.handleClick(this.callHandClick, index, this.ind);
              return;
            }
          }

          if(!this.callFolder && this.routeParams.folder) {
            this.folderStructure[index].children[this.ind].children = docs.entries;
            let lastChild = this.folderStructure[index].children[this.ind].children.find((item, i) => {
              if(item.title.toLowerCase() === this.routeParams.folder.toLowerCase()) {
                this.ind = i;
                // this.folderStructure[index].children[this.ind].children[i].isExpand = true;
                console.log(this.callHandClick)
                this.breadcrrumb = `/All sectors/${this.callHandClick.title}/${item.title}`
                return item;
              }
            });
            this.selectedFolder = lastChild;
            if(lastChild) {
              this.handleTest(lastChild);
            }

          }




          // let callHandleTest = this.folderStructure[index].children[this.ind].children.find(item => item.title.toLowerCase() === this.routeParams.folder);
          // if(callHandleTest) this.handleTest(callHandleTest);


        }
      }
    });
  }

  async fetchAssets(id) {
    if (this.folderAssetsResult[id]) return this.folderAssetsResult[id];
    const result = await this.apiService.get(`/search/pp/advanced_document_content/execute?currentPageIndex=0&offset=0&pageSize=40&ecm_parentId=${id}&ecm_trashed=false`).toPromise();
    const res = JSON.stringify(result)
    this.folderAssetsResult[id] = JSON.parse(res);
    delete this.fetchFolderStatus[id];
    return this.folderAssetsResult[id];
  }


  handleChangeClick(item, index, selected: any, childIndex?: any) {
    // this.selectedFile = [];
    this.selectedFolder = {...selected, uid: selected.id};
    console.log("selected", this.selectedFolder)
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
      .subscribe((docs: any) => {
        this.searchList = docs.entries.filter(sector => UNWANTED_WORKSPACES.indexOf(sector.title.toLowerCase()) === -1);
        let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
        if (workSpaceIndex >= 0) {
          this.handleChangeClick(this.searchList[workSpaceIndex], index, selected, childIndex)
        } else {
          if (childIndex !== null && childIndex !== undefined) {
            this.folderStructure[index].children[childIndex].children = docs.entries;
            this.folderStructure[index].children[childIndex].isExpand = true;
            this.handleTest(selected)
          } else {
            this.folderStructure[index].children = docs.entries;
            this.folderStructure[index].isExpand = true
          }
        }
      });
  }

  handleSelectMenu(index, type) {
    this.selectedMenu = index;
    this.viewType = type;
  }

  checkShowUpdateBtn() {
    return this.searchList?.length > 0 && this.selectedFolder?.type === "Workspace";
  }

  openUpdateClassModal() {
  // openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.minHeight = "350px";
    dialogConfig.height = "700px";
    dialogConfig.maxHeight = "900px"
    dialogConfig.width = "650px";
    dialogConfig.data = {
      docs: this.searchList,
      folder: this.selectedFolder
    }
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(UpdateModalComponent, dialogConfig);
    // https://material.angular.io/components/dialog/overview
    // const modalDialog = this.matDialog.open(UploadModalComponent, dialogConfig);
    // modalDialog.afterClosed().subscribe(result => {
    //   let data = {...result, uid: result.id};
    //   let findIndex = this.folderStructure?.[0]?.children.findIndex(res => res.path === `/default-domain`);
    //   let param1 = this.folderStructure[0].children[findIndex]
    //   this.handleChangeClick(param1, 0, data, findIndex)
    // });
    modalDialog.afterClosed().subscribe(result => {
      if (!result) return;
      Object.keys(result).forEach(key => {
        this.searchList[key].contextParameters.acls = result[key];
      });
    });
  }

  markFavourite(data, favouriteValue) {
    // this.favourite = !this.favourite;
    if(data.contextParameters.favorites.isFavorite) {
      this.unmarkFavourite(data, favouriteValue);
      return;
    }
    const body = {
      context: {},
      input: data.uid,
      params: {}
    };
    this.loading = true;
    this.apiService.post(apiRoutes.MARK_FAVOURITE, body).subscribe((docs: any) => {
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
        this.markRecentlyViewed(data);
      }
      this.loading = false;
    });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {}
    };
    this.loading = true;
    this.apiService.post(apiRoutes.UNMARK_FAVOURITE, body).subscribe((docs: any) => {
      // data.contextParameters.favorites.isFavorite = this.favourite;
      data.contextParameters.favorites.isFavorite = !data.contextParameters.favorites.isFavorite;
      if(favouriteValue === 'recent') {
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
    let count = 0;
    if (this.folderAssetsResult[item.uid]) count = this.folderAssetsResult[item.uid].resultsCount;
    else if (this.fetchFolderStatus[item.uid]) count = 0;
    else {
      this.fetchFolderStatus[item.uid] = true;
      this.fetchAssets(item.uid);
    }
    return `${count} assets curated by ${item.properties["dc:creator"]}`;
  }
  onActivate(event) {
    window.scroll(0,0);

}
}

