import os

from dotenv import load_dotenv

load_dotenv()

from pinecone import Pinecone

from agents.shared.embeddings import get_embedding

_pc = None
_index = None

def _get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        _index = _pc.Index(os.getenv("PINECONE_INDEX"))
    return _index


def retrieve_documents(query, top_k=3):

    index = _get_index()

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