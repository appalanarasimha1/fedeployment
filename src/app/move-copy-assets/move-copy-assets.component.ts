import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER, ROOT_ID } from "../common/constant";
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { resourceUsage } from 'process';

@Component({
  selector: 'app-move-copy-assets',
  templateUrl: './move-copy-assets.component.html',
  styleUrls: ['./move-copy-assets.component.css']
})
export class MoveCopyAssetsComponent implements OnInit {

  folderUpdated: any;

  movedContentShow: boolean = false;
  selectedList: any;
  selectedIdList: any;
  selectedDestination: any;
  folderList: any;
  parentId: string;
  parent: any;
  prevParent: any;
  currentFolder: any;
  breadcrumb: any;
  sectorList: any;
  currentSector: string;
  user:string;
  move = true;

  loading = false;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<MoveCopyAssetsComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private modalService: NgbModal,
  ) {}

  async ngOnInit() {
    this.parent = this.data.parent;
    this.user = this.data.user
    this.selectedList = this.data.selectedList;
    this.move = this.data.move;
    this.currentSector = this.getSectorFromPath(Object.values(this.selectedList)[0])
    this.sectorList = this.data.sectorList;
    this.selectedIdList = Object.keys(this.selectedList).map(key => this.selectedList[key].uid);
    const parentId = this.data.parentId;
    this.currentFolder = this.parent;
    await this.fetchAssets(parentId);
    // this.folderList = this.sectorList || [];
    // if (this.folderList.length === 0) this.fetchAssets(parentId);
  }

  closeModal(destination?) {
    this.dialogRef.close(destination || this.selectedDestination);
  }
  selectFolder($event, folder){
    if(this.checkEnableCheckbox(folder)) { 
      if(this.selectedDestination?.uid === folder?.uid) {
        // this.movedContentShow = true;
        this.selectedDestination = null;
      } else {
        this.selectedDestination = folder;
        // this.movedContentShow = false;
      }
    }
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  async fetchAssets(id: string, pageSize = 100, pageIndex = 0, offset = 0) {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=${pageIndex}&offset=${offset}&pageSize=${pageSize}&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 0 AND ecm:parentId = '${id}' AND ecm:mixinType = 'Folderish'`;
    const result: any = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, true)
    );
    const workspaces = result.entries.find(entry => entry.type === "WorkspaceRoot");
    if (workspaces) {
      this.fetchAssets(workspaces.uid);
      return;
    }
    this.parentId = id;
    this.folderList = result.entries.filter(entry => !this.selectedIdList.includes(entry.uid));
    this.selectedDestination = null;
    this.extractBreadCrumb(this.folderList[0]);
  }

  async getSectorWs(id: string) {
    const url = `/search/pp/nxql_search/execute?currentPageIndex=0&offset=0&pageSize=100&queryParams=SELECT * FROM Document WHERE ecm:isTrashed = 0 AND ecm:parentId = '${id}' AND ecm:mixinType = 'Folderish'`;
    const result: any = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } })
      .toPromise();
    result.entries = result.entries.sort((a, b) =>
      this.compare(a.title, b.title, true)
    );
    const workspace = result.entries.find(entry => entry.type === "WorkspaceRoot");
    return workspace;
  }

  generateBreadCrumb() {

  }

  extractBreadCrumb(folder) {
    this.prevParent = null;
    if (!folder) return;
    const breadCrumb = folder.contextParameters?.breadcrumb?.entries;

    if (!breadCrumb || breadCrumb.length === 0) return;
    this.prevParent = breadCrumb[breadCrumb.length - 3];

  }

  goBack() {
    if (!this.checkCanGoBack()) return;
    // if (this.prevParent?.type === 'Domain') {
    //   this.folderList = this.sectorList || [];
    // } else {
      this.fetchAssets(this.currentFolder?.parentRef || ROOT_ID);
    // }

    if (this.prevParent.type === 'Domain') {
      this.currentFolder = null;
      this.fetchAssets(ROOT_ID);
    } else {
      this.currentFolder = this.prevParent;
    }
  }

  checkCanGoBack() {
    if (this.prevParent) {
      if (this.move) {
        if (this.prevParent.type !== 'Root' && this.prevParent.type !== 'Domain') return true;
      } else {
        if (this.prevParent.type !== 'Root') return true;
      }
    }
    if (!this.currentFolder || this.currentFolder.type === 'Domain') return false;
    return true;
  }

  checkCanDelete(item) {
    return this.user === item.properties["dc:creator"]?.id || this.user === item.properties["dc:creator"];
  }
  checkCanMove(m){
    return  ["workspace", "folder", "orderedfolder"].indexOf(m.type.toLowerCase()) !== -1
  }

  checkDownloadPermission(item){
    if (item.properties["sa:downloadApprovalUsers"]?.length >0 || item.properties["dc:isPrivate"]) return true;
    return false
  }

  checkMovePermission(item){
    return item.contextParameters?.permissions?.includes('ReadWrite');
  }

  async moveAssets() {
    let destination = this.selectedDestination ? this.selectedDestination : this.currentFolder;
    if (!destination) return;
    if (!this.move && !destination?.properties?.['dc:isPrivate']) {

      this.sharedService.showSnackbar(
        "You can only copy to a Locked folder destination",
        4000,
        "top",
        "center",
        "snackBarMiddle",
        null,
        null,
        0
      );
      return;
    }
    this.loading = true;
    if (destination.type === 'Domain') {
      destination = await this.getSectorWs(destination.uid)
    }
    const arrayCall = [];
    const arrayIndex = [];
    for (const key in this.selectedList) {
      if(this.checkMovePermission(this.selectedList[key]) || !this.move){
        arrayCall.push(this.moveAsset(this.selectedList[key], destination));
        arrayIndex.push(key)
      }

    }
    const res = await Promise.all(arrayCall);
    res.forEach((response, index) => this.showNoti(response.value, arrayIndex[index], index));

    this.closeModal(destination)
    this.loading = false;
  }

  showNoti(message, key, index) {
    const isFolder = this.selectedList[key]?.type.includes('Folder') || this.selectedList[key]?.type.includes('Workspace');

    this.sharedService.showSnackbar(
      message === 'OK' ? `${isFolder ? 'Folder' : 'Asset'} ${this.selectedList[key]?.title} has been ${this.move?"moved":"copied"} successfully`
      : `Cannot move ${this.selectedList[key]?.title}: ${message}`,
      4000,
      "top",
      "center",
      "snackBarMiddle",
      null,
      null,
      (index + 1) * 500
    );
  }

  async moveAsset(item, destination) {
    const params = {
      src: item.uid,
      des: destination.uid,
      move: this.move,
    }
    const body = {
      context: {},
      params
    };
    return await this.apiService.post(apiRoutes.MOVE_FOLDER, body).toPromise();
  }

  getSectorFromPath(item) {
    const split = item.path.split("/");
    return split[1];
  }

  checkEnableCheckbox(item) {
    if (item.type === 'Domain') return false;
    // if (this.getSectorFromPath(item) !== this.currentSector && !item.properties['dc:isPrivate']) return false;
    return true;
  }

}
