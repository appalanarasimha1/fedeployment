import { Component } from '@angular/core';

@Component({
  selector: 'detail',
  template: `
    <router-outlet></router-outlet>
  `
})
export class Detail {
  constructor() {

  }

  ngOnInit() {
    console.log('hello `Detail` component');
  }

}
