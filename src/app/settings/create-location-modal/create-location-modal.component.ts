import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NuxeoService } from "src/app/services/nuxeo.service";
import { adminPanelWorkspacePath } from "src/app/common/constant";

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
    private nuxeo: NuxeoService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.regionName = this.data.regionName;
  }

  async createRegion() {
    this.loading = true;
    const createdRegion = await this.nuxeo.nuxeoClient.operation('Document.Create')
    .params({
      type: "Region",
      name: this.regionName,
      properties: {
        "region:initial": this.regionInitial,
        "dc:title": this.regionName
      }
    })
    .input(adminPanelWorkspacePath + '/RegionFolder')
    .execute();
    this.closeModal(createdRegion);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
