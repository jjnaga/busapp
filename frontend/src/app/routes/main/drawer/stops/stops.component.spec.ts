import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StopsComponent } from './stops.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAllStopsSortedByDistance } from '../../../../core/state/lib/stops/stops.selectors';
import { Stop } from '../../../../core/utils/global.types';

describe('StopsComponent', () => {
  let component: StopsComponent;
  let fixture: ComponentFixture<StopsComponent>;
  let store: MockStore;

  const mockSortedStops: Stop[] = [
    {
      stopId: '1',
      stopLat: 21.3069,
      stopLon: -157.8583,
      stopCode: '001',
      stopName: 'Near Stop',
      stopUrl: '',
      stopSerialNumber: 1,
    },
    {
      stopId: '2',
      stopLat: 21.5,
      stopLon: -157.9,
      stopCode: '002',
      stopName: 'Far Stop',
      stopUrl: '',
      stopSerialNumber: 2,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StopsComponent],
      providers: [
        provideMockStore({
          selectors: [
            {
              selector: selectAllStopsSortedByDistance,
              value: mockSortedStops,
            },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(StopsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  test('should use sorted stops from selector', (done) => {
    component.sortedStops$.subscribe((stops) => {
      expect(stops.length).toBe(2);
      expect(stops[0].stopId).toBe('1');
      expect(stops[1].stopId).toBe('2');
      done();
    });
  });
});
