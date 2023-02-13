import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../../services/api.service";

@Component({
  selector: 'app-create-sub-area-modal',
  templateUrl: './create-sub-area-modal.component.html',
  styleUrls: ['./create-sub-area-modal.component.css']
})
export class CreateSubAreaModalComponent implements OnInit {

  loading = false;
  subAreaName = "";
  locationId = "";
  parentArea = "";

  constructor(
    public dialogRef: MatDialogRef<CreateSubAreaModalComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.subAreaName = this.data.subAreaInput;
    this.parentArea = this.data.parentArea;
  }

  async createSubArea() {
    this.loading = true;
    const payload = {
      locationId: this.locationId,
      name: this.subAreaName,
      parentArea: this.parentArea,
    }
    await this.apiService.post('/settings/subarea', payload, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
