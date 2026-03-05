import json

# Cargar el JSON actual
with open('orbs.json', 'r', encoding='utf-8') as f:
    orbs_list = json.load(f)

# Crear estructura jerárquica
organized = {
    "basic": {},
    "special": {}
}

# Procesar cada orbe
for orb in orbs_list:
    category = orb['category']
    
    # Determinar si es basic o special
    if category.startswith('basic_'):
        # Extraer el tipo (attack, life, critical, etc.)
        orb_type = category.replace('basic_', '').split('_')[0]
        
        # Crear la categoría si no existe
        if orb_type not in organized["basic"]:
            organized["basic"][orb_type] = []
        
        organized["basic"][orb_type].append(orb)
    
    elif category.startswith('special'):
        # Extraer el tipo
        if category == "special":
            orb_type = orb['type']
        else:
            orb_type = category.replace('special_', '').split('_')[0]
        
        # Crear la categoría si no existe
        if orb_type not in organized["special"]:
            organized["special"][orb_type] = []
        
        organized["special"][orb_type].append(orb)

# Guardar el nuevo JSON con formato bonito
with open('orbs_organized.json', 'w', encoding='utf-8') as f:
    json.dump(organized, f, indent=2, ensure_ascii=False)

print("✓ JSON reorganizado guardado como 'orbs_organized.json'")
print("\nEstructura:")
print(f"Basic: {list(organized['basic'].keys())}")
print(f"Special: {list(organized['special'].keys())}")

# Contar orbes
basic_count = sum(len(v) for v in organized['basic'].values())
special_count = sum(len(v) for v in organized['special'].values())
print(f"\nTotal: {basic_count} basic + {special_count} special = {basic_count + special_count} orbes")
