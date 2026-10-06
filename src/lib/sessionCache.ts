/**
 * Caché en memoria para datos que cambian poco (categorías, beneficios,
 * hoteles...) pero que varias pantallas piden de nuevo cada vez que se
 * entra a ellas — antes cada ida y vuelta entre secciones disparaba el
 * mismo pedido HTTP otra vez, aunque los datos ya estuvieran en memoria de
 * la visita anterior. Vive solo mientras dura la sesión de la pestaña (una
 * recarga de página la vacía), y de paso junta pedidos simultáneos a la
 * misma key en uno solo.
 */
const store = new Map<string, Promise<unknown>>()

export function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = store.get(key)
  if (cached) return cached as Promise<T>

  const promise = fetcher().catch(err => {
    // Un pedido fallido no debe quedar cacheado como si hubiera funcionado.
    store.delete(key)
    throw err
  })
  store.set(key, promise)
  return promise
}

/** Para cuando una acción del usuario deja esa key desactualizada (p. ej. crear una categoría). */
export function invalidateCache(key: string): void {
  store.delete(key)
}

/** Invalida todas las keys que empiecen con ese prefijo (p. ej. "benefits:visited:" para cualquier usuario). */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
