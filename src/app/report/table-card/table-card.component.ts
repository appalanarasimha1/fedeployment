import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-card',
  templateUrl: './table-card.component.html',
  styleUrls: ['./table-card.component.css']
})
export class TableCardComponent implements OnInit {
  @Input() data: any;
  @Input() title: string;

  constructor() { }

  ngOnInit(): void {
  }

}
