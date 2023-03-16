import { Component, OnInit, OnChanges, Input, ViewChild, TemplateRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { apiRoutes } from "../common/config";
import { ApiService } from "../services/api.service";
import { localStorageVars, TAG_ATTRIBUTES, unwantedTags, DEFAULT_NUMBER_OF_TAGS_PREVIEW, specialExtensions, DRONE_UPLOADER } from "../common/constant";
import { NuxeoService } from '../services/nuxeo.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ALLOW, ALLOW_VALUE_MAP } from "../upload-modal/constant";
import { DataService } from "../services/data.service";
import { SharedService } from "../services/shared.service";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: "preview-popup",
  templateUrl: "./preview-popup.component.html",
  styleUrls: ["./preview-popup.component.css"],
})
export class PreviewPopupComponent implements OnInit, OnChanges {
  @Input() doc: any;
  @Input() docUrl: string;
  @Input() openInModal: boolean = true;

  @ViewChild("preview", { static: false }) modalTemp: TemplateRef<void>;

  modalLoading = false;
  inputTag: string;
  tags = [];
  showTagInput = false;
  showShadow = false;
  selectedTab;
  activeTabs = { comments: false, info: false, timeline: false };
  commentText: string;
  comments = [];
  isAware = false;
  currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  DEFAULT_NUMBER_OF_TAGS_PREVIEW = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  copiedString;
  user = null;
  requestComment = "";
  requestSent = false;
  rejectComment = "";
  modalOpen: boolean = true;
  fullSIzeImg: boolean = false;
  device;
  isDroneUploader = false;
  showCreateFolderPopup: boolean = false;

  last_index = 100;
  counter = 100;
  showTxt = "Show More";
  firstCount = 100;
  info = "walking alone with suitcase bag. Travel weekend NEOM vacation trip. Young woman pulling suitcase The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like). like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like). like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).";
  description: '';
  nevermindHideMsg: boolean = false;
  enableInput:boolean=false
  hasDownloadPermission = true

  constructor(
    private router: Router,
    private apiService: ApiService,
    private modalService: NgbModal,
    public nuxeo: NuxeoService,
    public dataService: DataService,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    public matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (this.doc) {
      this.getTags();
      this.getComments();
      this.getCameraInfo();
    }

    this.last_index = (this.info.substring(0, 200)).lastIndexOf(' ');
    if(this.last_index > 200) this.last_index = 200;
    this.counter = this.last_index;
    this.checkDroneUser();
  }

  ngOnChanges(): void {
    if (this.doc) {
      this.getTags();
      this.getComments();
      this.getCameraInfo();
      this.description = this.doc.properties['dc:description']
    }
    this.checkCanDownload();
    this.getRejectComment();
  }

  // open(): void {
  //   this.showShadow = false;
  //   this.activeTabs.comments = false;
  //   this.activeTabs.timeline = false;
  //   this.activeTabs.info = false;
  //   this.isAware = false;
  //   this.currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  //   this.modalService
  //     .open(this.modalTemp, { ariaLabelledBy: "modal-basic-title" })
  //     .result.then(
  //       (result) => {
  //         this.modalLoading = false;
  //       },
  //       (reason) => {
  //         this.showTagInput = false;
  //         this.modalLoading = false;
  //         this.copiedString = "";
  //       }
  //     );
  // }

  open(hasDownloadPermission=true) {
    this.hasDownloadPermission = hasDownloadPermission;
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    // dialogConfig.minHeight = "350px";
    // dialogConfig.height = "100%";
    // dialogConfig.maxHeight = "94vh"
    // dialogConfig.width = "80vw";
    // dialogConfig.maxWidth = "80vw";
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = 'custom-modalbox';
    // const workspaceState = JSON.parse(localStorage.getItem("workspaceState"));
    // if(workspaceState) {
    //   dialogConfig.data = workspaceState;
    // }
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(this.modalTemp, dialogConfig);
  }

  getTags() {
    this.tags = this.doc.contextParameters["tags"]?.map((tag) => tag) || [];
    this.doc.properties[TAG_ATTRIBUTES.ACTIVITY_DETECTION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    this.doc.properties[TAG_ATTRIBUTES.EMOTION_DETECTION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    // this.doc.properties[TAG_ATTRIBUTES.NX_TAGS]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.OBJECT_DETECTION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    this.doc.properties[TAG_ATTRIBUTES.OCR_TAGS]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    this.doc.properties[TAG_ATTRIBUTES.SCENE_DETECTION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    this.doc.properties[TAG_ATTRIBUTES.WEATHER_CLASSIFICATION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
    this.doc.properties[TAG_ATTRIBUTES.PUBLIC_FIGURE_DETECTION]?.map((item) =>
      this.checkDuplicateAndAddTags(item)
    );
  }

  checkDuplicateAndAddTags(tag: string): void {
    if (this.tags.indexOf(tag) !== -1) {
      return;
    } else if (unwantedTags.indexOf(tag.toLowerCase()) === -1) {
      this.tags.push(tag);
    }
    return;
  }

  getParentFolderName() {
    if (!this.doc) return "";
    // const split = this.doc.path.split('/');
    // return split[split.length - 2];
    return this.doc.properties["dc:sector"];
  }

  showAllComments:Boolean=false
  totalComments:number;
  getComments() {
    const queryParams = { pageSize: 4, currentPageIndex: 0 };
    const route = apiRoutes.FETCH_COMMENTS.replace("[assetId]", this.doc.uid);
    this.nuxeo.nuxeoClient
      .request(route, {
        queryParams:this.showAllComments?{}:queryParams,
        headers: { "enrichers.user": "userprofile" },
      })
      .get()
      .then((docs) => {
        this.comments = docs.entries;
        this.totalComments = docs.totalSize
      })
      .catch((err) => {
        console.log("get comment error", err);
        this.showAllComments = false
      });
  }

  getDownloadFileEstimation(data?: any): string {
    data = data || this.doc?.properties?.["file:content"]?.length;
    if (!data) return '0 Kb';
    return `${
      data / 1024 > 1024
        ? (data / 1024 / 1024).toFixed(2) + " MB"
        : (data / 1024).toFixed(2) + " Kb"
    }`;
  }

  addTag(inputTag: string): void {
    if (!inputTag) return;
    const route = apiRoutes.ADD_TAG;
    const apiBody = {
      input: this.doc.uid,
      params: {
        tags: inputTag,
      },
    };
    this.apiService.post(route, apiBody).subscribe((response) => {
      this.tags.push(inputTag);
      this.doc.contextParameters["tags"].push(inputTag);
      this.inputTag = "";
    });
  }
  docAudit:any = []
  openInfo(tabName: string,doc?:any) {
    if (tabName =='timeline') {
      this.docAudit = doc?.filter((aud:any)=>aud.principalName !== 'system' && aud.principalName !=='Administrator')
    }
    if (!this.showShadow || this.selectedTab === tabName) {
      this.showShadow = !this.showShadow;
    }
    this.selectedTab = tabName;
    this.activeTabs[tabName] = this.showShadow;
  }

  getNames(users: any) {
    if (!users?.["dc:contributors"]) return "";
    let result = "";
    users["dc:contributors"].map((user) => {
      result += user + ", ";
    });
    return result;
  }

  toDateString(date: string): string {
    if (!date?.["dc:created"]) return "";
    return `${new Date(date["dc:created"]).toDateString()}`;
  }

  saveComment(comment: string): void {
    if (!this.commentText.trim()) {
      return;
    }
    let commentTosend = this.commentText.trim()
    this.commentText = ""
    const route = apiRoutes.SAVE_COMMENT.replace("[assetId]", this.doc.uid);
    const postData = {
      "entity-type": "comment",
      parentId: this.doc.uid,
      text: commentTosend,
    };
    try {
      this.apiService.post(route, postData).subscribe((doc) => {
        this.modalLoading = false;
        this.commentText = "";
        // this.comments.unshift(doc);
        this.getComments()
      });
    } catch (err) {
      this.modalLoading = false;
      console.log("save comment error = ", err);
    }
  }

  getTime(fromDate: Date, showHours: boolean, toDate?: Date) {
    return this.sharedService.returnDaysAgoFromTodayDate(
      fromDate,
      showHours,
      toDate
    );
  }

  getDoubleDigit(value: number) {
    if (value < 10) {
      return "0" + value;
    }
    return value;
  }

  getEventString(event: string): string {
    let result = event;
    switch (event) {
      case "download":
        result = "downloaded";
        break;
      case "documentCreated":
        result = "created document";
        break;
    }
    return result;
  }

  onFileProgress(event: any) {
    if (!event.loaded) {
      this.modalLoading = true;
    }
    if ((event.loaded / event.total) * 100 > 1) {
      this.modalLoading = false;
    }
  }

  markFavourite(data, favouriteValue) {
    // this.favourite = !this.favourite;
    if (data.contextParameters.favorites.isFavorite) {
      this.unmarkFavourite(data, favouriteValue);
      return;
    }
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    this.modalLoading = true;
    this.apiService
      .post(apiRoutes.MARK_FAVOURITE, body)
      .subscribe((docs: any) => {
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
        this.modalLoading = false;
      });
  }

  unmarkFavourite(data, favouriteValue) {
    const body = {
      context: {},
      input: data.uid,
      params: {},
    };
    this.modalLoading = true;
    this.apiService
      .post(apiRoutes.UNMARK_FAVOURITE, body)
      .subscribe((docs: any) => {
        // data.contextParameters.favorites.isFavorite = this.favourite;
        data.contextParameters.favorites.isFavorite =
          !data.contextParameters.favorites.isFavorite;
        if (favouriteValue === "recent") {
          this.sharedService.markRecentlyViewed(data);
        }
        this.modalLoading = false;
      });
  }

  // markRecentlyViewed(data: any) {
  //   let found = false;
  //   // tslint:disable-next-line:prefer-const
  //   let recentlyViewed =
  //     JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
  //   if (recentlyViewed.length) {
  //     recentlyViewed.map((item: any, index: number) => {
  //       if (item.uid === data.uid) {
  //         found = true;
  //         recentlyViewed[index] = data;
  //       }
  //     });
  //   }
  //   if (found) {
  //     localStorage.setItem(
  //       localStorageVars.RECENTLY_VIEWED,
  //       JSON.stringify(recentlyViewed)
  //     );
  //     return;
  //   }

  //   data["isSelected"] = false;
  //   recentlyViewed.push(data);
  //   localStorage.setItem(
  //     localStorageVars.RECENTLY_VIEWED,
  //     JSON.stringify(recentlyViewed)
  //   );
  //   return;
  // }

  hasNoRestriction() {
    return (
      !this.doc.properties["sa:allow"] ||
      (this.doc.properties["sa:allow"] === ALLOW.any &&
        this.doc.properties["sa:downloadApproval"] !== "true")
    );
  }

  hasInternalRestriction() {
    return (
      (this.doc.properties["sa:allow"] === ALLOW.internal ||
        this.doc.properties["sa:allow"] === ALLOW.request) &&
      this.doc.properties["sa:downloadApproval"] !== "true"
    );
  }

  hasRequestRestriction() {
    return (
      this.doc.properties["sa:allow"] === ALLOW.request ||
      this.doc.properties["sa:downloadApproval"] === "true"
    );
  }

  hasPrivateAccess(){
    return this.doc.properties["dc:isPrivate"]===true ? true: false
  }
  internalUse(){
    return this.doc.properties["sa:allow"] === ALLOW.internal;
  }

  showDownloadDropdown() {
    return (
      this.hasNoRestriction() || (this.hasInternalRestriction() && this.isAware)
    );
  }

  getCreator() {
    return this.doc?.properties?.['dc:creator']?.id || this.doc?.properties?.['dc:creator'];
  }

  getCreatorEmail() {
    return this.doc?.properties?.['dc:creator']?.properties?.email || this.doc?.properties?.['dc:creator'];
  }

  getApprovalUsers(): string[] {
    return this.doc.properties?.["sa:downloadApprovalUsers"] || [];
  }

  getCopyright() {
    if (
      this.doc.properties["sa:copyrightName"] &&
      this.doc.properties["sa:copyrightYear"]
    ) {
      return `©️ ${this.doc.properties["sa:copyrightName"]} ${this.doc.properties["sa:copyrightYear"]}`;
    } else if (this.doc.properties["sa:copyrightName"]) {
      return `©️ ${this.doc.properties["sa:copyrightName"]}`;
    }
    return "";
  }

  getUsageAllowed() {
    // if (this.doc.properties['sa:allow'] && this.doc.properties['sa:allow'] !== ALLOW.any) {
    //   if(this.doc.properties['sa:allow'] === ALLOW.request) {
    //     return 'Permission Required';
    //   } else
    //   return `${this.doc.properties['sa:allow']}`;
    // }

    switch (this.doc.properties["sa:allow"]) {
      case ALLOW.any:
        return ALLOW_VALUE_MAP["Anywhere (including external publications)"];
      case ALLOW.internal:
        return ALLOW_VALUE_MAP["Internal publications only"];
      case ALLOW.request:
        return ALLOW_VALUE_MAP["Request owner's permission before use"];
      default:
        ALLOW_VALUE_MAP["Anywhere (including external publications)"];
    }
    // return '';
  }

  search(searchTerm: string) {
    this.closeModal();
    this.dataService.termSearchInit(searchTerm);
    this.dataService.termSearchForHideInit(searchTerm);

  }

  showMoreTags() {
    this.currentTagLength = this.tags.length;
  }

  showLessTags() {
    this.currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  }

  copyLink() {
    console.log(', this.doc = ', this.doc.properties['dc:sector']);
    this.copiedString = this.sharedService.copyLink(this.doc.uid, 'asset', this.doc?.properties?.['dc:sector']);


      // const assetId = this.doc.uid;

      // const selBox = document.createElement("textarea");
      // selBox.style.position = "fixed";
      // selBox.style.left = "0";
      // selBox.style.top = "0";
      // selBox.style.opacity = "0";
      // selBox.value = `${window.location.origin}/asset-view?assetId=${assetId}`;
      // this.copiedString = selBox.value;
      // document.body.appendChild(selBox);
      // selBox.focus();
      // selBox.select();
      // document.execCommand("copy");
      // document.body.removeChild(selBox);
    // }
  }

  navigateTo(location: string): void {
    this.router.navigate(['workspace'], { queryParams: {folder: location }});
    this.modalService?.dismissAll();
  }

  getDescription(): string {
    return  this.doc?.properties?.["dc:description"] || this.doc?.properties?.["imd:image_description"];
  }

  getImageDimensions(): string {
    return `${this.doc?.properties?.["picture:info"]?.width} x ${this.doc?.properties?.["picture:info"]?.height}`;
  }

  checkCopyRight() {
    let m = this.doc;
    if (
      m.properties["sa:copyrightName"] !== null &&
      m.properties["sa:copyrightName"] !== ""
    ) {
      return true;
    } else {
      return false;
    }
  }

  getApprovalUsers1() {
    return this.doc.properties?.["sa:downloadApprovalUsers"].length>0 ? true:false
  }

  checkMimeType(document): string {
    return this.sharedService.checkMimeType(document);
  }

  getAuthor(comment){
    let user = JSON.parse(localStorage.getItem("user"))["username"];
    if (user == comment.author) return "You"
    return comment.author
  }

 async findChoices(searchText: string) {
    const params = {
      "q": searchText.toLowerCase(),
      "currentPageIndex": "0",
    };

        const response:any = await fetch("/nuxeo/api/v1/"+apiRoutes.SEARCH_USER + "?" +new URLSearchParams(params), {
            method: 'Get', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'include', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          }).then( response => response.json() )

          return await response?.entries.map(data=>data.id)

  }
  getChoiceLabel(choice: string) {
    return `{{${choice}}} `;
  }
  checkCanDownload() {
    if (this.user === this.getCreator()) return true;
    const permissions = this.doc?.contextParameters?.permissions || [];
    return permissions.includes("CanDownload");
  }

  checkRejected() {
    const permissions = this.doc?.contextParameters?.permissions || [];
    return permissions.includes("DownloadRequestRejected");
  }

  getRejectComment() {
    if (!this.checkRejected()) return;
    const processedDownloadRequest = JSON.parse(localStorage.getItem("processedDownloadRequest")) || [];
    const noti = processedDownloadRequest.find(entry => entry.docUUID === this.doc.uid);
    if (!noti) return;
    this.rejectComment = noti.extended?.rejectComment || "";
  }

  hasRequestPending() {
    const permissions = this.doc?.contextParameters?.permissions || [];
    return this.requestSent || permissions.includes("DownloadRequestPending");
  }

  async fetchUserData() {
    if (localStorage.getItem("user")) {
      this.user = JSON.parse(localStorage.getItem("user"))["username"];
      if (this.user) return;
    }
    if (this.nuxeo.nuxeoClient) {
      const res = await this.nuxeo.nuxeoClient.connect();
      this.user = res.user.id;
      localStorage.setItem("user", JSON.stringify(res.user.properties));
    }
  }

  async sendRequestDownload() {
    const body = {
      context: {},
      input: this.doc.uid,
      params: {
        comment: this.requestComment
      },
    };
    await this.apiService.post(apiRoutes.REQUEST_DOWNLOAD, body).toPromise();
    this.requestSent = true;
  }
  loading:boolean=false
  showAllcommentClick(){
    this.loading = true
    this.showAllComments = true
    this.getComments()
    this.loading = false
  }

  creatUserName(name){
    let data = name.split(".")
    let newName = data[0][0];
    return newName.toUpperCase()
  }
  closeModal() {
    this.modalOpen = false;
    this.modalLoading = false;
    this.showAllComments= false;
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    this.matDialog.closeAll();
    this.fullSIzeImg = false;
  }

  getCommentStr(str){
    let temp = str.replaceAll("&#64;","@");
    temp = temp.replaceAll('{<!-- -->{', "<span style='color: #DEB31A !important;font-family: 'brownregular' !important;'>");
    return temp.replaceAll("}}", "</span>");
  }

  clickFullsizeImg(event) {
    event.stopPropagation()
    this.fullSIzeImg = !this.fullSIzeImg;
  }

  isFavorite() {
    return this.doc.contextParameters.favorites?.isFavorite;
  }

  zoom(e) {
    // e.stopPropagation();
    var zoomer = e.currentTarget;
    let offsetX, offsetY, x, y;
    e.offsetX ? offsetX = e.offsetX : offsetX = e.touches[0].pageX;
    e.offsetY ? offsetY = e.offsetY : offsetX = e.touches[0].pageX;
    x = offsetX/zoomer.offsetWidth*100;
    y = offsetY/zoomer.offsetHeight*100;
    zoomer.style.backgroundPosition = x + '% ' + y + '%';
  }

  async getCameraInfo() {
    const installationId = this.doc.properties["dc:installationId"];
    if (!installationId) return;
    const res = (await this.apiService.get(`/settings/camera/byId?installationId=${installationId}`, {}).toPromise()) as any;
    this.device = res;
  }

  getTimeTaken() {
    if (!this.device.installationTime) return "";
    return this.device.installationTime.match(/.{1,2}/g).join(":");
  }


  toggleSkil(event){
    if(this.counter < 201 )
      {
        this.counter = this.info.length;
        this.showTxt = "View less";
      }

      else {
        this.counter = this.last_index;
        this.showTxt = "View more"
      }
  }

  clearValue() {
    this.description = '';
  }

  closeDeleteModal(){
    this.nevermindHideMsg = !this.nevermindHideMsg;
  }
  checkDroneUser() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const groups = user.groups;
      if (groups.includes(DRONE_UPLOADER) && groups.length === 1) {
        this.isDroneUploader = true;
      }
      return;
    }
  }

  datePickerDefaultAction() {
    this.showCreateFolderPopup = true;
    $(".buttonCreate").on("click", function (e) {
      $(".dropdownCreate").show();
      $(".buttonCreate").addClass("createNewFolderClick");
      e.stopPropagation();
    });
    $(".buttonCreate.createNewFolderClick").on("click", function (e) {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
      e.stopPropagation();
    });

    $(".dropdownCreate").click(function (e) {
      e.stopPropagation();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });

    $(document).click(function () {
      $(".dropdownCreate").hide();
      $(".buttonCreate").removeClass("createNewFolderClick");
    });
  }

  getAssetUrl(event: any, url: string, document?: any, type?: string): string {
    if(document && this.checkAssetMimeTypes(document) === 'nopreview') {
      return '../../../assets/images/no-preview-big.png';
    }
    return this.sharedService.getAssetUrl(event, url, type);
  }

  checkAssetMimeTypes(document: any): string {
    return this.sharedService.checkMimeType(document);
  }

  async addUpdateDescription(){
    // let url = `/id/${this.doc?.uid}`
    let url = '/automation/Document.Update'
    let payload = {
      // "entity-type": "document",
      "input": this.doc?.uid,
      "params":{
        "properties": {
          "dc:description": this.nevermindHideMsg?"":this.description
        }
      }

    }
    this.apiService.post(url,payload).subscribe((res:any)=>{
      this.doc = res
      if (this.nevermindHideMsg) {
        this.description = ""
        this.nevermindHideMsg = false
      }
    })
    // last
    this.enableInput=false
  }

  enableInputClick(value:boolean){
    this.enableInput=value
  }
}
