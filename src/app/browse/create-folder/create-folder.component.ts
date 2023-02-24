import { Component, OnInit, Input, OnDestroy, Output, EventEmitter,OnChanges} from '@angular/core';
import { FOLDER_TYPE_WORKSPACE, ORDERED_FOLDER, PAGE_SIZE_1000 } from 'src/app/common/constant';
import { IEntry } from 'src/app/common/interfaces';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-create-folder',
  templateUrl: './create-folder.component.html',
  styleUrls: ['./create-folder.component.css']
})
export class CreateFolderComponent implements OnInit,OnChanges {
  @Input() currentWorkspace: IEntry;
  @Input() folderAssetsResult;
  @Input() checkPrivate;
  @Output() isPrivate: EventEmitter<any> = new EventEmitter();
  @Output() folderCreateEvent: EventEmitter<any> = new EventEmitter();

  titleExists: boolean = false;
  folderNameRef;
  showError: boolean = false;
  createFolderLoading: boolean = false;
  checkboxIsPrivate: boolean = false;
  allFolders: [];
  folderDescriptionRef;
  folderDateRef;
  showFolder: boolean = false;
  // folderAssetsResult: any = {};
  hasUpdatedChildren = [];
  publishingPrivateAssets: boolean = false;
  publishingAssets: boolean = true;
  permissionChange: boolean = false;
  panelOpenState = false;

  isAdmin: boolean = false;
  user: any = null;
  listExternalUser: any[];
  listExternalUserGlobal: any[];
  checkPrivateFolder:boolean;

  constructor(
    public sharedService: SharedService,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.datePickerDefaultAction();
    // this.getAllFolders()
    this.isPrivate.emit()
  }
  ngOnChanges(changes):void{
    console.log("changes in create",changes )
    if (changes.checkPrivate) {
      this.checkPrivateFolder = changes.checkPrivate.currentValue
    }
  }

  async createFolder(folderName: string, date?: string, description?: string) {

    if (!this.folderNameRef) {
      this.showError = true;
    } else {
      let checkTitle = this.CheckTitleAlreadyExits(folderName);
      if(checkTitle) {
        return this.titleExists = true
      }
      this.createFolderLoading = true;
      const backupPath = this.currentWorkspace.path;
      let url = `/path${this.currentWorkspace.path}`;
      if (this.currentWorkspace.type.toLowerCase() === "domain") {
        url = `/path${this.currentWorkspace.path}/workspaces`;
        this.currentWorkspace.path = `${this.currentWorkspace.path}/workspaces/null`;
        this.currentWorkspace.childType = FOLDER_TYPE_WORKSPACE;
      } else {
        this.currentWorkspace.childType = ORDERED_FOLDER;
      }

      const payload = await this.sharedService.getCreateFolderPayload(
        folderName?.trim(),
        this.currentWorkspace.title,
        this.currentWorkspace,
        description,
        date,
        this.checkboxIsPrivate
      );
      this.currentWorkspace.path = backupPath;
      const res = await this.apiService.post(url, payload, {headers: { "fetch-document": "properties"}}).toPromise();
      this.createFolderLoading = false;
      if (!res && !res["uid"]) return;

      // this.searchList.unshift(res);
      // this.sortedData = this.searchList.slice();
      // this.folderAssetsResult[this.currentWorkspace.uid].entries.unshift(res);
      this.folderCreateEvent.emit(res);
      // this.showMoreButton = false;
      this.checkboxIsPrivate = false;
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
      this.sharedService.showSnackbar(
        `${folderName} folder successfully created.`,
        3000,
        "top",
        "center",
        "snackBarMiddle"
      );
      this.showFolder = false;
      if (!this.hasUpdatedChildren.includes(this.currentWorkspace.uid)) {
        this.hasUpdatedChildren.push(this.currentWorkspace.uid);
      }

      this.folderNameRef = undefined;
      this.titleExists = false
      this.folderDescriptionRef = undefined;
      this.folderDateRef = undefined;

      return {
        id: res["uid"],
        title: res["title"],
        type: res["type"],
        path: res["path"],
      };
    }
  }
  
  CheckTitleAlreadyExits(name: string) {
    console.log('this.allFolders',this.allFolders, typeof this.allFolders)
    let titles = this.allFolders.map((m:any)=>m.title.toLowerCase().trim())
    if(titles.indexOf(name?.toLowerCase().trim()) !== -1) return true
    return false
  }
  
  async getAllFolders(folder?:any){
    let currentState = this.folderAssetsResult[folder?.uid]?.entries?.filter(r => r.title == "Workspaces")
    if(currentState?.length){
      let url = `/search/pp/nxql_search/execute?currentPage0Index=0&offset=0&pageSize=${PAGE_SIZE_1000}&queryParams=SELECT * FROM Document WHERE ecm:parentId = '${currentState[0]?.uid}' AND ecm:mixinType = 'Folderish' AND ecm:isProxy = 0 AND ecm:isVersion = 0 AND ecm:isTrashed = 0 AND ecm:path STARTSWITH '${folder.path}'`;
      const result: any = await this.apiService
          .get(url, { headers: { "fetch-document": "properties" } })
          .toPromise();
     this.allFolders = result?.entries
    }else{
      let currentState1 = this.folderAssetsResult[folder?.uid]?.entries?.filter(r => r.type == "OrderedFolder")
      this.allFolders = currentState1
    }
  }

  openNewFolderDiv() {
    this.showFolder = !this.showFolder;
  }
  
  handleChange(event, name: string) {
    if (event.checked || event.target?.checked) {
      if(name == 'published') {
        this.publishingAssets = true;
        this.publishingPrivateAssets = false;
        this.checkboxIsPrivate = false
      }
      if(name == 'private') {
        this.publishingAssets = false;
        this.publishingPrivateAssets = true;
        this.checkboxIsPrivate = true

      }
    }
  }
  
  datePickerDefaultAction() {
    $( ".createNew.flexible" ).focus(() => {
      // alert( "Handler for .focus() called." );
      setTimeout(() => {
        $('#autoFocusElement').focus();
      }, 500);
    });
    $(".buttonCreate").on("click", function (e) {
      // $(".dropdownCreate").toggle();
      $(".dropdownCreate").show();
      $(".buttonCreate").addClass("createNewFolderClick");
      setTimeout(() => {
        $('#autoFocusElement').focus();
      }, 500);
      e.stopPropagation();
    });
    $(".buttonCreate.createNewFolderClick").on("click", function (e) {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
      e.stopPropagation();
    });

    $(".dropdownCreate, .mat-datepicker-content").click(function (e) {
      e.stopPropagation();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });

    $(document).click(function () {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });

    $(".mat-icon-button").click(function () {
      $(".dropdownCreate, .mat-datepicker-content").click(function (e) {
        $(".buttonCreate").removeClass("createNewFolderClick");
        e.stopPropagation();
      });
    });

    $(".closeIcon").on("click", function (e) {
      $(".dropdownCreate").hide();
      e.stopPropagation();
    });
    this.getAllFolders(this.currentWorkspace)
  }

  inputChange() {
    if (!this.folderNameRef) {
      this.showError = true;
    } else {
      this.showError = false;
      this.titleExists = false
    }
  }


  
  // ================================================================================================= //
  isPrivateFolder(isButton = true, includeChild = false) {
    if (!this.hasInheritAcl() && !includeChild) return false;
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));

    const isPrivate = currentWorkspace?.properties && currentWorkspace?.properties["dc:isPrivate"];
    if (isButton) return isPrivate;
    const currentCollaborators = this.getFolderCollaborators();
    this.isAdmin = this.hasAdminPermission(currentCollaborators);
    return isPrivate && this.hasNoOtherCollaborators(currentCollaborators)
  }
  
  hasInheritAcl() {
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (currentWorkspace?.properties && currentWorkspace?.properties['isPrivateUpdated']) return true;
    if (!currentWorkspace?.contextParameters?.acls) return false;
    const inheritAcl = currentWorkspace.contextParameters.acls.find(acl => acl.name === 'local');
    if (!inheritAcl?.aces) return false;
    return true;
  }

  getFolderCollaborators() {
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (!currentWorkspace?.contextParameters?.acls) return [];
    const localAces = currentWorkspace.contextParameters.acls.find(acl => acl.name === 'local');
    if (!localAces?.aces) return;
    const folderCollaborators = {};
    localAces.aces.forEach(ace => {
      if (!ace.granted || ace.username.id === "Administrator" || ace.username.id === 'administrators') return;
      if (!ace.granted || ace.username === "Administrator" || ace.username === 'administrators') return;
      folderCollaborators[ace.username.id] = {
        user: ace.username,
        permission: ace.permission,
        externalUser: ace.externalUser,
        end: ace.end,
        id: ace.id,
      }
    });
    return folderCollaborators;
  }
  
  hasAdminPermission(currentCollaborators) {
    if (this.user === "Administrator") return true;
    const currentWorkspace = JSON.parse(localStorage.getItem('workspaceState'));
    if (currentWorkspace?.properties && currentWorkspace?.properties['isPrivateUpdated']) return true;
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return false;
    const ace = currentCollaborators[this.user];
    if (!ace) return false;
    return ace.permission === 'Everything';
  }
  
  hasNoOtherCollaborators(currentCollaborators) {
    if (!currentCollaborators || Object.keys(currentCollaborators).length === 0) return true;
    const otherUser = Object.keys(currentCollaborators).find(id => this.user !== id);
    if (otherUser) return false;
    else return true;
  }
  
  isExternalUser() {
    return this.listExternalUser.includes(this.user) && !this.listExternalUserGlobal.includes(this.user);
  }
  
  // ================================================================================================= //

}
