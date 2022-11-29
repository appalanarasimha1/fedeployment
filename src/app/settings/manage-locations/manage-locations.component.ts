import { Component, OnInit, ElementRef, ViewChild, Renderer2, VERSION, Input } from '@angular/core';

@Component({
  selector: 'app-manage-locations',
  templateUrl: './manage-locations.component.html',
  styleUrls: ['./manage-locations.component.css']
})
export class ManageLocationsComponent implements OnInit {

  @Input() name: string;

  showExternalUserPage: boolean = false;
  renameUserName: boolean = false;

  constructor(
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
  }

  showExternalUserList() {
    this.showExternalUserPage = !this.showExternalUserPage;
  }
  backExternalUserList() {
    this.showExternalUserPage = false;
  }

  onInput(event) {
    const input = event.target;
    input.parentNode.dataset.value = input.value;
  }
  
  renameUserClick() {
    this.renameUserName = !this.renameUserName;
  }

}
