import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IBrowseSidebar, IEntry } from 'src/app/common/interfaces';

@Component({
  selector: 'app-browse-navigation',
  templateUrl: './browse-navigation.component.html',
  styleUrls: ['./browse-navigation.component.css']
})
export class BrowseNavigationComponent implements OnInit, OnChanges{
  @Input() folderStructure: IBrowseSidebar[];
  @Input() isExternalView: boolean;

  isTrashView: boolean = false;
  selectedSector: IEntry;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this;
  }

  ngOnChanges(changes: any) {
    this;
    changes;
  }

  getClass() {
    return 'active-tab';
  }

  onAllSectorClick(item: IBrowseSidebar) {
    // this.router.navigate(['workspace']);
    // fetchAllSectors(item.isExpand);
    // selectedFolder2 = item;
    // selectedFolder = item;
    // createBreadCrumb(item.title, item.type, item.path);
    // initialLoad = true;
  }

  onSectorClick(item: IEntry, index: number) {
    // handleGotoBreadcrumb(item, index);
    // selectedFolder2 = item;
    // selectedFolder = item;
    // sectorSelected = item;
    // closeOtherSectore(item, item.children);
    // initialLoad= false;
  }

}
