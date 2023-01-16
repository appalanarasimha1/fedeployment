import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NuxeoService } from "src/app/services/nuxeo.service";
import { ApiService } from "../../services/api.service";
import { DRONE_UPLOADER } from "src/app/common/constant";

@Component({
  selector: 'app-invite-user-modal',
  templateUrl: './invite-user-modal.component.html',
  styleUrls: ['./invite-user-modal.component.css']
})
export class InviteUserModalComponent implements OnInit {

  loading = false;
  userEmail = "";
  upload = false;
  download = false;
  delete = false;
  selectedMonth = new Date();
  supplier = null;

  constructor(
    public dialogRef: MatDialogRef<InviteUserModalComponent>,
    private nuxeo: NuxeoService,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.userEmail = this.data.userEmail;
    this.supplier = this.data.supplier;
  }

  updateDocument(id, params) {
    return this.nuxeo.nuxeoClient.operation('Document.Update')
    .params(params)
    .input(id)
    .execute();
  }

  updateSuppilerUsers(id, users) {
    const params = {
      properties: {
        "supplier:supplierUsers": JSON.stringify(users),
      }
    }
    this.updateDocument(id, params);
  }

  async inviteUser() {
    this.loading = true;
    const inviteUserParams = {
      folderName: "",
      groundXUrl: location.protocol + '//' + location.host
    }
    await this.nuxeo.nuxeoClient.operation('Scry.InviteUser')
    .params(inviteUserParams)
    .input({
      "entity-type": "user",
      "id": "",
      "properties": {
        "username": this.userEmail,
        "email": this.userEmail,
        "groups": [DRONE_UPLOADER]
      }
    })
    .execute();

    const permissions = [];
    if (this.upload) permissions.push("upload");
    if (this.download) permissions.push("download");
    if (this.delete) permissions.push("delete");
    const newUserProp = {
      user: this.userEmail,
      permissions,
      activated: true,
      expiry: this.selectedMonth || new Date(),
    }
    const users = this.supplier.users || [];
    users.push(newUserProp);
    const res = await this.updateSuppilerUsers(this.supplier.uid, users);
    this.nuxeo.nuxeoClient.operation('Scry.AddToDroneCapture')
    .params({
      "user": this.userEmail,
    })
    .execute();

    this.closeModal(res);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
