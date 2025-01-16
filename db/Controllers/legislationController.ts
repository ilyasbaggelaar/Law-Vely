import express, { Request, Response, RequestHandler } from "express";
import { admin } from "../../firebase";
import { LegislationSummaries } from "../../global";

const db = admin.database();

export const getLegislationSummaries = (req: Request, res: Response) => {
  admin
    .database()
    .ref("legislationSummaries")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        res.status(200).json(data);
      } else {
        res.status(404).json({ msg: "no legislation found" });
      }
    })
    .catch((error) => {
      console.error("Error fetching legislation summaries:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    });
};

export const getLegislationSummaryById = (req: Request, res: Response) => {
  const { id } = req.params;
  const ref = db.ref(`legislationSummaries/${id}`);

  ref
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        res.status(200).json(snapshot.val());
      } else {
        res
          .status(404)
          .json({ message: `Legislation summary with ID ${id} not found.` });
      }
    })
    .catch((error) => {
      console.error(`Error fetching legislation summary with ID ${id}:`, error);
      res.status(500).json({ error: "Failed to fetch data" });
    });
};

export const searchLegislationSummaries = (
  req: Request,
  res: Response
): void => {
  const query = req.query.query as string | undefined;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "invalid or missing search query" });
    return;
  }

  const normalizedQuery = query.trim().toLowerCase();

  db.ref("legislationSummaries")
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as LegislationSummaries;
        const searchResults = Object.entries(data).filter(([id, summary]) => {
          const content =
            `${summary.title} ${summary.summaryOfLegislation} ${summary.summaryOfSubSections}`.toLocaleLowerCase();
          return content.includes(normalizedQuery);
        });

        if (searchResults.length > 0) {
          const formattedResults = Object.fromEntries(searchResults);
          res.status(200).json(formattedResults);
        } else {
          res.status(404).json({ msg: "no legislation found" });
        }
      } else {
        res.status(404).json({ msg: "no legislation found" });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "failed to fetch data." });
    });
};

interface LegislationSummary {
  id: string;
  title: string;
  url: string;
  summaryOfLegislation: string;
  summaryOfSubSections: string;
  categories?: string[]; // optional, in case no category is assigned
  timestamp: any; // using `any` to account for Firebase's server timestamp
}
// Controller: Get legislation summaries by category
export const getLegislationSummariesByCategory: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Ensuring the return type is Promise<void>
  const { category } = req.params;

  try {
    const snapshot = await db.ref("legislationSummaries").once("value");
    const summaries = snapshot.val();

    if (!summaries) {
      // Send a response without returning the response object
      res.status(404).json({ msg: "No legislation found" });
      return; // Just use return to end the function
    }

    // Filter summaries by category
    const filteredSummaries = Object.entries(summaries).reduce(
      (acc: Record<string, LegislationSummary>, [id, summary]) => {
        const typedSummary = summary as LegislationSummary;
        if (
          typedSummary.categories &&
          typedSummary.categories.includes(category)
        ) {
          acc[id] = typedSummary;
        }
        return acc;
      },
      {}
    );

    // If no summaries match the category, return a 404
    if (Object.keys(filteredSummaries).length === 0) {
      res.status(404).json({ msg: "No legislation found for this category" });
      return; // Use return here to end the function early
    }

    // Send filtered summaries as JSON response
    res.status(200).json(filteredSummaries);
  } catch (error) {
    console.error("Error fetching legislation summaries by category:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
};
