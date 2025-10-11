import google.generativeai as genai
genai.configure(api_key="AIzaSyCeLmzAGwB1Pq-Z7TdkTNA4bZ00JfKlAsI")
for model in genai.list_models():
    print(model.name)
