import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbedding(
  embeddings: number[],
  fileKey: string,
) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  const index = await pinecone.index("projectchatpdf");

  try {
    const namespace = convertToAscii(fileKey);
    const queryResult = await index.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
      includeValues: true,
    });
    //console.log("queryResult: ", queryResult);
    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}
export async function getContext(query: string, fileKey: string) {
  const queryEmbedding = await getEmbeddings(query);

  if (!queryEmbedding) {
    throw new Error("Query embeddings are undefined.");
  }

  const matches = await getMatchesFromEmbedding(queryEmbedding, fileKey);

  const qualifyDocs = matches.filter(
    (match) => match.score && match.score > 0.7,
  );

  type Metadata = {
    text: string;
    pageNumber: number;
    __filename: string;
  };

  let docs = qualifyDocs.map((match) => (match.metadata as Metadata).text);

  return docs.join("\n").substring(0, 3000);
}