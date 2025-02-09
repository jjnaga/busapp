import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';
import { setSelectedStop } from '../../../../core/state/lib/user/user.actions';
import { StopsComponent } from './stops.components';

describe('StopsComponent', () => {
  let component: StopsComponent;
  let fixture: ComponentFixture<StopsComponent>;
  let store: MockStore;
  const initialState = {}; // add more if needed

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(Store) as MockStore;
    jest.spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dispatch setSelectedStop when a stop is clicked in the UI', () => {
    // Use a dummy stop that matches the Stop interface expected by your component
    const stop = {
      stopId: '1',
      stopCode: '1',
      stopName: 'Stop 1',
      stopLat: 10,
      stopLon: 10,
      stopUrl: null,
      stopSerialNumber: null,
    };

    // Simulate stops observable data
    component.stops$ = of([stop]);
    fixture.detectChanges();

    // Update the selector to match your template.
    // For example, if your template uses a button inside an li to trigger the click,
    // query for that button.
    const buttonElement = fixture.debugElement.query(By.css('li button'));
    expect(buttonElement).toBeTruthy(); // Ensure the element exists

    buttonElement.triggerEventHandler('click', null);

    expect(store.dispatch).toHaveBeenCalledWith(setSelectedStop({ stop }));
  });
});
