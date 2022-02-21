import { Component, Input, OnInit } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-table-card',
  templateUrl: './table-card.component.html',
  styleUrls: ['./table-card.component.css']
})
export class TableCardComponent implements OnInit {
  @Input() data: any;
  @Input() title: string;

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
  }

  getUsCommaSystemString(number: number): string {
    return this.sharedService.toUsCommaSystem(number);
  }
}
