import {
  Component,
  OnInit,
  Input,
} from "@angular/core";
import { FormControl } from '@angular/forms';
import { apiRoutes } from "src/app/common/config";
import { ApiService } from "../../services/api.service";
import { SharedService } from "../../services/shared.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InviteUserModalComponent} from '../invite-user-modal/invite-user-modal.component';

@Component({
  selector: "app-manage-access-list",
  templateUrl: "./manage-access-list.component.html",
  styleUrls: ["./manage-access-list.component.css"],
})
export class ManageAccessListComponent implements OnInit {
  @Input() name: string;

  usersCtrl = new FormControl();
  showExternalUserPage: boolean = false;
  accessList = [];
  filteredAccessList = [];
  regionDict = {};
  accessInput = "";
  selectedAccess = null;


  showUserManageLocations = true;
  showUserSettingPage = false;
  showUserAccessPage = false;
  showUserManageSuppliers = false;
  loading = false;
  inviteUserInput: string = '';
  users = [];
  filteredUsers: Observable<string[]>;

  constructor(
    public matDialog: MatDialog,
    private apiService: ApiService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.filteredUsers = this.usersCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._userFilter(value || '')),
    );
    // this.getRegionList();
    this.getAccessList();
    this.getAllUsers();
  }

  private _userFilter(value: string): string[] {
    const filterValue = this._userNormalizeValue(value);
    
    const filteredUsers = this._filterUsers();

    return filteredUsers.filter(street => this._userNormalizeValue(street).includes(filterValue));
  }

  private _userNormalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _filterUsers(): string[] {
    // Filter out entries if first letter is uppercase
    const nonAdminUsers = this.users.filter(user => user[0] !== user[0].toUpperCase());
    // Filter out duplicates
    const uniqueUsers = nonAdminUsers.filter((user, index) => nonAdminUsers.indexOf(user) === index);
    // Filter out non-neom users  
    const neomUsers = uniqueUsers.filter(user => user.includes('neom'));
    
    return neomUsers;
  }

  

  async getAccessList() {
    await this.getRegionList();
    const url = '/settings/accessList';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const list = res || [];
    const sortedAll = [
      ...list.filter(a => a.name === 'ALL'),
      ...list.filter(a => a.name !== 'ALL')
    ]
    this.accessList = sortedAll
    .map((entry) => ({
      name: {initial: entry.name, full: this.getFullForm(entry.name)},
      uid: entry.id,
      activated: entry.activated,
      users: entry.users || [],
    }));
    // console.log(this.accessList);
    this.searchAccess();
  }

  async getRegionList() {
    const url = '/settings/area';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const regions = res || [];

    for (let region of regions) {
      this.regionDict[region.code] = region.title;
    }

    // console.log(this.regionDict);
  }
  
  getFullForm(initial: string) {
    if (this.regionDict[initial]) {
      return this.regionDict[initial];
    }
    else {
      return initial
    }
    
  }

  async getAllUsers() {
    const url = '/user/search?q=*&pageSize=1000';
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (res) this.users = res['entries'].map(user => user.id);
  }

  updateDocument(id, params) {
    return this.apiService.post(`/settings/accessList/${id}`, params, {responseType: 'text'}).toPromise();
  }

  openAccess(access) {
    this.showExternalUserPage = !this.showExternalUserPage;
    this.selectedAccess = access;
  }

  backExternalUserList() {
    this.showExternalUserPage = false;
    this.selectedAccess = null;
  }

  searchAccess() {
    if (!this.accessInput) {
      this.filteredAccessList = this.accessList;
      return;
    };
    this.filteredAccessList = this.accessList.filter(region =>
      region.name.full?.toLowerCase().includes(this.accessInput.toLowerCase()) ||
      region.name.initial?.toLowerCase().includes(this.accessInput.toLowerCase()));
  }

  async selectUser(user) {
    const users = this.selectedAccess.users;
    const end = new Date();
    end.setFullYear(new Date().getFullYear() + 1);
    const newUserProp = {
      user,
      permissions: ['download'],
      activated: true,
      expiry: end,
    }
    users.push(newUserProp);
    this.updateAccessUsers(this.selectedAccess.uid, users);
  }

  checkEnableInviteBtn() {
    if (this.users?.includes(this.inviteUserInput)) return false;
    return this.inviteUserInput && !this.selectedAccess?.users?.find(user => user.user === this.inviteUserInput);
  }

  async toggleAccessActivated(event, access) {
    this.updateDocument(access.uid, {"activated": event.checked});
    if(!event.checked) {
      this.sharedService.showSnackbar(
        "This access list will be disabled and its users unable to access its assets.",
        3000,
        "top",
        "center",
        "snackBarMiddle"
      );
    }
    this.updateRegionPermission(access.users, !event.checked, access.name);
  }

  async openInviteUserModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      userEmail: this.inviteUserInput,
      accessEntry: this.selectedAccess,
      isExisted: this.users?.includes(this.inviteUserInput),
    }

    const modalDialog = this.matDialog.open(InviteUserModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        const users = this.selectedAccess.users;
        users.push(result);
        this.updateAccessUsers(this.selectedAccess.uid, users);
        this.getAccessList();
      }
    });
  }

  hasPermission(user, permission) {
    return user.permissions.includes(permission);
  }

  onPermissionChange(permission, $event, index) {
    const enabled = $event.target?.checked || $event.checked;
    const users = this.selectedAccess.users;
    const user = users[index];
    const permissions = user.permissions || [];
    const permissionIndex = permissions.indexOf(permission);
    if (enabled && permissionIndex < 0) {
      permissions.push(permission);
    } else if (!enabled && permissionIndex > -1) {
      permissions.splice(permissionIndex, 1);
    }
    users[index].permissions = permissions;
    this.updateAccessUsers(this.selectedAccess.uid, users);
  }

  updateRegionPermission(users, disabled = false, name?) {
    const body = {
      context: {},
      params: {
        location: this.selectedAccess?.initial || name,
        users: users || [],
        disabled
      },
    };
    this.apiService
      .post(apiRoutes.UPDATE_DRONE_ACCESS, body)
      .toPromise();
  }

  updateAccessUsers(id, users) {
    const params = {
      "users": users,
    }
    this.updateDocument(id, params);
    this.updateRegionPermission(users);
  }

  togglerUserActivated(event, index) {
    const users = this.selectedAccess.users;
    users[index].activated = event.checked;
    this.updateAccessUsers(this.selectedAccess.uid, users);
  }

  updateUserExpiry(event, index) {
    const users = this.selectedAccess.users;
    users[index].expiry = event.value;
    this.updateAccessUsers(this.selectedAccess.uid, users);
  }

}
