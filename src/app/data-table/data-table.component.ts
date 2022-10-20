import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { ApiService } from '../services/api.service';
import { apiRoutes } from '../common/config';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit {

  
  @ViewChild(MatMenuTrigger) contextMenu: MatMenuTrigger;

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

  constructor(
    private sharedService: SharedService,
    private apiService: ApiService
    ) { }

  ngOnInit(): void {
  }

  rightClickMove(){
    if (this.count >0) return this.openMoveModal();
     this.openMoveModal();
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

  checkCanDelete(item) {
    return this.user === item.properties["dc:creator"]?.id || this.user === item.properties["dc:creator"];
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
    this.selectedMoveList={}
    // this.isAware=false
    // $(".vh").prop("checked", false);
    this.sortedData.forEach((e) => (e.isSelected = false));
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
      parentId: this.sectorSelected.uid,
      sectorList: this.folderStructure[0]?.children || [],
      user:this.user
    }

    const modalDialog = this.matDialog.open(MoveCopyAssetsComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        delete this.folderAssetsResult[result.uid];
        delete this.folderAssetsResult[this.selectedFolder.uid];

        this.loading = true;
        setTimeout(() => {
          if (this.selectedFolder.type === 'Domain') window.location.reload();
          else this.handleClickNew(this.selectedFolder.uid);
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

  deleteModalFailed() {
    this.sharedService.showSnackbar(
      "You can't delete a folder contains assets uploaded by other users",
      6000,
      "top",
      "center",
      "snackBarMiddle",
    );
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
    // this.hasUpdatedChildren.push(this.selectedFolder.uid);
    this.selectedFolderList = {};
    recoveredFolders.forEach(
      (item) =>
        this.folderAssetsResult[item.parentRef] &&
        this.folderAssetsResult[item.parentRef].entries.push(item)
    );
  }

}
