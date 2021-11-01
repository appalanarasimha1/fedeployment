import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ApiService} from '../../services/api.service';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { NgxMasonryComponent } from 'ngx-masonry';

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
    private http: HttpClient,
    private apiService: ApiService,
    private router: Router) { }
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
  

  completeLoadingMasonry(event: any) {
    this.masonry.layout();
  }

  folderStructure:any = [{
    uid: '00000000-0000-0000-0000-000000000000',
    title: 'All sectors',
    menuId: '00000000-0000-0000-0000-000000000000',
    parentMenuId: null,
    isExpand: false,
    path: ''
  }]

  selectedFile = [];
  
      
  ngOnInit(): void {
    this.selectedFolder = this.folderStructure[0]
    this.handleClick(this.folderStructure[0],0,null );
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

  handleClick(item, index, childIndex?:any) {
    this.selectedFile = [];
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
      let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
      if(workSpaceIndex >= 0) {
        this.handleClick(this.searchList[workSpaceIndex],index, childIndex);
        // this.fetchAssets(this.searchList[workSpaceIndex],index, childIndex);
      } else {
        if(childIndex !== null && childIndex !== undefined) {
          this.folderStructure[index].children[childIndex].children = docs.entries;
          this.folderStructure[index].children[childIndex].isExpand = !this.folderStructure[index].children[childIndex].isExpand;
        } else {
          this.folderStructure[index].children = docs.entries;
          this.folderStructure[index].isExpand = !this.folderStructure[index].isExpand
        }
      }
      console.log(this.selectedFolder)
    });
  }

  fetchAssets(item, index, childIndex?:any) {
    this.selectedFolder = item;
    this.selectedFile = [];
    this.apiService.get(`/search/pp/advanced_document_content/execute?currentPageIndex=0&offset=0&pageSize=40&ecm_parentId=7d597231-23f8-42e1-9324-c3898517c58a&ecm_trashed=false`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
    });
  }

  handleSelectMenu(index) {
    this.selectedMenu = index
  }
}

