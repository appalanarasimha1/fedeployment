import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-table-card',
  templateUrl: './table-card.component.html',
  styleUrls: ['./table-card.component.css']
})
export class TableCardComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() data2: any;
  @Input() title: string;

  cumulcativeData: any[] = []; // Note: data + data2

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    // this.data.map(item => {
    //   this.data2.
    // });
  }

  getUsCommaSystemString(number: number): string {
    return this.sharedService.toUsCommaSystem(number);
  }

  toCamelCase(string: string): string {
    return this.sharedService.toCamelCase(string);
  }
}
