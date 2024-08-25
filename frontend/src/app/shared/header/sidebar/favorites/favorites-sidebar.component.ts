import { Component } from '@angular/core';
import { UserDataService } from '../../../../core/services/user-data.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faXmark,
  faPencilAlt,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'favorites-sidebar',
  templateUrl: './favorites-sidebar.component.html',
  imports: [CommonModule, FontAwesomeModule, ReactiveFormsModule],
  standalone: true,
})
export class FavoritesSidebarComponent {
  faXmark = faXmark;
  faPencilAlt = faPencilAlt;
  faCheck = faCheck;
  favorites$ = this.userDataService.favorites$;
  editingFavoriteIndex: number | null = null;
  inputForm = new FormGroup({
    newName: new FormControl('', Validators.required),
  });

  constructor(private userDataService: UserDataService) {}

  startEditing(index: number) {
    this.inputForm.reset();
    this.editingFavoriteIndex = index;
    setTimeout(() => this.focusInput(index), 0);
  }

  cancelEditing() {
    this.editingFavoriteIndex = null;
  }

  private focusInput(index: number) {
    const inputElement = document.getElementById(
      `favorite-${index}-input`
    ) as HTMLInputElement;
    if (inputElement) {
      console.log('Input element found, focusing');
      inputElement.focus();
    } else {
      console.log('Input element not found');
    }
  }

  onSubmit(event: Event, index: number) {
    event.preventDefault();
    const inputElement = document.getElementById(
      `favorite-${index}-input`
    ) as HTMLInputElement;
    const newName = inputElement.value;

    this.userDataService.editFavoriteStop(index, newName);

    this.editingFavoriteIndex = null;
  }

  deleteFavorite(index: number) {
    this.userDataService.deleteFavorite(index);
  }
}
