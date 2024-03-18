// /api/createchat
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { db } from "@/lib/db";
import { NextResponse } from "next/server"; 
import { chats } from "@/lib/db/schema";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";

export async function POST(req: Request, res: Response) {

    try
    {
        const {userId} = await auth();
        if(!userId) {
            return NextResponse.json({ error: "unauthorized"}, {status: 401})
        }
    
        const body = await req.json();
        const {file_key, file_name} = body;
        console.log(file_key,file_name);

        const pages = await loadS3IntoPinecone(file_key);

        const chat_id = await db.insert(chats)
        .values({
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: getS3Url(file_key),
            userId,
            createdAt: new Date(),
        })
        .returning({id: chats.id})
        
        console.log(chat_id);
        return NextResponse.json(
            {chat_id: chat_id[0].id },
            {status: 200},
        );
    } catch (error) 
    {
        console.error(error);
        return NextResponse.json(
            {error: "internal server error"},
            {status: 500}
            );
    }   
}