import { Cancion } from "@/types/songTypes";
import { mockCanciones } from "@/mock/songMocks";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useCancionesStore = defineStore("canciones", () => {
  const canciones = ref<Cancion[]>(mockCanciones);

  function getCancionById(id: string) {
    return canciones.value.find((c) => c.id === id);
  }

  return { canciones, getCancionById };
});
