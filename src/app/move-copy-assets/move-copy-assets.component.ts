import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { concat, Observable, of, Subject } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  map,
  filter,
} from "rxjs/operators";
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

  uploadedAsset;
  selectedFolder: any;
  makePrivate: boolean = false;
  userList$: Observable<any>;
  userInput$ = new Subject<string>();
  userLoading = false;
  folderCollaborators = {};
  internalCollaborators = {};
  externalCollaborators = {};
  selectedCollaborator: any;
  addedCollaborators: {};
  removedCollaborators: {};
  updatedCollaborators: {};
  invitedCollaborators: {};
  selectedExternalUser: any;
  folderId: string;
  folderUpdated: any;
  closeResult: string;
  userInputText = "";
  selectedMonth;
  month = [
    {id: 1, name: '1 month'},
    {id: 2, name: '2 month'},
    {id: 3, name: '3 month'},
    {id: 4, name: '4 month'},
    {id: 5, name: '5 month'}
  ];

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
  }

  closeModal() {
    this.dialogRef.close(this.folderUpdated);
  }

}
