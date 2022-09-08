import { Component, OnInit } from '@angular/core';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from "@angular/material/dialog";

@Component({
  selector: 'app-edit-access',
  templateUrl: './edit-access.component.html',
  styleUrls: ['./edit-access.component.css']
})
export class EditAccessComponent implements OnInit {
  selectedMonth;
  closeResult: string;
  selectedExternalUser: any;
  isGlobal = false;
  folderUpdated: any;

  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    public dialogRef: MatDialogRef<EditAccessComponent>,
  ) { }

  ngOnInit(): void {
  }
  
  onFullAccessCheckboxChange(e, checkedGlobal = true) {
    this.selectedExternalUser.isGlobal = e.target.checked && checkedGlobal;
    this.isGlobal = e.target.checked && checkedGlobal;
  }
  
  closeModal() {
    this.dialogRef.close(this.folderUpdated);
  }

}
