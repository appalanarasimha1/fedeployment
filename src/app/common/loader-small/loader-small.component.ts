import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-loader-small',
  templateUrl: './loader-small.component.html',
  styleUrls: ['./loader-small.component.css']
})
export class LoaderSmallComponent implements OnInit {
  @Input() show: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
