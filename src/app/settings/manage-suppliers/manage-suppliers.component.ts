import { Component, OnInit, ElementRef, ViewChild, Renderer2, VERSION, Input } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
// import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { NuxeoService } from "src/app/services/nuxeo.service";
import { SharedService } from "src/app/services/shared.service";
import { adminPanelWorkspacePath } from "src/app/common/constant";
import { ApiService } from "../../services/api.service";
import { CreateSupplieModalComponent } from '../create-supplie-modal/create-supplie-modal.component';
import { InviteUserModalComponent} from '../invite-user-modal/invite-user-modal.component';
import { apiRoutes } from 'src/app/common/config';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-manage-suppliers',
  templateUrl: './manage-suppliers.component.html',
  styleUrls: ['./manage-suppliers.component.css']
})
export class ManageSuppliersComponent implements OnInit {

  @Input() name: string;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  suppliersCtrl = new FormControl();
  usersCtrl = new FormControl();
  filteredFruits: Observable<string[]>[] = [];
  fruits: any = [];
  suppliersRegion: any = [
    {
      id: 1,
      name: 'OX'
    },
    {
      id: 2,
      name: 'TR'
    },
    {
      id: 3,
      name: 'LN'
    }
  ];
  renameEmail : boolean = false;
  supplierInput: string = '';
  inviteUserInput: string = '';
  showExternalUserPage: boolean = false;
  adminPanelWorkspace = null;
  supplierList = [];
  users = [];
  regionMap = {};
  selectedSupplier = null;
  filteredUsers: Observable<string[]>;
  filteredSuppliers = [];
  currentSuppliers = [];

  @ViewChild('suppliersInput') suppliersInput: ElementRef;
  @ViewChild("myInput", { static: false }) myInput: ElementRef;

  // name = "Angular " + VERSION.major;
  hiddenSpan = this.renderer.createElement("span");

  renameUserName: boolean = false;

  showUserSettingPage = true;
  showUserAccessPage = false;
  currentEditingUser = null;
  currentUserFolderList = [];
  managedUsers;
  showUserManageSuppliers = false;
  showUserManageLocations = false;
  loading = false;
  managedUsersMap = {};
  managedUsersBackUp=[];
  modalOpen: boolean = true;

  constructor(
    public matDialog: MatDialog,
    private renderer: Renderer2,
    private nuxeo: NuxeoService,
    private apiService: ApiService,
    public sharedService: SharedService,
    private modalService: NgbModal,
  ) {
  }

  ngOnInit(): void {
    this.fetchManagedExternalUsers();
    this.filteredUsers = this.usersCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._userFilter(value || '')),
    );
    //init admin panel folder structure if not exist
    this.getAllUsers();
    this.getSupplierList();
    this.getRegionList();
  }


  async fetchManagedExternalUsers() {
    this.backToUserList();
    const body = {
      context: {},
      params: {},
    };
    this.loading = true;
    const res = await this.apiService.post(apiRoutes.GET_MANAGED_EXT_USERS, body).toPromise();
    this.managedUsersMap = res['value'] || {};
    this.loading = false;
    this.showUserSettingPage = true;
    this.showUserManageSuppliers = false;
    this.showUserManageLocations = false;
    if (this.managedUsersMap) {
      this.managedUsers = Object.keys(this.managedUsersMap);
      this.managedUsersBackUp = Object.keys(this.managedUsersMap);
    }
  }


  backToUserList() {
    this.showUserSettingPage = true;
    this.showUserAccessPage = false;
    this.currentEditingUser = null;
    this.currentUserFolderList = [];
    this.managedUsers = this.managedUsersBackUp;
    this.showUserManageSuppliers = false;
    this.showUserManageLocations = false;
    this.showUserAccessPage = false;
  }

  private _userFilter(value: string): string[] {
    const filterValue = this._userNormalizeValue(value);
    return this.users.filter(street => this._userNormalizeValue(street).includes(filterValue));
  }

  private _userNormalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  checkEnableInviteBtn() {
    return this.inviteUserInput && !this.selectedSupplier?.users?.find(user => user.user === this.inviteUserInput);
  }

  updateSuppilerUsers(id, users) {
    const params = {
      "supplierUsers": users,
    }
    this.updateDocument(id, params);
  }

  hasPermission(user, permission) {
    return user.permissions.includes(permission);
  }

  onPermissionChange(permission, $event, index) {
    const enabled = $event.target?.checked || $event.checked;
    const users = this.selectedSupplier.users;
    const user = users[index];
    const permissions = user.permissions || [];
    const permissionIndex = permissions.indexOf(permission);
    if (enabled && permissionIndex < 0) {
      permissions.push(permission);
    } else if (!enabled && permissionIndex > -1) {
      permissions.splice(permissionIndex, 1);
    }
    users[index].permissions = permissions;
    this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  async togglerUserActivated(event, index) {
    const users = this.selectedSupplier.users;
    if(!event.checked) {
      const confirmed = await this.sharedService.openConfirmationModal('Are you sure you want to disable this user?', 'Disable');
      if(!confirmed) {
        users[index].activated = true;
        return
      }
    }
    users[index].activated = event.checked;
    this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  updateUserExpiry(event, index) {
    const users = this.selectedSupplier.users;
    users[index].expiry = event.value;
    this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  async selectUser(user) {
    // const permissions = ["upload"];
    // const now = new Date();
    // const newUserProp = {
    //   user,
    //   permissions,
    //   activated: true,
    //   expiry: new Date(now.setMonth(now.getMonth() + 6)),
    // }
    // const users = this.selectedSupplier.users || [];
    // users.push(newUserProp);
    // await this.updateSuppilerUsers(this.selectedSupplier.uid, users);
    // this.nuxeo.nuxeoClient.operation('Scry.AddToDroneCapture')
    // .params({
    //   "user": user,
    // })
    // .execute();
    // this.getSupplierList();
  }

  async getAllUsers() {
    const url = '/user/search?q=*&pageSize=1000';
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (res) this.users = res['entries'].map(user => user.id);
  }

  async getSupplierList() {
    const url = '/settings/supplier';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    if (!res) return;
    this.supplierList = res.map(supplier => ({
      name: supplier.name,
      uid: supplier.id,
      regions: supplier.regions,
      users: supplier.supplierUsers,
      activated: supplier.activated,
      supportEmail: supplier.supportEmail,
      expiry: supplier.expiry,
      supplierId: supplier.supplierId || "",
      renameEmail : false,
    }));
    this.filteredSuppliers = this.supplierList;
    this.currentSuppliers = this.supplierList.map(supplier => supplier.name);
    this.supplierInput = "";
    for (let i = 0; i < this.supplierList.length; i++) {
      this.filteredFruits[i] = this.suppliersCtrl.valueChanges.pipe(
        startWith(null),
        map((fruit: string | null) => {
          const selectedInitials = this.supplierList[i].regions.map(region => this.regionMap[region]?.initial) || [];
          return fruit ? this._filter(fruit, i) : this.suppliersRegion.filter(region => !selectedInitials.includes(region.initial))
        }));
    }
    if (this.selectedSupplier) {
      this.selectedSupplier = this.supplierList.find(sup => sup.uid === this.selectedSupplier.uid);
    }
  }

  async getRegionList() {
    const url = '/settings/area';
    const res = await this.apiService
      .get(url, {}).toPromise() as any;

    const regions = res || [];
    this.suppliersRegion = regions.map((region) => ({
      initial: region.code,
      name: region.title,
      uid: region.id,
    }));
    this.computeRegionMap();
  }

  computeRegionMap() {
    this.regionMap = {};
    this.suppliersRegion?.forEach(region => {
      this.regionMap[region.uid] = region;
    });
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add our fruit
    if ((value || '').trim()) {
      this.fruits.push({
        id:Math.random(),
        name:value.trim()
      });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.suppliersCtrl.setValue(null);
  }

  async remove(fruit, indx, index) {
    const confirmed = await this.sharedService.openConfirmationModal('Are you sure you want to remove this Region?');
    if(!confirmed) {
      return
    }
    const regions = this.supplierList[index].regions;
    const removedIndex = regions.indexOf(fruit);
    if (removedIndex < 0) return;
    regions.splice(removedIndex, 1);
    this.supplierList[index].regions = regions;
    this.updateDocument(this.supplierList[index].uid, {"regions": regions})
  }

  selected(event: MatAutocompleteSelectedEvent, index): void {
    this.fruits.push(event.option.value);
    this.suppliersInput.nativeElement.value = '';
    this.suppliersCtrl.setValue(null);
    const regions = this.supplierList[index].regions;
    this.fruits.map(fruit => {
      if (!regions.find(region => region === fruit.uid)) {
        regions.push(fruit.uid);
      }
    });
    this.supplierList[index].regions = regions;
    this.updateDocument(this.supplierList[index].uid, {"regions": regions})
  }

  private _filter(value: any, index): any[] {
    if (typeof value === 'object') return;
    const selectedInitials = this.supplierList[index].regions.map(region => this.regionMap[region].initial) || [];
    return this.suppliersRegion.filter(fruit => (fruit?.name?.toLowerCase().includes(value?.toLowerCase())
      || fruit.initial?.toLowerCase().includes(value?.toLowerCase()))
      && !selectedInitials.includes(fruit.initial));
  }

  renameEmailClick(saved=false, email?, index?){
    // this.renameEmail = !this.renameEmail;
    if (!saved) return;
    this.updateDocument(this.supplierList[index].uid, {"supportEmail": email})
  }

  updateDocument(id, params) {
    return this.apiService.post(`/settings/supplier/${id}`, params, {responseType: 'text'}).toPromise();
  }

  async updateSupplierExpiry(event, supplier) {
    await this.updateDocument(supplier.uid, {"expiry": event.value});
    this.getSupplierList();
  }

  async toggleActivated(event, supplier, allNotifactionContent) {
    if(!event.checked) {
      const confirmed = await this.sharedService.openConfirmationModal('Are you sure you want to disable this Supplier?', 'Disable');
      if(!confirmed) {
        supplier.activated = true
        return
      }
    }

    await this.updateDocument(supplier.uid, {"activated": event.checked});
    if(event.checked) {
      this.modalOpen = true;
      this.modalService.open(allNotifactionContent, { windowClass: 'custom-modal-notifaction', backdropClass: 'remove-backdrop', keyboard: false, backdrop: 'static' }).result.then((result) => {
      }, (reason) => {
        this.closeModal();
      });
    } else {
      this.sharedService.showSnackbar(
        `Supplier's access has been ${event.checked ? "enabled" : "disabled"}`,
        5000,
        "top",
        "center",
        "snackBarMiddle",
      );
    }
    this.getSupplierList();
  }

  async openCreateSupplierModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      suppliersRegion: this.suppliersRegion,
      supplierInput: this.supplierInput,
      currentSuppliers: this.currentSuppliers,
    }

    const modalDialog = this.matDialog.open(CreateSupplieModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      this.matDialog.closeAll()
      if (result) {
        this.getSupplierList();
      }
    });
  }

  async openInviteUserModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    dialogConfig.data = {
      userEmail: this.inviteUserInput,
      supplier: this.selectedSupplier,
      isExisted: this.users?.includes(this.inviteUserInput),
    }

    const modalDialog = this.matDialog.open(InviteUserModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.getSupplierList();
      }
    });
  }

  // calculateEndDate(end) {
  //   return new FormControl(new Date(parseInt(end)));
  // }
  async onEndDateChange(value, folder, index) {
    if (!value) return;
    folder.end = value.getTime();
  }

  showExternalUserList(supplier) {
    this.showExternalUserPage = !this.showExternalUserPage;
    this.selectedSupplier = supplier;
  }
  backExternalUserList() {
    this.showExternalUserPage = false;
  }

  onInput(event) {
    const input = event.target;
    input.parentNode.dataset.value = input.value;
  }

  renameUserClick() {
    this.renameUserName = !this.renameUserName;
  }

  searchSupplier(event) {
    if (!this.supplierInput) {
      this.filteredSuppliers = this.supplierList;
      return;
    }
    this.filteredSuppliers = this.supplierList.filter(supplier => {
      return supplier.name.toLowerCase().includes(this.supplierInput.toLowerCase());
    });
  }

  allNotifactionOpen(allNotifactionContent) {
    this.modalOpen = true;
    this.modalService.open(allNotifactionContent, { windowClass: 'custom-modal-notifaction', backdropClass: 'remove-backdrop', keyboard: false, backdrop: 'static' }).result.then((result) => {
    }, (reason) => {
      this.closeModal();
    });
  }
  closeModal() {
    this.modalOpen = true;
  }

}
