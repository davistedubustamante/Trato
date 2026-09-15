# Trato

Rideshare móvil (PWA) con **banda de tarifa transparente** y **negociación corta**. Mejora el precio opaco de Uber y la pelea interminable de InDrive.

> Carpeta independiente dentro del monorepo LabFlow — no modifica el LIMS.

## Stack gratuito

| Capa | Servicio |
| --- | --- |
| App PWA | Next.js 16 → Vercel Hobby |
| Auth / DB / Realtime | Supabase Free |
| Mapas | MapLibre + tiles OSM |
| Routing / tarifa | Haversine local (sin Google Maps) |
| Fase 2 nativa | Expo (misma API Supabase) |

## Diferenciadores

1. **Fair band** — min / sugerido / max antes de ofertar  
2. **Dual bid** — pasajero ofrece; conductor responde con monto + ETA  
3. **Trust score** visible en cada oferta  
4. **Share live** — link público `/share/[token]`  
5. **PWA instalable** ahora; Expo después

## Demo local

```bash
cd trato
cp .env.example .env.local   # ya hay .env.local con el proyecto Supabase
npm install
npm run dev
```

Abrir http://localhost:3000

Cuentas demo:

| Rol | Email | Password |
| --- | --- | --- |
| Pasajero | `pasajero@trato.app` | `trato1234` |
| Conductor | `conductor@trato.app` | `trato1234` |

Flujo: login pasajero → tocar mapa (origen/destino) → ofertar en banda → login conductor (otra sesión) → contraofertar → aceptar → viaje → compartir / calificar.

## Estructura

```
trato/
  src/app/           PWA (passenger, driver, trip, share)
  src/components/    RideMap, UI sheet
  src/lib/           fare, geo, supabase
  src/types/         tipos compartibles con Expo
  docs/              arquitectura
  apps/mobile/       placeholder Expo (fase 2)
  PRODUCT.md         briefing de producto
  DESIGN.md          sistema visual
```

## Límites free (diseño)

- Supabase pausa tras ~7 días inactivos; 500 MB DB; ~200 conexiones Realtime  
- GPS del conductor ~cada 4–8 s (no flood)  
- Sin pagos in-app en MVP (efectivo / Yape acordado)

## Roadmap Expo

Ver `apps/mobile/README.md` — reutilizar `src/types` + cliente Supabase; añadir GPS background y push nativos.
