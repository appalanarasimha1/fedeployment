import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'static-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() title: string;
  @Input() data: string;

  constructor() { }

  ngOnInit(): void {
  }

}
