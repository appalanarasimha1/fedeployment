import { Component, Output, EventEmitter } from '@angular/core';
import { Search } from '../../search';

@Component({
  selector: 'app-sub-header',
  // directives: [Search],
  templateUrl: './subHeader.component.html',
  styleUrls: ['./subHeader.component.css']
})
export class SubHeaderComponent {
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  private searchText: string = '';

  constructor() {

  }

  searchOutputFn(value: string): void {
    this.searchTextOutput.emit(value);
  }
}
