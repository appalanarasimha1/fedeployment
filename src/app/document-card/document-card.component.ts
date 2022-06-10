import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MONTH_MAP_SHORT } from '../common/constant';
import { ACCESS, ALLOW, CONFIDENTIALITY } from '../upload-modal/constant';

@Component({
  selector: 'document-card',
  templateUrl: './document-card.component.html',
  styleUrls: ['./document-card.component.css']
})
export class DocumentCardComponent implements OnChanges {

  @Input() doc: any;
  @Input() viewType: string;
  @Output() onOpenPreview = new EventEmitter<any>();
  @Output() onSelect = new EventEmitter<any>();
  @Output() onMarkFavourite = new EventEmitter<any>();

  modalLoading = false;
  isAware = false;
  showLock = false;
  copiedString = '';
  downloadErrorShow: boolean = false;
  downloadEnable: boolean = false;

  constructor(
    private router: Router
    ) { }

  ngOnChanges() {
  }


  getFileContent(): string {
    return this.getAssetUrl(null, this.doc?.properties["file:content"]?.data || "");
  }

  openPreview() {
    this.onOpenPreview.emit();
  }

  selectImage(event: any): void {
    if (event.target.checked) {
      this.onSelect.emit({checked: true});
    } else {
      this.onSelect.emit({checked: false});
    }
  }

  markFavourite() {
    this.onMarkFavourite.emit();
  }

  downloadAsset() {
    const url = this.getFileContent();
    fetch(url, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);

          return;
        }
        return r.blob();
      })
      .then(d => {
        window.URL.createObjectURL(d);
        window.open(url);

        // event.target.src = new Blob(d);
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'

          console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  
  }


  getAssetUrl(event: any, url: string, type?: string): string {
    if(!url) return '';
    if (!event) {
      return `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    }

    const updatedUrl = `${window.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    this.modalLoading = true;
    fetch(updatedUrl, { headers: { 'X-Authentication-Token': localStorage.getItem('token') } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['login']);

          this.modalLoading = false;
          return;
        }
        return r.blob();
      })
      .then(d => {
        event.target.src = window.URL.createObjectURL(d);
        this.showLock = true;

    this.modalLoading = false;
        // event.target.src = new Blob(d);
      }
      ).catch(e => {
        // TODO: add toastr with message 'Invalid token, please login again'

          this.modalLoading = false;
          console.log(e);
        // if(e.contains(`'fetch' on 'Window'`)) {
        //   this.router.navigate(['login']);
        // }

      });
    // return `${this.document.location.origin}/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `https://10.101.21.63:8087/nuxeo/${url.split('/nuxeo/')[1]}`;
    // return `${this.baseUrl}/nuxeo/${url.split('/nuxeo/')[1]}`;
  }

  getAssetDate() {
    return `${MONTH_MAP_SHORT[new Date(this.doc.lastModified).getMonth()]} ${new Date(this.doc.lastModified).getDate()}, ${new Date(this.doc.lastModified).getFullYear()}`; // ex: Nov 2, 2021
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
    return this.doc.properties['sa:users'][0] 
  }

  getApprovalUsers(): string[] {
    return this.doc.properties['sa:downloadApprovalUsers'];
  }

  showLockIcon(): boolean {
    if(!this?.doc?.properties['sa:confidentiality']) return false;
    if(this.doc.properties['sa:confidentiality'].toLowerCase() === CONFIDENTIALITY.confidential.toLowerCase()) return true;
    else return false;
  }

  copyLinkOfAsset() {
    const pathArray = this.doc.path.split('/workspaces');
    const sector = pathArray[0]
    const assetName = pathArray[1].split('/').pop();
    const folderStructure = pathArray[1].split(assetName)[0].replaceAll('/', '+');
    
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = `${window.location.origin}/asset-view${sector}/${folderStructure}/${assetName}`;
    this.copiedString = selBox.value;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  downloadClick() {
    if(!this.downloadEnable) {
      this.downloadErrorShow = true;
    }
  }
  onCheckboxChange(e: any) {
    if(e.target.checked){
      this.downloadErrorShow = false;
      this.downloadEnable = true;
    } else {
      this.downloadEnable = false;
    }
    
  }

}
