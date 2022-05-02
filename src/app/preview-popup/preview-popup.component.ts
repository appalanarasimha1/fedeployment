import { Component, OnInit, OnChanges, Input, ViewChild, TemplateRef } from "@angular/core";
import { Router } from "@angular/router";
import { apiRoutes } from "../common/config";
import { ApiService } from "../services/api.service";
import { localStorageVars, TAG_ATTRIBUTES, unwantedTags, DEFAULT_NUMBER_OF_TAGS_PREVIEW, specialExtensions } from "../common/constant";
import { NuxeoService } from '../services/nuxeo.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ALLOW, ALLOW_VALUE_MAP } from "../upload-modal/constant";
import { DataService } from "../services/data.service";
import { SharedService } from "../services/shared.service";

@Component({
  selector: "preview-popup",
  templateUrl: "./preview-popup.component.html",
  styleUrls: ["./preview-popup.component.css"],
})
export class PreviewPopupComponent implements OnInit, OnChanges {
  @Input() doc: any;
  @Input() docUrl: string;
  @Input() openInModal: boolean = true;

  @ViewChild('preview', {static: false}) modalTemp: TemplateRef<void>;

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
  currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW
  DEFAULT_NUMBER_OF_TAGS_PREVIEW = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  copiedString;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private modalService: NgbModal,
    public nuxeo: NuxeoService,
    public dataService: DataService,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    if (this.doc) {
      this.getTags();
      this.getComments();
    }
  }

  ngOnChanges(): void {
    if (this.doc) {
      this.getTags();
      this.getComments();
    }
  }

  open(): void {
    this.showShadow = false;
    this.activeTabs.comments = false;
    this.activeTabs.timeline = false;
    this.activeTabs.info = false;
    this.isAware = false;
    this.currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
    this.modalService
      .open(this.modalTemp, { ariaLabelledBy: "modal-basic-title" })
      .result.then(
        (result) => {
          this.modalLoading = false;
        },
        (reason) => {
          this.showTagInput = false;
          this.modalLoading = false;
          this.copiedString = '';
        }
      );
  }

  getTags() {
    this.tags = this.doc.contextParameters["tags"]?.map((tag) => tag) || [];
    this.doc.properties[TAG_ATTRIBUTES.ACTIVITY_DETECTION]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.EMOTION_DETECTION]?.map((item) => this.checkDuplicateAndAddTags(item));
    // this.doc.properties[TAG_ATTRIBUTES.NX_TAGS]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.OBJECT_DETECTION]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.OCR_TAGS]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.SCENE_DETECTION]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.WEATHER_CLASSIFICATION]?.map((item) => this.checkDuplicateAndAddTags(item));
    this.doc.properties[TAG_ATTRIBUTES.PUBLIC_FIGURE_DETECTION]?.map((item) => this.checkDuplicateAndAddTags(item));
  }

  checkDuplicateAndAddTags(tag: string): void {
    if(this.tags.indexOf(tag) !== -1) {
      return;
    } else if(unwantedTags.indexOf(tag.toLowerCase()) === -1) {
      this.tags.push(tag);
    }
    return;
  }

  getParentFolderName() {
    if (!this.doc) return '';
    // const split = this.doc.path.split('/');
    // return split[split.length - 2];
    return this.doc.properties['dc:sector'];
  }

  getComments() {
    const queryParams = { pageSize: 10, currentPageIndex: 0 };
    const route = apiRoutes.FETCH_COMMENTS.replace('[assetId]', this.doc.uid);
    this.nuxeo.nuxeoClient.request(route, { queryParams, headers: { 'enrichers.user': 'userprofile' } })
      .get().then((docs) => {
        this.comments = docs.entries;
      }).catch((err) => {
        console.log('get comment error', err);
      });
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    if (!url) return "";
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split("/nuxeo/")[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${
      url.split("/nuxeo/")[1]
    }`;
    this.modalLoading = true;
    fetch(updatedUrl, {
      headers: { "X-Authentication-Token": localStorage.getItem("token") },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          this.router.navigate(["login"]);

          this.modalLoading = false;
          return;
        }
        return r.blob();
      })
      .then((d) => {
        event.target.src = window.URL.createObjectURL(d);

        this.modalLoading = false;
      })
      .catch((e) => {
        // TODO: add toastr with message 'Invalid token, please login again'

        this.modalLoading = false;
        console.log(e);
      });
  }

  getDownloadFileEstimation(data: any) {
    if (!data) return;
    return `${
      data / 1024 > 1024
        ? (data / 1024 / 1024).toFixed(2) + " MB"
        : (data / 1024).toFixed(2) + " KB"
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

  openInfo(tabName: string) {
    if (!this.showShadow || this.selectedTab === tabName) {
      this.showShadow = !this.showShadow;
    }
    this.selectedTab = tabName;
    this.activeTabs[tabName] = this.showShadow;
  }

  getNames(users: any) {
    if(!users?.["dc:contributors"]) return '';
    let result = "";
    users["dc:contributors"].map((user) => {
      result += user + ", ";
    });
    return result;
  }

  toDateString(date: string): string {
    if(!date?.['dc:created']) return '';
    return `${new Date(date).toDateString()}`;
  }

  saveComment(comment: string): void {
    if (!comment.trim()) {
      return;
    }
    let error;
    const route = apiRoutes.SAVE_COMMENT.replace("[assetId]", this.doc.uid);
    const postData = {
      "entity-type": "comment",
      parentId: this.doc.uid,
      text: comment,
    };
    try {
      this.apiService.post(route, postData).subscribe((doc) => {
        this.modalLoading = false;
        this.commentText = "";
        this.comments.unshift(doc);
      });
    } catch (err) {
      this.modalLoading = false;
      console.log("save comment error = ", err);
    }
  }

  getTime(fromDate: Date, showHours: boolean, toDate?: Date) {
    return this.sharedService.returnDaysAgoFromTodayDate(fromDate, showHours, toDate);
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
          this.markRecentlyViewed(data);
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
          this.markRecentlyViewed(data);
        }
        this.modalLoading = false;
      });
  }

  markRecentlyViewed(data: any) {
    let found = false;
    // tslint:disable-next-line:prefer-const
    let recentlyViewed =
      JSON.parse(localStorage.getItem(localStorageVars.RECENTLY_VIEWED)) || [];
    if (recentlyViewed.length) {
      recentlyViewed.map((item: any, index: number) => {
        if (item.uid === data.uid) {
          found = true;
          recentlyViewed[index] = data;
        }
      });
    }
    if (found) {
      localStorage.setItem(
        localStorageVars.RECENTLY_VIEWED,
        JSON.stringify(recentlyViewed)
      );
      return;
    }

    data["isSelected"] = false;
    recentlyViewed.push(data);
    localStorage.setItem(
      localStorageVars.RECENTLY_VIEWED,
      JSON.stringify(recentlyViewed)
    );
    return;
  }

  hasNoRestriction() {
    return (!this.doc.properties["sa:allow"] || this.doc.properties["sa:allow"] === ALLOW.any && this.doc.properties["sa:downloadApproval"] !== 'true');
  }

  hasInternalRestriction() {
    return ((this.doc.properties["sa:allow"] === ALLOW.internal || this.doc.properties["sa:allow"] === ALLOW.request) && this.doc.properties["sa:downloadApproval"] !== 'true');
  }

  hasRequestRestriction() {
    return this.doc.properties["sa:allow"] === ALLOW.request || this.doc.properties["sa:downloadApproval"] === 'true';
  }

  showDownloadDropdown() {
    return this.hasNoRestriction() || (this.hasInternalRestriction() && this.isAware);
  }

  getCreator() {
    return this.doc.properties['dc:creator'].id || this.doc.properties['dc:creator'];
  }

  getCopyright() {
    if (this.doc.properties['sa:copyrightName'] && this.doc.properties['sa:copyrightYear']) {
      return `©️ ${this.doc.properties['sa:copyrightName']} ${this.doc.properties['sa:copyrightYear']}`;
    } else if(this.doc.properties['sa:copyrightName']) {
      return `©️ ${this.doc.properties['sa:copyrightName']}`;
    }
    return '';
  }

  getUsageAllowed() {
    // if (this.doc.properties['sa:allow'] && this.doc.properties['sa:allow'] !== ALLOW.any) {
    //   if(this.doc.properties['sa:allow'] === ALLOW.request) {
    //     return 'Permission Required';
    //   } else
    //   return `${this.doc.properties['sa:allow']}`;
    // }

    switch(this.doc.properties['sa:allow']) {
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
    this.dataService.termSearchInit(searchTerm);
    this.modalService.dismissAll();
  }

  showMoreTags() {
    this.currentTagLength = this.tags.length;
  }

  showLessTags() {
    this.currentTagLength = DEFAULT_NUMBER_OF_TAGS_PREVIEW;
  }

  copyLink() {
    // copyLinkOfAsset() {
      const pathArray = this.doc.path.split('/workspaces');
      const sector = pathArray[0]
      let assetName = pathArray[1].split('/').pop();
      const folderStructure = pathArray[1].split(assetName)[0];
      const extention: string[] = specialExtensions.filter((item: string) => assetName.includes(item));
      // assetName = assetName.replace(extention[0], '');
      
      const selBox = document.createElement("textarea");
      selBox.style.position = "fixed";
      selBox.style.left = "0";
      selBox.style.top = "0";
      selBox.style.opacity = "0";
      selBox.value = `${window.location.origin}/asset-view?sector=${sector}&folderStructure=${folderStructure}&extension=${extention[0] || 'allowed'}&assetName=${assetName}`;
      this.copiedString = selBox.value;
      document.body.appendChild(selBox);
      selBox.focus();
      selBox.select();
      document.execCommand("copy");
      document.body.removeChild(selBox);
    // }
  }

}
