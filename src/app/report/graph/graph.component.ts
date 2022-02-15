import { Component, Input, OnInit } from '@angular/core';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label } from 'ng2-charts';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
  @Input() labels: Label[];
  @Input() data: MultiDataSet; 
  @Input() chartType: ChartType;
  @Input() title: string;
  @Input() legend: boolean = true;
  
  constructor() { }

  ngOnInit(): void {
  }

}
