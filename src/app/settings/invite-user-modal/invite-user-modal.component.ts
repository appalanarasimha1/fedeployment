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
  isExisted = false;
  accessEntry = false;
  groupList=[]
  
  constructor(
    public dialogRef: MatDialogRef<InviteUserModalComponent>,
    private nuxeo: NuxeoService,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   }

  ngOnInit(): void {
    this.selectedMonth = new Date(this.selectedMonth.setFullYear(this.selectedMonth.getFullYear() + 1));
    this.userEmail = this.data.userEmail;
    this.supplier = this.data.supplier;
    this.upload = !!this.supplier;
    this.isExisted = this.data.isExisted;
    this.accessEntry = this.data.accessEntry;
    this.groupList = this.data.groups
    if (this.accessEntry) this.download = true;
  }

  updateDocument(id, params) {
    return this.apiService.post(`/settings/supplier/${id}`, params, {responseType: 'text'}).toPromise();
  }

  updateSuppilerUsers(id, users) {
    const params = {
      supplierUsers: users,
    }
    this.updateDocument(id, params);
  }

  async inviteUser() {
    this.loading = true;
    const inviteUserParams = {
      folderName: "",
      groundXUrl: location.protocol + '//' + location.host
    }
    try {
      this.nuxeo.nuxeoClient.operation('Scry.InviteUser')
      .params(inviteUserParams)
      .input({
        "entity-type": "user",
        "id": "",
        "properties": {
          "username": this.userEmail,
          "email": this.userEmail,
          "groups": this.supplier ? [DRONE_UPLOADER] : this.groupList,
        }
      })
      .execute();
    } catch(e) {}

    const permissions = [];
    if (this.upload) permissions.push("upload");
    if (this.download) permissions.push("download");
    if (this.delete) permissions.push("delete");
    const newUserProp = {
      user: this.userEmail,
      permissions,
      activated: true,
      expiry: this.selectedMonth,
    }
    if (this.supplier) {
      const users = this.supplier.users || [];
      users.push(newUserProp);
      this.nuxeo.nuxeoClient.operation('Scry.AddToDroneCapture')
        .params({
          "user": this.userEmail,
        })
        .execute();
      this.updateSuppilerUsers(this.supplier.uid, users);
    }

    this.closeModal(newUserProp);
  }

  closeModal(result?) {
    this.dialogRef.close(result);
  }

}
