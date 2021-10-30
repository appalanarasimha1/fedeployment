import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ApiService} from '../../services/api.service';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-browse',
  // directives: [Search],
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent implements OnInit {

  constructor(private modalService: NgbModal, private http: HttpClient,private apiService: ApiService,) { }
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

  folderStructure:any = [{
    uid: '00000000-0000-0000-0000-000000000000',
    title: 'Root',
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
    this.selectedFolder = item;
    this.selectedFile = [];
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
    });
  }
  
  handleSelectFile(item, index) {
    this.selectedFile.push(item);
    this.searchList[index].isSelected = !this.searchList[index].isSelected
  }

  handleClick(item, index, childIndex?:any) {
    this.selectedFile = [];
    this.apiService.get(`/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=20&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${item.uid}' AND ecm:name LIKE '%' AND ecm:mixinType = 'Folderish' AND ecm:mixinType != 'HiddenInNavigation' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`)
    .subscribe((docs: any) => {
      this.searchList = docs.entries;
      let workSpaceIndex = this.searchList.findIndex(res => res.title === "Workspaces");
      if(workSpaceIndex >= 0) {
        this.handleClick(this.searchList[workSpaceIndex],index, childIndex)
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

  handleSelectMenu(index) {
    this.selectedMenu = index
  }
}

