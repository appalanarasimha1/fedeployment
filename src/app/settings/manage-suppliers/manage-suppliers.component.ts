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
import { adminPanelWorkspacePath } from "src/app/common/constant";
import { ApiService } from "../../services/api.service";
import { CreateSupplieModalComponent } from '../create-supplie-modal/create-supplie-modal.component';
import { InviteUserModalComponent} from '../invite-user-modal/invite-user-modal.component';

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
  filteredFruits: Observable<string[]>;
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
  regionList = [];
  regionMap = {};
  selectedSupplier = null;
  filteredUsers: Observable<string[]>;

  @ViewChild('suppliersInput') suppliersInput: ElementRef;
  @ViewChild("myInput", { static: false }) myInput: ElementRef;

  // name = "Angular " + VERSION.major;
  hiddenSpan = this.renderer.createElement("span");

  renameUserName: boolean = false;

  constructor(
    public matDialog: MatDialog,
    private renderer: Renderer2,
    private nuxeo: NuxeoService,
    private apiService: ApiService,
  ) {
  }

  ngOnInit(): void {
    this.filteredUsers = this.usersCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._userFilter(value || '')),
    );
    //init admin panel folder structure if not exist
    this.getOrCreateAdminPanelWorkspace();
    this.getAllUsers();
    this.getSupplierList();
    this.getRegionList();
  }

  private _userFilter(value: string): string[] {
    const filterValue = this._userNormalizeValue(value);
    return this.users.filter(street => this._userNormalizeValue(street).includes(filterValue));
  }

  private _userNormalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  checkEnableInviteBtn() {
    return this.inviteUserInput && !this.users?.includes(this.inviteUserInput);
  }

  updateSuppilerUsers(id, users) {
    return this.apiService.put(`/id/${id}`, {
      "entity-type": "document",
      uid: id,
      properties: {
        "supplier:supplierUsers": users,
      }
    }).toPromise();
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

  togglerUserActivated(event, index) {
    const users = this.selectedSupplier.users;
    users[index].activated = event.checked;
    this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  updateUserExpiry(event, index) {
    const users = this.selectedSupplier.users;
    users[index].expiry = event.value;
    this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  async selectUser(user) {
    const permissions = [];
    const newUserProp = {
      user,
      permissions,
      activated: true,
      expiry: new Date(),
    }
    const users = this.selectedSupplier.users || [];
    users.push(newUserProp);
    await this.updateSuppilerUsers(this.selectedSupplier.uid, users);
  }

  async getOrCreateAdminPanelWorkspace() {
    if (!this.nuxeo || !this.nuxeo.nuxeoClient) return;
    try {
      const folder = await this.nuxeo.nuxeoClient.repository().fetch(adminPanelWorkspacePath);
      if (!folder) return this.createAdminPanelFolderStructure();
    } catch (err) {
      this.createAdminPanelFolderStructure();
    }
  }

  createFolder(type, name, path) {
    return this.nuxeo.nuxeoClient.operation('Document.Create')
    .params({
      type,
      name,
    })
    .input(path)
    .execute();
  }

  async createAdminPanelFolderStructure() {
    // create AdminPanelWorkspace
    this.adminPanelWorkspace = await this.createFolder("MiscFolder", "AdminPanelWorkspace", "/default-domain/workspaces");
    await this.createFolder("Folder", "SupplierFolder", adminPanelWorkspacePath);
    await this.createFolder("Folder", "RegionFolder", adminPanelWorkspacePath);
    await this.createFolder("Folder", "LocationFolder", adminPanelWorkspacePath);
  }

  async getAllUsers() {
    const url = '/user/search?q=*&pageSize=1000';
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (res) this.users = res['entries'].map(user => user.id);
  }

  async getSupplierList() {
    const url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Supplier' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (!res) return;
    this.supplierList = res["entries"].map(supplier => ({
      name: supplier.title,
      uid: supplier.uid,
      regions: supplier.properties["supplier:regions"],
      users: supplier.properties["supplier:supplierUsers"],
      activated: supplier.properties["supplier:activated"],
      supportEmail: supplier.properties["supplier:supportEmail"],
    }));
  }

  async getRegionList() {
    const url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=1000&queryParams=SELECT * FROM Document WHERE ecm:primaryType = 'Region' AND ecm:isVersion = 0 AND ecm:isTrashed = 0`;
    const res = await this.apiService
      .get(url, { headers: { "fetch-document": "properties" } }).toPromise();

    if (res) this.regionList = res["entries"] || [];
    this.suppliersRegion = this.regionList.map(region => ({
      id: region.properties["region:initial"],
      name: region.title,
      uid: region.uid,
    }));
    this.computeRegionMap();


    this.filteredFruits = this.suppliersCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => fruit ? this._filter(fruit) : this.suppliersRegion.slice()));
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

  remove(fruit, indx, index): void {
    const regions = this.supplierList[index].regions;
    const removedIndex = regions.indexOf(fruit);
    if (removedIndex < 0) return;
    regions.splice(removedIndex, 1);
    this.supplierList[index].regions = regions;
    this.updateDocument(this.supplierList[index].uid, {properties: {"supplier:regions": regions}})
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
    this.updateDocument(this.supplierList[index].uid, {properties: {"supplier:regions": regions}})
  }

  private _filter(value: any): any[] {
    return this.suppliersRegion.filter(fruit => fruit?.name.toLowerCase().includes(value?.name.toLowerCase()));
  }

  renameEmailClick(saved=false, email?, index?){
    this.renameEmail = !this.renameEmail;
    if (!saved) return;
    this.updateDocument(this.supplierList[index].uid, {properties: {"supplier:supportEmail": email}})
  }

  updateDocument(id, params) {
    return this.nuxeo.nuxeoClient.operation('Document.Update')
    .params(params)
    .input(id)
    .execute();
  }

  toggleActivated(event, supplier) {
    this.updateDocument(supplier.uid, {properties: {"supplier:activated": event.checked}})
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
    }

    const modalDialog = this.matDialog.open(CreateSupplieModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
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

}
