import { Component, OnChanges, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ASSET_TYPE, MONTH_MAP_SHORT } from '../common/constant';
import { SharedService } from '../services/shared.service';
import { ACCESS, ALLOW, CONFIDENTIALITY } from '../upload-modal/constant';

@Component({
  selector: "document-card",
  templateUrl: "./document-card.component.html",
  styleUrls: ["./document-card.component.css"],
})
export class DocumentCardComponent implements OnInit, OnChanges {
  @Input() doc: any;
  // @Input() viewType: string;
  @Output() onOpenPreview = new EventEmitter<any>();
  @Output() onSelect = new EventEmitter<any>();
  @Output() onMarkFavourite = new EventEmitter<any>();

  modalLoading = false;
  isAware = false;
  showLock = false;
  copiedString = "";
  downloadErrorShow: boolean = false;
  downloadEnable: boolean = false;

  constructor(
    private router: Router,
    public sharedService: SharedService
    ) {}

  ngOnInit() {
  }

  ngOnChanges() {}

  getFileContent(): string {
    return this.getAssetUrl(null,this.doc?.properties["file:content"]?.data || "");
  }

  openPreview() {
    this.onOpenPreview.emit();
  }

  selectImage(event: any): void {
    if (event.target.checked) {
      this.onSelect.emit({ checked: true });
    } else {
      this.onSelect.emit({ checked: false });
    }
  }

  markFavourite() {
    this.onMarkFavourite.emit();
  }

  downloadAsset() {
    const url = this.getFileContent();
    fetch(url, {
      headers: { "X-Authentication-Token": localStorage.getItem("token") },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          this.router.navigate(["login"]);

          return;
        }
        return r.blob();
      })
      .then((d) => {
        window.URL.createObjectURL(d);
        window.open(url);

        // event.target.src = new Blob(d);
      })
      .catch((e) => {
        // TODO: add toastr with message 'Invalid token, please login again'

        console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }
      });
  }

  getAssetUrl(event: any, url: string, type?: string): string {
    return this.sharedService.getAssetUrl(event, url, type);
  }

  getAssetDate() {
    return `${
      MONTH_MAP_SHORT[new Date(this.doc.lastModified).getMonth()]
    } ${new Date(this.doc.lastModified).getDate()}, ${new Date(
      this.doc.lastModified
    ).getFullYear()}`; // ex: Nov 2, 2021
  }

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
  hasInternalRestriction1() {
    return (
      this.doc.properties["sa:allow"] === ALLOW.internal ||
        this.doc.properties["sa:allow"] === ALLOW.request
    );
  }

  hasRequestRestriction() {
    return (
      this.doc.properties["sa:allow"] === ALLOW.request ||
      this.doc.properties["sa:downloadApproval"] === "true"
    );
  }

  showDownloadDropdown() {
    return (
      this.hasNoRestriction() || (this.hasInternalRestriction() && this.isAware)
    );
  }

  getCreator() {
    return this.doc.properties["sa:downloadApprovalUsers"][0];
  }

  getApprovalUsers(): string[] {
    return this.doc.properties?.["sa:downloadApprovalUsers"] || [];
  }

  showLockIcon(): boolean {
    if (!this?.doc?.properties["sa:confidentiality"]) return false;
    if (
      this.doc.properties["sa:confidentiality"].toLowerCase() ===
      CONFIDENTIALITY.confidential.toLowerCase()
    )
      return true;
    else return false;
  }

  copyLinkOfAsset() {
    const pathArray = this.doc.path.split("/workspaces");
    const sector = pathArray[0];
    const assetName = pathArray[1].split("/").pop();
    const folderStructure = pathArray[1]
      .split(assetName)[0]
      .replaceAll("/", "+");

    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = encodeURI(`${window.location.origin}/asset-view${sector}/${folderStructure}/${assetName}`);
    this.copiedString = selBox.value;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  downloadClick() {
    if (!this.downloadEnable) {
      this.downloadErrorShow = true;
    }
  }
  onCheckboxChange(e: any) {
    if (e.target.checked) {
      this.downloadErrorShow = false;
      this.downloadEnable = true;
    } else {
      this.downloadEnable = false;
    }
  }

  checkCopyRight() {
    let m = this.doc;
    // console.log({m});

    if (
      m.properties["sa:copyrightName"] !== null &&
      m.properties["sa:copyrightName"] !== ""
    ) {
      // console.log({ m });

      return true;
    } else {
      // console.log({ m });

      return false;
    }
  }
  checkPopupNeeds(){
    if(this.checkCopyRight() ||this.hasInternalRestriction()|| this.hasRequestRestriction()) return true
    return false
  }

  checkMimeType(document): string {
    const mimeType = document.properties['file:content']?.['mime-type'];
    
      if(mimeType?.includes('image'))
        return ASSET_TYPE.PICTURE;
      if(mimeType?.includes('video'))
        return ASSET_TYPE.VIDEO;
      if(mimeType?.includes('pdf'))
        return ASSET_TYPE.FILE;
      
      return 'nopreview';
  }

  getNoPreview(item) {
    const splitedData = item?.title?.split('.');
    const mimeType = splitedData[splitedData?.length - 1];
    const lowercaseMime = mimeType.toLowerCase();

    if(lowercaseMime == 'doc' || lowercaseMime == 'docx'){
      return '../../../assets/images/word.png';
    } 
    if(lowercaseMime == 'ppt' || lowercaseMime == 'pptx'){
      return '../../../assets/images/ppt.png';
    }
    return '../../../assets/images/no-preview.png';

  }
}
