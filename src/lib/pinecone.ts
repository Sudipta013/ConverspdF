import {Pinecone, RecordMetadata} from '@pinecone-database/pinecone'
import { downloadFromS3 } from './s3-server';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
import { metadata } from '@/app/layout';
import {Document, RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter'
import { getEmbeddings } from './embeddings';
import md5 from 'md5'
import { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import { convertToAscii } from './utils';
import {PineconeRecord} from '@pinecone-database/pinecone'
import { Batch } from 'aws-sdk';

let pinecone : Pinecone | null = null;

export const getPinecone = async() => {
    if(!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        }) 
    }
    return pinecone;
}

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
        //in case of error of inserting vector into pinecone: PineconeBadreqerror
        // loc: {pageNumber: number; fileKey: string}
    }
}

export async function loadS3IntoPinecone(filekey:string) {
    
    console.log('downloading s3 into file system');
    const file_name = await downloadFromS3(filekey);
    
    if(!file_name){
        throw new Error('could not download from s3');
    }
    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];
    console.log("loaded PDF");

    //2. splitt and segment the pdf
    const documents = await Promise.all(pages.map(prepareDocument));
    console.log("loaded documents: ",documents);

    //3. vectorise and embed individual documents
    const namespace = convertToAscii(filekey);
    const vectors = await Promise.all(documents.flat().map((documents)=>embedDocument(documents,namespace)),);
    console.log("Loaded vectors: ", vectors);

    //4. upload to Pinecone
    const client =  await getPinecone();
    const pineconeIndex = client.Index('projectchatpdf');

    //5. inserting vectors into Pinecone
    console.log('Inserting vectors into Pinecone...');
    await pineconeIndex.upsert(vectors);

    console.log("Uploaded to Pinecone");
    return documents[0];

}

export async function embedDocument(doc: Document, namespace: string){
    try {

        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
                __filename: namespace,
            }
        }as PineconeRecord
        
    } catch (error) {
        console.log('error embedding document', error);
        throw error
    }
}

export const truncateStringByBytes = (str: string, bytes: number)=> {
    const enc = new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes))
}

async function prepareDocument(page: PDFPage){
    let {pageContent, metadata} = page
    pageContent = pageContent.replace(/\n/g, '')
    //split the docs
    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber : metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs;
}