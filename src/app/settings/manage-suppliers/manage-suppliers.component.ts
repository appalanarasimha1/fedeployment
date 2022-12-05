import { Component, OnInit, ElementRef, ViewChild, Renderer2, VERSION, Input } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
// import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { CreateSupplieModalComponent } from '../create-supplie-modal/create-supplie-modal.component';

@Component({
  selector: 'app-manage-suppliers',
  templateUrl: './manage-suppliers.component.html',
  styleUrls: ['./manage-suppliers.component.css']
})
export class ManageSuppliersComponent implements OnInit {

  @Input() name: string;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  suppliersCtrl = new FormControl();
  filteredFruits: Observable<string[]>;
  fruits: any = [];
  suppliersRegion: any = [
    {
      id: 1,
      name: 'OX'
    },
    {
      id: 2,
      name: 'TR'
    },
    {
      id: 3,
      name: 'LN'
    }
  ];
  renameEmail : boolean = false;
  createSuppliers: string = '';
  inviteSuppliers: string = '';
  showExternalUserPage: boolean = false;

  @ViewChild('suppliersInput') suppliersInput: ElementRef;
  @ViewChild("myInput", { static: false }) myInput: ElementRef;

  // name = "Angular " + VERSION.major;
  hiddenSpan = this.renderer.createElement("span");

  renameUserName: boolean = false;
  

  constructor(
    public matDialog: MatDialog,
    private renderer: Renderer2
  ) {
    this.filteredFruits = this.suppliersCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => fruit ? this._filter(fruit) : this.suppliersRegion.slice()));
  }

  ngOnInit(): void {
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    // Add our fruit
    if ((value || '').trim()) {
      this.fruits.push({
        id:Math.random(),
        name:value.trim()
      });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.suppliersCtrl.setValue(null);
  }

  remove(fruit, indx): void {
    this.fruits.splice(indx, 1);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.fruits.push(event.option.value);
    this.suppliersInput.nativeElement.value = '';
    this.suppliersCtrl.setValue(null);
  }

  private _filter(value: any): any[] {
    return this.suppliersRegion.filter(fruit => fruit?.name.toLowerCase().includes(value?.name.toLowerCase()));
  }
  
  renameEmailClick(){
    this.renameEmail = !this.renameEmail;
  }

  async openCreateSupplierModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.id = "modal-component";
    dialogConfig.width = "500px";
    dialogConfig.disableClose = true; // The user can't close the dialog by clicking outside its body

    const modalDialog = this.matDialog.open(CreateSupplieModalComponent, dialogConfig);

    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        console.log('result', result)
      }
    });
  }

  // calculateEndDate(end) {
  //   return new FormControl(new Date(parseInt(end)));
  // }
  async onEndDateChange(value, folder, index) {
    if (!value) return;
    folder.end = value.getTime();
  }

  showExternalUserList() {
    this.showExternalUserPage = !this.showExternalUserPage;
  }
  backExternalUserList() {
    this.showExternalUserPage = false;
  }

  onInput(event) {
    const input = event.target;
    input.parentNode.dataset.value = input.value;
  }
  
  renameUserClick() {
    this.renameUserName = !this.renameUserName;
  }

}
