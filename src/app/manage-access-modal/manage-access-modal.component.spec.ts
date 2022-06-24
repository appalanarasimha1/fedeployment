import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAccessModalComponent } from './manage-access-modal.component';

describe('ManageAccessModalComponent', () => {
  let component: ManageAccessModalComponent;
  let fixture: ComponentFixture<ManageAccessModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageAccessModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageAccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
