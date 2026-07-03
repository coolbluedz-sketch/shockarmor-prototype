// Barrel du package partagé : point d'entrée unique importé par les deux apps
// via l'alias Vite "@shared".
export * from "./core.jsx";
export { supabase, isSupabaseConfigured } from "./supabaseClient.js";
export * as api from "./api.js";
export { default as ImageUploader } from "./ImageUploader.jsx";
export { useCloudinaryUpload } from "./useCloudinaryUpload.js";
