import os

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


def retrieve_documents(query, top_k=3):

    embedding = get_embedding(query)

    results = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True
    )

    documents = []

    for match in results["matches"]:

        documents.append(
            match["metadata"]["text"]
        )

    return documents