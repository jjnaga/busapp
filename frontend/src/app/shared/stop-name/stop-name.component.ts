import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { setStopCustomName } from '../../core/state/lib/user/user.actions';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { faEdit, faSave } from '@fortawesome/free-solid-svg-icons';
import { Observable, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { selectStopPreferences } from '../../core/state/lib/user/user.selectors';

@Component({
  selector: 'stop-name',
  templateUrl: './stop-name.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
})
export class StopNameComponent implements OnChanges, AfterViewInit {
  // Input properties: stop identifier and its default name.
  @Input() stopId!: string;
  @Input() defaultName!: string;
  @Input() canEdit: boolean = true; // Controls whether edit functionality is available

  // Observable for the custom name if the user has set one.
  customName$!: Observable<string | null>;

  // Local state variables.
  isEditing: boolean = false;
  // We'll leave editedName empty initially so the placeholder shows up.
  editedName: string = '';

  // FontAwesome icons.
  faEdit = faEdit;
  faSave = faSave;

  private store = inject(Store);
  // Inject the component's root element to detect clicks outside.
  private element: ElementRef = inject(ElementRef);

  // Reference to the input field for auto-focus.
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stopId'] || changes['defaultName']) {
      // Update the customName observable based on store preferences.
      this.customName$ = this.store
        .select(selectStopPreferences)
        .pipe(map((preferences) => preferences[this.stopId]?.customName || null));
    }
  }

  ngAfterViewInit(): void {
    // No extra logic needed here; auto-focus is triggered in enableEdit after view updates.
  }

  /**
   * Enables edit mode. Stops propagation so parent clicks aren’t triggered.
   * Instead of pre-filling the input, we clear it and let the placeholder show the current name.
   */
  enableEdit(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the click from bubbling up.
    this.isEditing = true;
    // Clear the input value so the placeholder (showing the current name) appears.
    this.editedName = '';
    // Auto-focus the input after a tick to allow view update.
    setTimeout(() => {
      this.inputField?.nativeElement.focus();
    }, 0);
  }

  /**
   * Cancels the edit mode.
   */
  cancelEdit(): void {
    this.isEditing = false;
    // Optionally clear the editedName.
    this.editedName = '';
  }

  /**
   * Saves the new custom name and exits edit mode.
   * If no changes were made (i.e., input is empty), it cancels the update.
   * @param event Optional mouse event to stop propagation.
   */
  saveName(event: MouseEvent): void {
    // Stop propagation so the parent element's click isn't triggered
    event.stopPropagation();

    const trimmed = this.editedName.trim();
    if (!trimmed) {
      // If input is empty after trimming, cancel editing
      this.cancelEdit();
      return;
    }
    // Dispatch the action to update the stop's custom name
    this.store.dispatch(setStopCustomName({ stopId: this.stopId, customName: trimmed }));
    this.isEditing = false;
  }

  /**
   * Handles keydown events in the input:
   * - 'Enter' saves the name.
   * - 'Escape' cancels editing.
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveName(event as any);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  /**
   * Listens for clicks anywhere in the document.
   * If in edit mode and the click occurs outside this component,
   * cancel edit mode.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if the click occurred outside this component.
    if (this.isEditing && !this.element.nativeElement.contains(event.target)) {
      this.cancelEdit();
    }
  }
}
