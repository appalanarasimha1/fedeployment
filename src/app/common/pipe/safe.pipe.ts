import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }
  transform(data: string, type: string) {
    if(type === 'htmlText')
      return this.sanitizer.bypassSecurityTrustHtml(data);
    else
      return this.sanitizer.bypassSecurityTrustResourceUrl(data);
  }

}
