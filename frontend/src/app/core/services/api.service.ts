import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  Supplier,
  RawMaterial,
  RawMaterialLot,
  ProductionOrder,
  FinishedProductLot,
  BackwardTraceabilityResponse,
  ForwardTraceabilityResponse,
} from '../models/traceability.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  // Health
  getHealth(): Observable<{ status: string; database: string }> {
    return this.http.get<{ status: string; database: string }>(`${this.baseUrl}/health`);
  }

  // Suppliers
  getSuppliers(limit = 50, offset = 0): Observable<Supplier[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`, { params });
  }

  createSupplier(data: { name: string; email?: string }): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, data);
  }

  // Raw Materials
  getMaterials(limit = 50, offset = 0): Observable<RawMaterial[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<RawMaterial[]>(`${this.baseUrl}/materials`, { params });
  }

  createMaterial(data: { code: string; name: string; unit: string }): Observable<RawMaterial> {
    return this.http.post<RawMaterial>(`${this.baseUrl}/materials`, data);
  }

  // Raw Material Lots
  getMaterialLots(limit = 50, offset = 0): Observable<RawMaterialLot[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<RawMaterialLot[]>(`${this.baseUrl}/material-lots`, { params });
  }

  createMaterialLot(data: {
    code: string;
    materialId: string;
    supplierId: string;
    quantity: number;
  }): Observable<RawMaterialLot> {
    return this.http.post<RawMaterialLot>(`${this.baseUrl}/material-lots`, data);
  }

  // Products
  getProducts(limit = 50, offset = 0): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  createProduct(data: { code: string; name: string; unit: string }): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, data);
  }

  // Production Orders
  getProductionOrders(limit = 50, offset = 0): Observable<ProductionOrder[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<ProductionOrder[]>(`${this.baseUrl}/production-orders`, { params });
  }

  createProductionOrder(data: {
    code: string;
    productId: string;
    quantity: number;
    consumptions: Array<{ rawMaterialLotId: string; quantity: number }>;
  }): Observable<ProductionOrder> {
    return this.http.post<ProductionOrder>(`${this.baseUrl}/production-orders`, data);
  }

  // Finished Product Lots
  getLots(limit = 50, offset = 0): Observable<FinishedProductLot[]> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<FinishedProductLot[]>(`${this.baseUrl}/lots`, { params });
  }

  createLot(data: {
    code: string;
    productionOrderId: string;
    quantity: number;
  }): Observable<FinishedProductLot> {
    return this.http.post<FinishedProductLot>(`${this.baseUrl}/lots`, data);
  }

  // Traceability
  getBackwardTraceability(lotId: string): Observable<BackwardTraceabilityResponse> {
    return this.http.get<BackwardTraceabilityResponse>(`${this.baseUrl}/lots/${lotId}/traceability`);
  }

  getForwardTraceability(rawMaterialLotId: string): Observable<ForwardTraceabilityResponse> {
    return this.http.get<ForwardTraceabilityResponse>(
      `${this.baseUrl}/material-lots/${rawMaterialLotId}/traceability`
    );
  }
}
