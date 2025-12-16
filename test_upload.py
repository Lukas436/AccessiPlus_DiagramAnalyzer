import base64
import requests

# Bildpfad zu deinem Testdiagramm
image_path = "screenshot.png"  # z. B. ein Screenshot oder Diagrammbild

# Öffne das Bild und konvertiere zu base64
with open(image_path, "rb") as img_file:
    encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
    base64_image = f"data:image/png;base64,{encoded_string}"

# Sende POST-Request an Flask-Backend
response = requests.post("http://localhost:5000/upload", json={"image": base64_image})

# Antwort ausgeben
if response.ok:
    result = response.json()
    print("\n📊 Interpretation vom Server:")
    print(result.get("interpretation", "Keine Interpretation erhalten."))
else:
    print("❌ Fehler beim Upload:", response.status_code, response.text)
