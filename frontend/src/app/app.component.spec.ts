import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { setMobileMode } from './core/state/lib/layout/layout.actions';
import { appInit } from './core/state/root.actions';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let storeSpy: any;

  beforeEach(async () => {
    storeSpy = {
      dispatch: jest.fn(),
      select: jest.fn(() => of(true)),
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: Store, useValue: storeSpy }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should dispatch appInit on init', () => {
    expect(storeSpy.dispatch).toHaveBeenCalledWith(appInit());
  });

  it('should dispatch setMobileMode with true when window.innerWidth < 768', () => {
    window.innerWidth = 500; // simulate mobile
    component.onResize();
    expect(storeSpy.dispatch).toHaveBeenCalledWith(setMobileMode({ isMobile: true }));
  });

  it('should dispatch setMobileMode with false when window.innerWidth >= 768', () => {
    window.innerWidth = 1024; // simulate desktop
    component.onResize();
    expect(storeSpy.dispatch).toHaveBeenCalledWith(setMobileMode({ isMobile: false }));
  });
});
