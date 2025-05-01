import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http: HttpClient) { }

  isThisPhishing(title: string) {
    // return this.http.post('2110582aiservicemodel-production.up.railway.app/predict', { text: title })
    return this.http.post('https://2110582aiservicemodel-production.up.railway.app/predict', { text: title })
  }
}