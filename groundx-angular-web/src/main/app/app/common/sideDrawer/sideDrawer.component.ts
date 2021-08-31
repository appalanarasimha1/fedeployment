import { Component } from '@angular/core';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './sideDrawer.component.html',
  styleUrls: ['./sideDrawer.component.css']
})
export class SideDrawerComponent {
openNav() {
    document.getElementById("main-sidebar").style.width = "270px";
    document.getElementById("main").classList.toggle('shiftFilter');
  document.getElementById("main-sidebar").classList.toggle("closeBtn");

  }
}
