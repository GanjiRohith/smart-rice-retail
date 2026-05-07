"""
shared/llm.py
Single AzureChatOpenAI instance reused across all agents.
"""

import os
from functools import lru_cache
from langchain_openai import AzureChatOpenAI


@lru_cache(maxsize=1)
def get_llm() -> AzureChatOpenAI:
    return AzureChatOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        temperature=0.2,
    )