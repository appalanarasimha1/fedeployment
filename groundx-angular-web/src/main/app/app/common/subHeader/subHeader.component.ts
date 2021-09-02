import { Component, Output, EventEmitter } from '@angular/core';
import { Search } from '../../search';
import { IHeaderSearchCriteria } from './interface';

@Component({
  selector: 'app-sub-header',
  // directives: [Search],
  templateUrl: './subHeader.component.html',
  styleUrls: ['./subHeader.component.css']
})
export class SubHeaderComponent {
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  private searchText: string = '';
  private searchCriteria: IHeaderSearchCriteria = {};

  constructor() {

  }

  dropdownMenu(event: any): void {
    let sortBy = event.target.value;
    if(sortBy) {
      this.searchCriteria['sortBy'] = sortBy;
      this.searchCriteria['sortOrder'] = 'asc';
    } else {
      delete this.searchCriteria['sortBy'];
      delete this.searchCriteria['sortOrder']
    }
    this.emitData(this.searchCriteria);
  }

  searchOutputFn(searchText: string): void {
    if(searchText) {
      this.searchCriteria['ecm_fulltext'] = searchText;
      this.searchCriteria['highlight'] = 'dc:title.fulltext,ecm:binarytext,dc:description.fulltext,ecm:tag,note:note.fulltext,file:content.name';
    } else {
      delete this.searchCriteria['ecm_fulltext'];
      delete this.searchCriteria['highlight'];
    }
    this.emitData(this.searchCriteria);
  }

  emitData(data: IHeaderSearchCriteria): void {
    this.searchTextOutput.emit(data);
    return;
  }
}
