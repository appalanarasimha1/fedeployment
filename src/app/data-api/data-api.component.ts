import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-data-api',
  templateUrl: './data-api.component.html',
  styleUrls: ['./data-api.component.css']
})
export class DataApiComponent implements OnInit {

  checkedToggle:boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.accordion();
  }

  accordion() {

    const accSingleTriggers = document.querySelectorAll('.js-acc-single-trigger');

    accSingleTriggers.forEach(trigger => trigger.addEventListener('click', toggleAccordion));

    function toggleAccordion() {
      const items = document.querySelectorAll('.js-acc-item');
      const thisItem = this.parentNode;

      items.forEach(item => {
        if (thisItem == item) {
          thisItem.classList.toggle('is-open');
          return;
        }
        item.classList.remove('is-open');
      });
    }
    
  }

  togglerUserActivated(event) {
    console.log('event', event);
    this.checkedToggle = !this.checkedToggle;
  }

}