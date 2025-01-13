import dotenv from "dotenv";
import * as admin from "firebase-admin";
import axios from "axios";
import serviceAccount from "./serviceAccountKey.json";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL:
    "https://law-vely-default-rtdb.europe-west1.firebasedatabase.app/",
});

const db = admin.database();
const OPENAI_API_KEY = process.env.BENS_OPENAI_API_KEY;

// URLs to process
const legislationUrls = [
  "https://www.legislation.gov.uk/ukpga/Geo6/14-15/35/contents",
  "https://www.legislation.gov.uk/ukpga/2019/4/contents",
  "https://www.legislation.gov.uk/uksi/1992/3013/made/data.xht?view=snippet&wrap=true",
  "https://www.legislation.gov.uk/ukpga/2018/21/data.xht?view=snippet&wrap=true",
];

// Function to create a slug from a title
const createSlug = (title: string) =>
  title.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "");

// Function to summarize legislation
const summarizeLegislation = async (url: string) => {
  try {
    // Fetch the legislation text
    const legislationResponse = await axios.get(url, {
      headers: { "Content-Type": "text/plain" },
    });
    const legislationText = legislationResponse.data;

    // Extract the title
    const titleResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract the title of the following text.",
          },
          { role: "user", content: legislationText },
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
    const title = titleResponse.data.choices[0].message.content.trim();

    // Generate summaries
    const summaryResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Summarize the following legal text concisely in layman's terms.",
          },
          { role: "user", content: legislationText },
        ],
        max_tokens: 400,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    const summary = summaryResponse.data.choices[0].message.content.trim();

    // Generate a unique identifier
    const slug = createSlug(title);

    return {
      id: slug,
      title,
      summary,
      timestamp: admin.database.ServerValue.TIMESTAMP,
    };
  } catch (error) {
    console.error("Error summarizing legislation:", error.message);
    return null;
  }
};

// Seed the database
const seedDatabase = async () => {
  try {
    const results = await Promise.all(
      legislationUrls.map((url) => summarizeLegislation(url))
    );

    const validResults = results.filter((result) => result !== null);

    for (const legislation of validResults) {
      await db.ref(`legislationSummaries/${legislation.id}`).set(legislation);
      console.log(`Stored legislation: ${legislation.title}`);
    }

    console.log("Database seeding complete.");
  } catch (error) {
    console.error("Error seeding database:", error.message);
  } finally {
    process.exit();
  }
};

seedDatabase();
