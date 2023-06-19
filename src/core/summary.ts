import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "langchain";

import { getOpenAiApiKey } from "./openaiApiKey";

export async function getSummary(content: string[]) {
  const openAIApiKey = await getOpenAiApiKey();

  const model = new OpenAI({
    temperature: 0,
    openAIApiKey,
    maxTokens: 1_024,
    timeout: 120_000,
    modelName: "gpt-3.5-turbo",
    maxRetries: 5,
  });
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2_048,
  });

  const contentFull = content.join("\n");
  const docs = await textSplitter.createDocuments([contentFull]);

  const detected = await chrome.i18n.detectLanguage(contentFull);
  const langCode = detected.languages?.[0]?.language;

  const promt = langCode
    ? new PromptTemplate({
        template: getPromptTempalte(langCode),
        inputVariables: ["text", "langCode"],
      })
    : null;

  const chain = loadSummarizationChain(model, {
    type: "map_reduce",
    ...(promt ? { combinePrompt: promt, combineMapPrompt: promt } : {}),
  });
  const res = await chain.call({
    input_documents: docs,
  });

  return res.text as string;
}

const getPromptTempalte = (
  langCode: string
) => `Write a concise summary of the following:

"{text}"

CONCISE SUMMARY IN ${langCode} LANGUAGE:`;
