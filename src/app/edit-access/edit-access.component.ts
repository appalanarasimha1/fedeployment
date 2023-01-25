import { Component, OnInit, Inject } from '@angular/core';
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
  isAdmin = false;

  constructor(
    private modalService: NgbModal,
    public matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EditAccessComponent>,
  ) { }

  ngOnInit(): void {
    this.selectedMonth = this.data.selectedMonth
    this.isGlobal = this.data.isGlobal;
    this.selectedExternalUser = this.data.selectedExternalUser;
    this.isAdmin = this.data.isAdmin;
  }

  onFullAccessCheckboxChange(e, checkedGlobal = true) {
    this.selectedExternalUser.isGlobal = e.target.checked && checkedGlobal;
    this.isGlobal = e.target.checked && checkedGlobal;
  }
  cancel() {
    this.dialogRef.close();
  }

  closeModal() {
    this.dialogRef.close({selectedMonth: this.selectedMonth, isGlobal: this.isGlobal, isAdmin: this.isAdmin});
  }

  getEndDate(end) {
    if (!end) return "";
    const date = new Date(end);
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    return dd + '.' + mm + '.' + yyyy;
  }

}
