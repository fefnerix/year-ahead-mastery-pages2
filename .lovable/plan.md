

# Seed Completo del Reto 1 — Datos Oficiales

Actualizar los datos existentes en la base de datos con el contenido real del Reto 1. Sin cambios de codigo, solo datos.

---

## 1. Actualizar metadatos de la semana

Actualizar la week `c0000000-0000-0000-0000-000000000001` con:
- `description_long`: Texto oficial sobre el proposito del reto (del PDF)
- `spiritual_playlist_url`: https://open.spotify.com/playlist/2zOZhUh6lYivxHuzH1gWhU?si=DkCwoh3RSCOoxZWKscBNRg
- `mental_playlist_url`: https://open.spotify.com/playlist/2ddYsgu9kAwmAujfR7xpty?si=Tsh-4C0dQGqwRGb4aiBr7w
- `objective`: "Descubrir tu proposito de vida y establecer habitos diarios"

---

## 2. Actualizar las 35 tareas (7 dias x 5 momentos)

Reemplazar los titulos genericos ("Momento 1 -- Despertar con intencion", etc.) con el contenido real del cronograma. Tambien corregir las categorias para reflejar el cronograma oficial.

### Lunes (Day 1)
| Orden | Categoria | Titulo |
|-------|-----------|--------|
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 5 paginas "El efecto compuesto" (25 min) |
| 3 | cuerpo | No comer carbohidratos en el dia |
| 4 | finanzas | Anota los gastos del dia |
| 5 | alma | Reflexion: Que harias cuando ya no tuvieras que trabajar? Escribelo |

### Martes (Day 2)
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 5 paginas "El efecto compuesto" (25 min) |
| 3 | cuerpo | Comer carbohidratos en 1 sola comida al dia |
| 4 | finanzas | Anota los gastos del dia |
| 5 | alma | Escribe al menos 5 cosas en las que eres bueno y puedes ayudar a los demas |

### Miercoles (Day 3)
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 10 paginas "El efecto compuesto" (25 min) |
| 3 | cuerpo | Comer carbohidratos en 1 sola comida al dia |
| 4 | finanzas | Anota los gastos del dia |
| 5 | alma | Escribe al menos 3 cosas que ames hacer incluso sin que te pagaran |

### Jueves (Day 4)
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 10 paginas "El efecto compuesto" (25 min) |
| 3 | mente | Escribe ideas: eres bueno, ayudas a los demas, puedes ganar dinero |
| 4 | finanzas | Anota los gastos del dia |
| 5 | cuerpo | Ultima comida 3 horas antes de dormir sin carbohidratos |

### Viernes (Day 5)
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 10 paginas "El efecto compuesto" (25 min) |
| 3 | cuerpo | Comer carbohidratos en 1 sola comida al dia |
| 4 | finanzas | Pregunta a 3 personas cercanas en que eres bueno y tu talento |
| 5 | finanzas | Anota los gastos del dia |

### Sabado (Day 6)
| 1 | alma | Haz 5 padres nuestro y agradece por 5 cosas |
| 2 | mente | Leer 10 paginas "El efecto compuesto" (25 min) |
| 3 | cuerpo | Comer carbohidratos en 1 sola comida al dia |
| 4 | finanzas | Revisa cuanto gastaste y escribe gastos evitables |
| 5 | alma | Carta "como si fueras Dios" diciendote que hacer con tu vida |

### Domingo (Day 7)
| 1 | alma | Ve a misa / iglesia / grupo de oracion |
| 2 | mente | Leer 15 paginas "El efecto compuesto" (30 min) |
| 3 | cuerpo | Comer carbohidratos en 1 sola comida al dia |
| 4 | finanzas | Compra caja fuerte y deposita 25 dolares |
| 5 | alma | Redacta tu proposito de vida claro, conciso y memorizalo |

---

## 3. Seed week_blocks para Reto 1

Crear los bloques de contenido configurables (ya existe 1 bloque hero, agregar los demas):

| Orden | Tipo | Config |
|-------|------|--------|
| 0 | hero | (ya existe, actualizar si necesario) |
| 1 | audio | audio_url del campo week.audio_url, description: "Escuchar antes de empezar" |
| 2 | text | description_long del reto, collapsed_preview_lines: 12 |
| 3 | playlists | URLs de Spotify espiritual + mental |
| 4 | cronograma | schedule_image_url + schedule_pdf_url del week |
| 5 | days_map | show_days_cards: true, lock_future_days: true |

---

## 4. Detalle tecnico

Todo se ejecuta como operaciones de datos (UPDATE/INSERT) usando la herramienta de insercion de datos, sin migraciones de esquema.

Archivos de codigo: ninguno modificado.

