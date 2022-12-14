import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageExternalUsersComponent } from './manage-external-users.component';

describe('ManageExternalUsersComponent', () => {
  let component: ManageExternalUsersComponent;
  let fixture: ComponentFixture<ManageExternalUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageExternalUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageExternalUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
