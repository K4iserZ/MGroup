# Notas de implementación de orbes y habilidades

## Objetivo

Documentar el comportamiento que se validó en el prototipo de pruebas para que luego pueda integrarse en la vista principal sin perder el contexto de las reglas.

## Estado actual validado

Se comprobó que el sistema de orbes debe trabajar como una capa adicional sobre las stats base del espécimen, sin reemplazar la fórmula principal del cálculo existente.

## Reglas de negocio definidas

### 1. Separación de habilidades

La habilidad base del espécimen y la habilidad adicional otorgada por un special orb deben mantenerse separadas.

- La habilidad base debe calcularse a partir del valor actual de ataque.
- La habilidad extra aportada por el special orb debe calcularse por separado.
- El total final debe ser la suma de ambas.

### 2. Orbes básicos

Los orbes básicos deben estar filtrados según:

- la habilidad base del espécimen
- el special orb seleccionado

#### Tipos base permitidos

Siempre se consideran:

- attack
- critical
- life

Además, si el espécimen tiene una habilidad base, se añade esa familia.

#### Compatibilidad con special orbs

Cuando el special orb es uno de estos:

- addretaliate
- addshield
- addslash
- addstrengthen
- addweaken
- addregenerate

se habilitan los orbes básicos correspondientes a esa familia. Por ejemplo:

- addweaken permite basic weaken
- addshield permite basic shield
- addregenerate permite basic regenerate

### 3. Recalculo de stats

Los orbes afectan los stats de forma separada:

- Los orbes básicos de ataque multiplican el ataque base.
- Los orbes básicos de vida multiplican la vida base.
- La habilidad base debe recalcularse con la nueva base de ataque.
- La habilidad añadida por el special orb debe aplicarse sobre el nuevo ataque.

### 4. Speed

Si el special orb es de tipo speed, el efecto debe aplicarse directamente sobre la velocidad.

## Comportamiento esperado en la interfaz

### Apariencia de los orbes

- Los orbes básicos deben mostrarse agrupados por categoría.
- No deben aparecer todos los orbes de golpe como una lista plana.
- La lista debe responder a la elección del special orb.

### Selección de special orb

- Al seleccionar un special orb, se debe abrir la lógica de compatibilidad con los orbes básicos.
- El sistema debe permitir que los orbes básicos compatibles con el special elegido sean visibles y seleccionables.
- Si no hay compatibilidad, la lista debe quedar restringida o vacía.

### Visualización de habilidades

La UI debe mostrar las habilidades de forma separada, por ejemplo:

- Base ability
- Added ability
- Total ability

Esto evita confundir la habilidad natural del espécimen con la bonus otorgada por el special orb.

## Reglas de cálculo validadas en tests

### Test 1: ataque

Un orb básico de attack multiplica el ataque base.

### Test 2: special + basic compatibility

Un special como addweaken permite que los orbes básicos relacionados con weaken participen en la habilidad añadida.

### Test 3: speed

Un special speed modifica directamente la velocidad.

### Test 4: normalización de habilidades

Variantes como shield_plus o regen deben normalizarse a su familia base:

- shield
- regenerate

### Test 5: separación de habilidades

La vista debe conservar por separado:

- la habilidad base
- la habilidad extra del special

### Test 6: recálculo de base ability

Si el ataque cambia por los orbes, la habilidad base debe recalcularse sobre el nuevo valor de ataque.

### Test 7: opciones de orbes

Los orbes básicos deben filtrarse correctamente según el special elegido.

## Implementación recomendada para la vista principal

1. Mantener la fórmula actual de stats intacta.
2. Añadir una capa de reglas de orbes independiente.
3. Aplicar los efectos de selección sobre la salida del cálculo base.
4. Recalcular las habilidades después de modificar ataque/vida.
5. Mostrar los resultados en la UI con etiquetas separadas.

## Notas técnicas

- La lógica se probó con una implementación independiente en el prototipo.
- La integración en la vista principal debe reutilizar esa misma lógica para evitar divergencias.
- El objetivo es que el comportamiento del prototipo y del principal sea consistente.
