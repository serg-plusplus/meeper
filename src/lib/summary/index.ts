import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function getSummary(content: string[]) {
  const model = new OpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 1024,
  });
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 2_000 });
  const docs = await textSplitter.createDocuments(content);

  // This convenience function creates a document chain prompted to summarize a set of documents.
  const chain = loadSummarizationChain(model);
  const res = await chain.call({
    input_documents: docs,
  });

  return res.text as string;
}
