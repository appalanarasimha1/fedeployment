import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { UploadModalComponent } from 'src/app/upload-modal/upload-modal.component';
import { DataService } from 'src/app/services/data.service';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxMasonryComponent } from 'ngx-masonry';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpdateModalComponent } from '../../update-modal/update-modal.component';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-browse',
  // directives: [Search],
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent implements OnInit {
  

  @ViewChild(NgxMasonryComponent) masonry: NgxMasonryComponent;

  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    private http: HttpClient,
    private apiService: ApiService,
    private router: Router,
    private sharedService: SharedService,
    private route: ActivatedRoute) { }

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

  selectedFile = [];
  routeParams = {
    sector: '',
    folder: ''
  };
  breadcrrumb = ""
    
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
  }

  openVerticallyCentered(content) {
    this.modalService.open(content, { centered: true });
  }

  handleTest(item) {
    // this.selectedFolder = item;
    // this.selectedFile = [];
    // this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    // .subscribe((docs: any) => {
    //   this.searchList = docs.entries;
    // });
    this.selectedFolder = item;
    this.breadcrrumb = `${this.breadcrrumb.split(`/`)[0]}/${this.breadcrrumb.split(`/`)[1]}/${this.breadcrrumb.split(`/`)[2]}/${item.title}`
    this.selectedFile = [];
    this.apiService.get(`/search/pp/advanced_document_content/execute?currentPageIndex=0&offset=0&pageSize=40&ecm_parentId=${item.uid}&ecm_trashed=false`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
    });
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

  handleSelectFile(item, index) {
    this.selectedFile.push(item);
    this.searchList[index].isSelected = !this.searchList[index].isSelected;
  }

  handleClick(item, index, childIndex?: any) {
    if(this.breadcrrumb.includes(item.title)) {
      this.breadcrrumb = this.breadcrrumb.split(`/${item.title}`)[0]
    }
    this.breadcrrumb = `${this.breadcrrumb}/${item.title}`
    this.selectedFile = [];
    this.loading = true;
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
      let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
      if(workSpaceIndex >= 0) {
        this.loading = false;
        return this.handleClick(this.searchList[workSpaceIndex],index, childIndex);
        // this.fetchAssets(this.searchList[workSpaceIndex],index, childIndex);
      } else {
        if(childIndex !== null && childIndex !== undefined) {
          console.log(docs)
          this.folderStructure[index].children[childIndex].children = docs.entries;
          // this.folderStructure[index].children[childIndex].isExpand = !this.folderStructure[index].children[childIndex].isExpand;
          // let ind;
          // let callHandClick = this.folderStructure[index].children.find((item, i) => {
          //   if(item.uid === this.routeParams.sector) {
          //     ind = i;
          //     return item;
          //   }

          // });
          // let callHandleTest = this.folderStructure[index].children.find(item => item.title.toLowerCase() === this.routeParams.folder);
          // if(callHandleTest) this.handleTest(callHandleTest);
          // if(callHandClick) this.handleClick(callHandClick, ind, null);

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
        } else {
          this.loading = false;
          if(!this.sectorOpen) {
            this.folderStructure[index].children = docs.entries; // index = parent index in folder structure
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

  fetchAssets(item, index, childIndex?:any) {
    this.selectedFolder = item;
    this.selectedFile = [];
    this.apiService.get(`/search/pp/advanced_document_content/execute?currentPageIndex=0&offset=0&pageSize=40&ecm_parentId=7d597231-23f8-42e1-9324-c3898517c58a&ecm_trashed=false`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
    });
      // .subscribe((docs: any) => {
      //   this.searchList = docs.entries;
      //   let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
      //   if (workSpaceIndex >= 0) {
      //     this.handleClick(this.searchList[workSpaceIndex], index, childIndex)
      //   } else {
      //     if (childIndex !== null && childIndex !== undefined) {
      //       this.folderStructure[index].children[childIndex].children = docs.entries;
      //       this.folderStructure[index].children[childIndex].isExpand = !this.folderStructure[index].children[childIndex].isExpand;
      //     } else {
      //       this.folderStructure[index].children = docs.entries;
      //       this.folderStructure[index].isExpand = !this.folderStructure[index].isExpand
      //     }
      //   }
      // });
  }


  handleChangeClick(item, index, selected: any, childIndex?: any) {
    this.selectedFile = [];
    this.selectedFolder = {...selected, uid: selected.id};
    console.log("selected", this.selectedFolder)
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
      .subscribe((docs: any) => {
        this.searchList = docs.entries;
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
  }
}

