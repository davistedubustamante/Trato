# Trato Mobile (Expo) — Fase 2

Placeholder para la app nativa. La PWA en `/trato` es el MVP.

## Plan

1. `npx create-expo-app@latest . --template blank-typescript`
2. Instalar `@supabase/supabase-js`, `expo-location`, `expo-task-manager`, `react-native-maps` (o MapLibre RN)
3. Reutilizar tipos de `../../src/types/trato.ts` (o mover a `packages/shared`)
4. Misma URL/anon key de Supabase
5. Pantallas espejo: login, passenger, driver, trip, share

## Por qué después de la PWA

- Validar fair-band + bids sin App Store  
- Mismo backend gratis  
- Nativo solo cuando haga falta GPS en background y push confiables
