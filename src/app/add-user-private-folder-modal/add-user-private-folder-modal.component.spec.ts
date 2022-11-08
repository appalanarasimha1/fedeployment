import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserPrivateFolderModalComponent } from './add-user-private-folder-modal.component';

describe('AddUserPrivateFolderModalComponent', () => {
  let component: AddUserPrivateFolderModalComponent;
  let fixture: ComponentFixture<AddUserPrivateFolderModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUserPrivateFolderModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserPrivateFolderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
