import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { RawChunk } from '../../types';

export async function chunkText(
    text: string,
    sourceId: string,
    workspaceId: string,
    metadata: Record<string, unknown> = {}
): Promise<RawChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
        separators: ['\n\n', '\n', '. ', ', ', ' ', ''],
    });

    const docs = await splitter.createDocuments([text], [metadata]);

    return docs
        .filter(doc => doc.pageContent.trim().length > 20)
        .map((doc, index) => ({
            sourceId,
            workspaceId,
            content: doc.pageContent.trim(),
            chunkIndex: index,
            tokenCount: Math.ceil(doc.pageContent.length / 4),
            metadata: { ...doc.metadata } as Record<string, unknown>,
        }));
}