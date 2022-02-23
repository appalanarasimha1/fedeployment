import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(value: any[], ...args: string[]): any[] {
    if(args?.[0].trim()) {
      return value.filter(r => r.title.toLowerCase().indexOf(args?.[0].toLowerCase()) > -1);
    }
    return value;
  }

}
