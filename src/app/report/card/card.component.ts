import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'static-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() title: string;
  @Input() data: string;

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
  }

  getUsCommaSystemString(number: number|string): string {
    return this.sharedService.toUsCommaSystem(number);
  }

}
