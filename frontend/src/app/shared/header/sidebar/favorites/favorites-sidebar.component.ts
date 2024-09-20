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
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'favorites-sidebar',
  templateUrl: './favorites-sidebar.component.html',
  imports: [CommonModule, FontAwesomeModule, ReactiveFormsModule],
  standalone: true,
})
export class FavoritesSidebarComponent {
  constructor(private UserDataService: UserDataService) {}

  faXmark = faXmark;
  faPencilAlt = faPencilAlt;
  faCheck = faCheck;
  favorites$ = this.UserDataService.favorites$;
  editingFavoriteIndex: number | null = null;
  inputForm = new FormGroup({
    newName: new FormControl('', Validators.required),
  });

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
      inputElement.focus();
    }
  }

  onSubmit(event: Event, index: number) {
    event.preventDefault();
    const inputElement = document.getElementById(
      `favorite-${index}-input`
    ) as HTMLInputElement;
    const newName = inputElement.value;

    this.UserDataService.editFavoriteStop(index, newName);

    this.editingFavoriteIndex = null;
  }

  deleteFavorite(index: number) {
    this.UserDataService.deleteFavorite(index);
  }

  setSelectedStop(stopId: string, index: number) {
    this.UserDataService.setSelectedStop(stopId);
  }
}
