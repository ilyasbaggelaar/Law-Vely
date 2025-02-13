import axios from "axios";
import dotenv from "dotenv"; // Needed if using ES6 modules
import natural from "natural";
import stringSimilarity from "string-similarity";

dotenv.config();
const OPENAI_API_KEY = process.env.BENS_OPENAI_API_KEY;

const topics = [
  "Finance",
  "Housing",
  "Transportation",
  "Health",
  "Environment",
  "Energy",
  "Education",
  "Justice",
  "Trade",
  "Consumer",
  "Governance",
  "Technology",
];

export const extractTitle = async (
  legislationTextRaw: string
): Promise<string> => {
  try {
    const titleResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract the title of the following text.",
          },
          { role: "user", content: legislationTextRaw },
        ],
        max_tokens: 50,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    let extractedTitle = titleResponse.data.choices[0].message.content.trim();
    extractedTitle = extractedTitle
      .replace(/^(the title of the text is\s*|title:\s*)/i, "")
      .trim();
    return extractedTitle;
  } catch (error: any) {
    console.error("Error extracting title:", error.message);
    throw new Error("Failed to extract title from legislation text.");
  }
};

export const generateSummaries = async (
  legislationTextRaw: string
): Promise<{
  summaryOfLegislation: string;
  summaryOfSubSections: string;
  extractTitle: string;
}> => {
  try {
    const title = await extractTitle(legislationTextRaw);
    const summaryPayloads = [
      {
        messages: [
          {
            role: "system",
            content: `Begin the summary with "The ${title} relates to..." You are an assistant that explains the legal texts concisely in a summary, and in layman's terms. Ensure the text is shorter than the original text from the url.`,
          },
          {
            role: "user",
            content: `Summarize and explain the following legal text concisely, and in laymans terms:\n\n${legislationTextRaw}`,
          },
        ],
      },
      {
        messages: [
          {
            role: "system",
            content: `Explain each sub-section of the act in a step-by-step manner, starting with "The subsections of ${title} cover...". Make it simple and easy to understand.`,
          },
          {
            role: "user",
            content: `Summarize and explain the following legal text concisely and in laymans terms:\n\n${legislationTextRaw}`,
          },
        ],
      },
    ];

    const summaryResponse = await Promise.all(
      summaryPayloads.map((payload) =>
        axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: payload.messages,
            max_tokens: 400,
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
          }
        )
      )
    );

    const summaryOfLegislation =
      summaryResponse[0].data.choices[0].message.content.trim();
    const summaryOfSubSections =
      summaryResponse[1].data.choices[0].message.content.trim();

    return { summaryOfLegislation, summaryOfSubSections, extractTitle: title };
  } catch (error: any) {
    console.error("Error generating summaries:", error.message);
    throw new Error("Failed to generate summaries for legislation text.");
  }
};

export const generateCategories = async (
  summaryOfSubSections: string,
  summaryOfLegislation: string,
  title: string
): Promise<string[]> => {
  try {
    const combinedText = `Title: ${title}\nSummaryOfSubsections: ${summaryOfSubSections}`;
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that classifies texts into specific categories. The available categories are: ${topics.join(
              ", "
            )}. Assign one or more of these categories to the text. Make sure all legislation goes into at least one legislation`,
          },
          {
            role: "user",
            content: `Based on the following text, assign the most relevant categories:\n\n${combinedText}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const categoriesString = response.data.choices[0].message.content.trim();
    const categories = categoriesString
      .split(",")
      .map((category: string) => category.trim())
      .filter((category: string) => topics.includes(category));

    return categories;
  } catch (error: any) {
    console.error("Error generating categories:", error);
    throw new Error("Failed to generate categories for the summary.");
  }
};

export const extractLegislationDate = async (
  legislationTextRaw: string
): Promise<string> => {
  try {
    const dateResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Extract the date of the legislation in a format like '8th February 1974'. Ensure that no other text other than the day, month and year is extracted. If no date exists, respond with 'No date found.'",
          },
          { role: "user", content: legislationTextRaw },
        ],
        max_tokens: 50,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const extractedDate = dateResponse.data.choices[0].message.content.trim();
    return extractedDate;
  } catch (error: any) {
    console.error("Error extracting date:", error.message);
    throw new Error("Failed to extract date from legislation text.");
  }
};
