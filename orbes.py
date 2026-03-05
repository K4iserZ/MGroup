import json
import re

input_file = "orbs.txt"
output_file = "orbs.json"

orbs = []

with open(input_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    line = line.strip()
    
    if not line:
        continue

    parts = line.split(";")
    if len(parts) < 2:
        continue

    orb_id = parts[0].strip()
    description = parts[1].strip()

    # Extraer valor (soporta +5% o (5%))
    value_match = re.search(r"(\d+)%", description)
    value = int(value_match.group(1)) if value_match else None

    # Detectar categoría (basic o special)
    category_match = re.search(r"orb_(\w+)_", orb_id)
    category = category_match.group(1) if category_match else "unknown"

    # Detectar tipo
    type_match = re.search(r"orb_\w+_(\w+)", orb_id)
    orb_type = type_match.group(1) if type_match else "unknown"

    orb_data = {
        "id": orb_id,
        "category": category,
        "type": orb_type,
        "name": description,  # ← nombre completo
        "value": value
    }

    orbs.append(orb_data)

# Ordenar
orbs.sort(key=lambda x: (x["category"], x["type"], x["value"] if x["value"] else 0))

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(orbs, f, indent=2)

print(f"JSON generado correctamente en {output_file}")