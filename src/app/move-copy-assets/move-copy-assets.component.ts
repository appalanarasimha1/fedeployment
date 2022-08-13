import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EXTERNAL_GROUP_GLOBAL, EXTERNAL_USER } from "../common/constant";
import { ApiService } from "../services/api.service";
import { apiRoutes } from "../common/config";
import { ActivatedRoute, Router } from "@angular/router";
import {SharedService} from "../services/shared.service";
import { DataService } from "../services/data.service";
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-move-copy-assets',
  templateUrl: './move-copy-assets.component.html',
  styleUrls: ['./move-copy-assets.component.css']
})
export class MoveCopyAssetsComponent implements OnInit {

  folderUpdated: any;

  movedContentShow: boolean = false;
  selectedList: any;
  selectedDestination: any;
  folderList: any;

  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<MoveCopyAssetsComponent>,
    private router: Router,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.selectedList = this.data.selectedList;
    const parentId = this.data.parentId;
    this.fetchAssets(parentId);
  }

  closeModal() {
    this.dialogRef.close(this.folderUpdated);
  }
  selectFolder($event){
    console.log('event', $event.target?.checked);
    if($event.target?.checked) {
      this.movedContentShow = true;
    } else {
      this.movedContentShow = false;
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
    this.folderList = result.entries;
  }

  generateBreadCrumb() {

  }

}
