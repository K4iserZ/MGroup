import csv
import json

archivo_csv = "gachav2.csv"
archivo_json = "gachav2.json"

data = []

with open(archivo_csv, "r", encoding="utf-8-sig", newline="") as csvfile:
    reader = csv.DictReader(csvfile, delimiter="|")

    for row in reader:
        data.append(row)

with open(archivo_json, "w", encoding="utf-8") as jsonfile:
    json.dump(
        data,
        jsonfile,
        ensure_ascii=False,
        indent=4
    )

print(f"Conversión completada: {archivo_json}")