import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IBrowseSidebar, IEntry } from 'src/app/common/interfaces';

@Component({
  selector: 'app-browse-navigation',
  templateUrl: './browse-navigation.component.html',
  styleUrls: ['./browse-navigation.component.css']
})
export class BrowseNavigationComponent implements OnInit {
  @Input() folderStructure: IBrowseSidebar[];
  @Input() isExternalView: boolean;

  isTrashView: boolean = false;
  selectedSector: IEntry;

  constructor() { }

  ngOnInit(): void {
  }

  getClass() {
    return 'active-tab';
  }

}
