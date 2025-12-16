from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import openai_analysis

app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload_image():
    data = request.get_json()
    
    if 'image' not in data:
        return jsonify({'error': 'Kein Bild erhalten'}), 400

    # Base64-Teil extrahieren
    image_data = data['image'].split(',')[1]

    # OpenAI-Modul aufrufen
    interpretation = openai_analysis.analyze_diagram(image_data)

    return jsonify({"interpretation": interpretation})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
