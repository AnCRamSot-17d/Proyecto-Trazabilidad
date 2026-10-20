import { Injectable, signal } from '@angular/core';

export type SubViewTab = 'form' | 'list';

@Injectable({
  providedIn: 'root',
})
export class UiStateService {
  // Estado de expansión del menú lateral (por defecto expandido en escritorio)
  sidebarExpanded = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);

  // Módulo activo seleccionado en el menú lateral
  activeModule = signal<string>('inicio');

  // Pestaña activa ('form': Llenar formato | 'list': Ver registros)
  activeTab = signal<SubViewTab>('list');

  // Búsqueda rápida dentro del árbol de navegación del menú lateral
  searchQuery = signal<string>('');

  toggleSidebar() {
    this.sidebarExpanded.update((v) => !v);
  }

  setSidebar(expanded: boolean) {
    this.sidebarExpanded.set(expanded);
  }

  navigateTo(moduleKey: string, tab: SubViewTab = 'list') {
    this.activeModule.set(moduleKey);
    this.activeTab.set(tab);
  }
}
