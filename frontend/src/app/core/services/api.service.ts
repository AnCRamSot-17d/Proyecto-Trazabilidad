import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, expand, reduce, EMPTY } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api';
  getHealth() { return this.http.get<{ status: string; database: string; readOnly: boolean }>(this.baseUrl + '/health'); }
  list<T>(resource: string): Observable<T[]> {
    const page = (offset: number) => this.http.get<T[]>(this.baseUrl + '/' + resource, { params: { limit: 100, offset } });
    return page(0).pipe(map(rows => ({ rows, offset: 0 })), expand(({ rows, offset }) => rows.length === 100 ? page(offset + 100).pipe(map(next => ({ rows: next, offset: offset + 100 }))) : EMPTY), reduce((all, result) => all.concat(result.rows), [] as T[]));
  }
  create<T>(resource: string, data: unknown) { return this.http.post<T>(this.baseUrl + '/' + resource, data); }
  trace(direction: 'forward' | 'backward', id: string) { return this.http.get<unknown>(this.baseUrl + (direction === 'forward' ? '/inventory/' : '/lots/') + encodeURIComponent(id) + '/traceability'); }
}
