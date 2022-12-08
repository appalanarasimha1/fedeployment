import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NuxeoService } from "src/app/services/nuxeo.service";
import { adminPanelWorkspacePath } from "src/app/common/constant";

@Component({
  selector: 'app-create-sub-area-modal',
  templateUrl: './create-sub-area-modal.component.html',
  styleUrls: ['./create-sub-area-modal.component.css']
})
export class CreateSubAreaModalComponent implements OnInit {

  loading = false;
  subAreaName = "";
  locationId = "";

  constructor(
    public dialogRef: MatDialogRef<CreateSubAreaModalComponent>,
    private nuxeo: NuxeoService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.subAreaName = this.data.subAreaInput;
  }

  async createSubArea() {
    this.loading = true;
    const createdSubArea = await this.nuxeo.nuxeoClient.operation('Document.Create')
    .params({
      type: "SubArea",
      name: this.subAreaName,
      properties: {
        "subArea:locationId": this.locationId,
        "dc:title": this.subAreaName
      }
    })
    .input(adminPanelWorkspacePath + '/LocationFolder')
    .execute();
    this.closeModal(createdSubArea);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
