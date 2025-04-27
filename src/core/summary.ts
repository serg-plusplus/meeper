// New imports for modern langchain
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getOpenAiApiKey } from "./openaiApiKey";
import { WHISPER_LANG_MAP } from "../config/lang";

export async function getSummary(content: string[]) {
  const openAIApiKey = await getOpenAiApiKey();

  const model = new ChatOpenAI({
    modelName: "gpt-4o", // Use a stronger model if possible
    openAIApiKey,
    temperature: 0.2,
    timeout: 120_000,
  });

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3000,
    chunkOverlap: 200,
  });

  const contentFull = content.join("\n");

  const chunks = await textSplitter.splitText(contentFull);
  const docs = chunks.map((text) => ({ pageContent: text }));

  const detected = await chrome.i18n.detectLanguage(contentFull);
  const langCode = detected.languages?.[0]?.language?.toLowerCase();
  const lang = WHISPER_LANG_MAP.get(langCode) ?? "English";

  // Better prompt templates
  const mapPrompt = PromptTemplate.fromTemplate(`
You are assisting in summarizing a meeting. Summarize the following part of a meeting transcript in ${lang}:

Instructions:
- Focus on main points, key discussions, and important actions mentioned.
- Be concise but capture important ideas.
- Bullet points preferred.
- Ignore small talk or irrelevant conversation.

Meeting Segment:
------------
{text}
------------

  `);

  const combinePrompt = PromptTemplate.fromTemplate(`
You are an expert meeting assistant. Create a professional, organized summary of the full meeting based on these partial summaries in ${lang}.

Instructions:
- Group information into three sections: Topics Discussed, Key Decisions, Action Items.
- Keep the language formal and easy to read.
- Bullet points for each section.
- If specific speakers are mentioned in the partial summaries, retain attribution (e.g., \"Anna suggested...\").
- Focus on outcomes and next steps. Ignore small talk.

Partial Summaries:
------------
{text}
------------

  `);

  // Build pipeline manually
  const mapChain = mapPrompt
    .pipe(model)
    .pipe(async (res) => (res.content as string).trim());

  const combineChain = combinePrompt
    .pipe(model)
    .pipe(async (res) => (res.content as string).trim());

  const summarizationChain = RunnableSequence.from([
    async (
      docs: {
        pageContent: string;
      }[],
    ) => {
      const mapped = await Promise.all(
        docs.map((doc) => mapChain.invoke({ text: doc.pageContent })),
      );
      const joined = mapped.join("\n\n");
      return { text: joined };
    },
    combineChain,
  ]);

  const finalSummary = await summarizationChain.invoke(docs);

  return finalSummary;
}
