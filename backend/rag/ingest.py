import sys
import os

sys.path.append(os.path.abspath("."))

from dotenv import load_dotenv

load_dotenv()

from pinecone import Pinecone
from agents.shared.embeddings import get_embedding

pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY")
)

index = pc.Index(
    os.getenv("PINECONE_INDEX")
)

DOCS_PATH = "rag/documents"


def read_documents():

    documents = []

    for file in os.listdir(DOCS_PATH):

        if file.endswith(".txt"):

            path = os.path.join(DOCS_PATH, file)

            with open(path, "r", encoding="utf-8") as f:

                text = f.read()

                documents.append({
                    "id": file,
                    "text": text
                })

    return documents


def upload_documents():

    docs = read_documents()

    vectors = []

    for doc in docs:

        embedding = get_embedding(doc["text"])

        vectors.append({
            "id": doc["id"],
            "values": embedding,
            "metadata": {
                "text": doc["text"]
            }
        })

    index.upsert(vectors=vectors)

    print("Documents uploaded successfully")


upload_documents()