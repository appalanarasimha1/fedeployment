import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(
    private router: Router
    ) { }

  ngOnChanges() {
  }


  getFileContent(): string {
    return this.doc.properties["file:content"]?.data || "";
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

}
