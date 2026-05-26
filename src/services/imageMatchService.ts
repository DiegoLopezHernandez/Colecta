// Eliminado: el ranking visual por similitud comparaba bytes del JPEG (no
// píxeles), reportando un porcentaje engañoso al usuario. Si en el futuro se
// necesita un matching real, hace falta una librería con decodificación de
// imagen (pHash sobre píxeles) — no se puede hacer fiable en JS puro.
export {};
