import { Component, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-add-user-private-folder-modal',
  templateUrl: './add-user-private-folder-modal.component.html',
  styleUrls: ['./add-user-private-folder-modal.component.css']
})
export class AddUserPrivateFolderModalComponent implements OnInit {

  doneLoading:boolean = false;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<AddUserPrivateFolderModalComponent>,
    public matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }

  closeModal() {
    this.dialogRef.close();
    this.doneLoading = false;
  }

}
