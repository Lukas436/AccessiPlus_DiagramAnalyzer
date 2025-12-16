import openai
import base64

# OpenAI API-Schlüssel setzen
openai.api_key = '(insert key)'

def analyze_diagram(image_base64):

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Du bist ein Assistent, der Diagramme analysiert. "
                    "Erkläre die Aussage des Diagramms kurz und einfach. "
                    "Schreibe maximal 3–5 verständliche Sätze. Vermeide Fachsprache."
                )
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Was zeigt dieses Diagramm?"},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/png;base64,{image_base64}"
                    }}
                ]
            }
        ],
        max_tokens=300
    )

    return response['choices'][0]['message']['content']
