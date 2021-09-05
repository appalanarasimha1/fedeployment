import { Input, Component, Output, EventEmitter } from '@angular/core';
import { IHeaderSearchCriteria } from '../../common/subHeader/interface';

@Component({
  selector: 'document',
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './document.style.css' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './document.template.html'
})
export class Document {
  @Input() document: Object = {};
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  private searchCriteria: IHeaderSearchCriteria = {};
  public display: number = 1;

  constructor() {}

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

  emitData(data: IHeaderSearchCriteria): void {
    this.searchTextOutput.emit(data);
    return;
  }

  changeDisplay(mode: number): void {
    this.display = mode;
  }
}
