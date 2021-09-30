import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { SharedService } from 'src/app/services/shared.service';
import { IHeaderSearchCriteria } from './interface';

@Component({
  selector: 'app-sub-header',
  // directives: [Search],
  templateUrl: './subHeader.component.html',
  styleUrls: ['./subHeader.component.css']
})
export class SubHeaderComponent implements OnInit {
  @Output() searchTextOutput: EventEmitter<any> = new EventEmitter();
  // @Input() sectors: string[];
  searchText: string = '';
  searchCriteria: IHeaderSearchCriteria = {};
  sectors: string[] = [];
  sectorSelected;

  constructor(
    private dataService: DataService,
    private sharedService: SharedService
    ) {}

  ngOnInit() {
    this.dataService.sectorChanged$.subscribe((sectors: any) => {
      this.sectors = sectors;
    });
    return;
  }
  
  sectorSelect(value: string) {
    this.sectorSelected = value;
    this.dataService.sectorChange(value);
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
