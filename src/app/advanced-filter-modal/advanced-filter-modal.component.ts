import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: 'app-advanced-filter-modal',
  templateUrl: './advanced-filter-modal.component.html',
  styleUrls: ['./advanced-filter-modal.component.css']
})
export class AdvancedFilterModalComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AdvancedFilterModalComponent>,
    @Inject(MAT_DIALOG_DATA) public filters: {docs: any, folder: any},
  ) { }

  ngOnInit(): void {
  }

  closeModal() {
    this.dialogRef.close();
  }

}
