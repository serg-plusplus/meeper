import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "langchain";

import { getOpenAiApiKey } from "./openaiApiKey";
import { WHISPER_LANG_MAP } from "../config/lang";

export async function getSummary(content: string[]) {
  const openAIApiKey = await getOpenAiApiKey();

  const model = new OpenAI({
    temperature: 0,
    openAIApiKey,
    // maxTokens: 2_048,
    timeout: 120_000,
    modelName: "gpt-3.5-turbo",
    maxRetries: 3,
  });
  const textSplitter = new CharacterTextSplitter({
    chunkSize: 3_000,
    chunkOverlap: 200,
  });

  const contentFull = content.join("\n");

  const chunks = await textSplitter.splitText(contentFull);
  const docs = await textSplitter.createDocuments(chunks);

  const detected = await chrome.i18n.detectLanguage(contentFull);
  const langCode = detected.languages?.[0]?.language?.toLowerCase();
  const lang = WHISPER_LANG_MAP.get(langCode);

  const combinePrompt = new PromptTemplate({
    template: getCombinePromptTempalte(lang),
    inputVariables: ["text"],
  });
  const combineMapPrompt = new PromptTemplate({
    template: getCombineMapPromptTempalte(lang),
    inputVariables: ["text"],
  });

  const chain = loadSummarizationChain(model, {
    type: "map_reduce",
    combinePrompt,
    combineMapPrompt,
  });
  const res = await chain.call({
    input_documents: docs,
  });

  return res.text as string;
}

const getCombinePromptTempalte = (
  lang = "English",
) => `Write a concise summary of the following text in ${lang}.
Return your response in bullet points which covers the key points of the text.
------------
{text}
------------`;

const getCombineMapPromptTempalte = (
  lang = "English",
  targetLen = 500,
) => `Write a concise summary in ${lang} within ${targetLen} words of the following:
------------
{text}
------------
Highlight agreements and follow-up actions`;
