import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from "../../services/api.service";

@Component({
  selector: 'app-create-location-modal',
  templateUrl: './create-location-modal.component.html',
  styleUrls: ['./create-location-modal.component.css']
})
export class CreateLocationModalComponent implements OnInit {

  loading = false;
  regionName = "";
  regionInitial = "";

  constructor(
    public dialogRef: MatDialogRef<CreateLocationModalComponent>,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.regionName = this.data.regionName;
  }

  async createRegion() {
    this.loading = true;
    const payload = {
      code: this.regionInitial,
      title: this.regionName,
    }
    await this.apiService.post('/settings/area', payload, {responseType: 'text'}).toPromise();
    this.closeModal(true);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
