import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
// import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

@Component({
  selector: 'app-create-supplie-modal',
  templateUrl: './create-supplie-modal.component.html',
  styleUrls: ['./create-supplie-modal.component.css']
})
export class CreateSupplieModalComponent implements OnInit {

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
  suppliersName: string = '';

  @ViewChild('suppliersInput') suppliersInput: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<CreateSupplieModalComponent>,
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

  closeModal() {
    this.dialogRef.close();
  }

}
