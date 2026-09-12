import { defineConfig } from 'vite';
export default defineConfig({root:'apps/playtest',base:'./',server:{port:4173,strictPort:true},build:{outDir:'../../dist',emptyOutDir:true}});
